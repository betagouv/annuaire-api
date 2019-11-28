const path = require('path')
const { readdir } = require('fs').promises
const { statSync } = require('fs')

const xml2js = require('xml2js')
const bluebird = require('bluebird')
const rp = require('request-promise')
const decompress = require('decompress')
const mkdirp = require('mkdirp')

const enrich = require('./enrich')
const normalize = require('./normalize')
const { writeJson } = require('./util')

const SPL_URL = 'http://lecomarquage.service-public.fr/donnees_locales_v2/all_latest.tar.bz2'

async function downloadFile (url) {
  process.stdout.write(`Downloading ${url}...`)
  const data = await rp({ uri: url, encoding: null })
  process.stdout.write('\t✓ Successfull.\n')
  return data
}

async function decompressWithLogs (archiveBuffer) {
  process.stdout.write(`Decompressing archive, (${archiveBuffer.length} bytes)...`)
  const files = await decompress(archiveBuffer, { strip: 1 })
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
  const newPath = path.join(__dirname, '..', 'tmp', 'cache', group.path + '.json')
  mkdirp.sync(path.dirname(newPath))

  const content = files.reduce((content, entityFile) => {
    content[entityFile.type + 's'].push(entityFile.json)
    return content
  }, {
    communes: [],
    organismes: []
  })

  await writeJson(newPath, content)
}

async function prepareInitialDataset () {
  const archive = await downloadFile(SPL_URL)
  const files = await decompressWithLogs(archive)

  await Promise.all(group(filter(files)).map(writeOut))
}

async function generateInitialDataset () {
  const folder = path.join(__dirname, '..', 'tmp', 'cache')
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
    const departementData = require(departementPath)

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

module.exports = {
  prepareInitialDataset,
  generateInitialDataset,
  toJson
}
