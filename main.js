const path = require('path')
const { writeFile, readdir } = require('fs').promises
const { statSync } = require('fs')

const bluebird = require('bluebird')
const rp = require('request-promise')
const xml2js = require('xml2js')
const decompress = require('decompress')
const mkdirp = require('mkdirp')

const enrich = require('./enrich')
const normalize = require('./normalize')

async function download (url, fileName) {
  const filePath = path.join(__dirname, 'tmp', fileName)

  process.stdout.write(`Downloading ${url}...`)
  const data = await rp({ uri: url, encoding: null })
  await writeFile(filePath, data)
  process.stdout.write('\t✓ Successfull.\n')

  return filePath
}

async function decompressWithlogs (filePath) {
  process.stdout.write(`Decompressing ${path.relative(__dirname, filePath)}, (${statSync(filePath).size} bytes)...`)
  const files = await decompress(filePath, { strip: 1 })
  process.stdout.write(`\t✓ ${files.length} extracted.\n`)
  return files
}

function filter (files) {
  process.stdout.write(`Filtering ${files.length} files...`)
  const filtered = files.filter(file => file.type === 'file' && file.path.indexOf('.DS_Store') < 0)
  process.stdout.write(`\t✓ ${filtered.length} remaining.\n`)
  return filtered
}

function group (files) {
  process.stdout.write(`Grouping ${files.length} files by departement...`)

  const grouped = files.reduce((grouped, file) => {
    const entityPathDetails = path.parse(file.path)
    const departementPathDetails = path.parse(entityPathDetails.dir)
    grouped[departementPathDetails.name] = grouped[departementPathDetails.name] || []
    grouped[departementPathDetails.name].push(file)

    return grouped
  }, {})

  process.stdout.write('\t✓ Successfull.\n')
  return Object.keys(grouped).map((dir) => {
    return {
      path: dir,
      files: grouped[dir]
    }
  })
}

async function toJson (file) {
  const content = await xml2js.parseStringPromise(file.data)
  const type = content.Organisme ? 'organisme' : 'commune'
  const normalizeFunction = normalize[type]

  return {
    path: file.path,
    type: type,
    json: normalizeFunction(content)
  }
}

async function writeOut (group) {
  const files = await bluebird.mapSeries(group.files, toJson)
  const newPath = path.join('tmp', 'cache', group.path + '.json')
  mkdirp.sync(path.dirname(newPath))

  const content = files.reduce((content, entityFile) => {
    content[entityFile.type + 's'].push(entityFile.json)
    return content
  }, {
    communes: [],
    organismes: []
  })

  return writeFile(newPath, JSON.stringify(content, null, 2), 'utf-8')
}

async function build (url, fileName) {
  const filePath = await download(url, fileName)
  const files = await decompressWithlogs(filePath)

  await Promise.all(group(filter(files)).map(writeOut))
}

async function generateInitialDataset () {
  const folder = 'tmp/cache'
  const dataset = {
    communes: {},
    departements: {},
    organismes: {},
    organismesById: {}
  }

  const files = await readdir(folder)

  files.forEach(departementFile => {
    const { name } = path.parse(departementFile)
    const departementPath = path.join(folder, departementFile)
    const departementData = require('./' + departementPath)

    const departement = {
      communes: {},
      organismes: {}
    }

    departementData.communes.forEach(commune => {
      dataset.communes[commune.codeInsee] = commune
      departement.communes[commune.codeInsee] = commune
    })

    departementData.organismes.forEach(organisme => {
      const props = organisme.properties
      dataset.organismesById[organisme.properties.id] = organisme

      enrich.appendOrganisme(departement, props.pivotLocal, organisme)
      enrich.appendOrganisme(dataset, props.pivotLocal, organisme)
    })

    dataset.departements[name] = departement
  })

  return dataset
}

const additions = [
  require('./scripts/cotes-d-armor'),
  require('./scripts/haute-garonne'),
  require('./scripts/hauts-de-seine'),
  require('./scripts/metropole-lyon'),
  require('./scripts/saone-et-loire'),
  require('./scripts/seine-et-marne'),
  require('./scripts/seine-saint-denis')
]

async function addOpenDataOrganismes (dataset) {
  enrich.addOrganismesFromFolder(dataset, 'data')
  await Promise.all(additions.map(addition => addition.addOrganismes(dataset)))
}

async function prepareDataset () {
  const dataset = await generateInitialDataset()
  addOpenDataOrganismes(dataset)
  return dataset
}

module.exports = {
  additions,
  build,
  prepareDataset,
  toJson
}
