const path = require('path')
const http = require('http')

const Promise = require('bluebird')
const xml2js = Promise.promisifyAll(require('xml2js'))
const decompress = require('decompress')
const mkdirp = require('mkdirp')

const fs = Promise.promisifyAll(require('fs'))
const enrich = require('./enrich')
const normalize = require('./normalize')

function download (url, fileName) {
  const filePath = path.join(__dirname, 'tmp', fileName)

  process.stdout.write(`Downloading ${url}...`)
  const file = fs.createWriteStream(filePath)

  return new Promise((resolve, reject) => {
    http.get(`${url}`, response => response.pipe(file).on('finish', (err) => {
      if (err) return reject(err)

      process.stdout.write(`\t✓ Successfull.\n`)
      return resolve(filePath)
    }))
  })
}

function decompressWithlogs (filePath) {
  process.stdout.write(`Decompressing ${path.relative(__dirname, filePath)}, (${fs.statSync(filePath).size} bytes)...`)
  return decompress(filePath, { strip: 1 }).then(files => {
    process.stdout.write(`\t✓ ${files.length} extracted.\n`)
    return files
  })
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

  process.stdout.write(`\t✓ Successfull.\n`)
  return Object.keys(grouped).map((dir) => {
    return {
      path: dir,
      files: grouped[dir]
    }
  })
}

function toJson (file) {
  return xml2js.parseStringAsync(file.data).then(content => {
    const type = content.Organisme ? 'organisme' : 'commune'
    const normalizeFunction = normalize[type]
    return {
      path: file.path,
      type: type,
      json: normalizeFunction(content)
    }
  })
}

function writeOut (group) {
  return Promise.map(group.files, toJson, { concurrency: 1 }).then(files => {
    const newPath = path.join('tmp', 'cache', group.path + '.json')
    mkdirp.sync(path.dirname(newPath))

    const content = files.reduce((content, entityFile) => {
      content[entityFile.type + 's'].push(entityFile.json)
      return content
    }, {
      communes: [],
      organismes: []
    })

    return fs.writeFileAsync(newPath, JSON.stringify(content, null, 2), 'utf-8')
  }).catch(error => {
    console.error(`The following error occured while processing ${group.path}:`)
    console.error(error)
  })
}

function build (url, fileName) {
  return Promise.map(
    download(url, fileName)
      .then(decompressWithlogs)
      .then(filter)
      .then(group),
    writeOut, { concurrency: 1 }
  ).catch(err => {
    console.error(err)
    process.exitCode = 1
  })
}

function generateInitialDataset () {
  const folder = 'tmp/cache'
  let dataset = {
    communes: {},
    departements: {},
    organismes: {}
  }

  return Promise.map(fs.readdirAsync(folder), departementFile => {
    const { name } = path.parse(departementFile)
    const departementPath = path.join(folder, departementFile)
    const departementData = require('./' + departementPath)

    let departement = {
      communes: {},
      organismes: {}
    }

    departementData.communes.forEach(commune => {
      dataset.communes[commune.codeInsee] = commune
      departement.communes[commune.codeInsee] = commune
    })

    departementData.organismes.forEach(organisme => {
      departement.organismes[organisme.properties.pivotLocal] = departement.organismes[organisme.properties.pivotLocal] || []
      departement.organismes[organisme.properties.pivotLocal].push(organisme)

      dataset.organismes[organisme.properties.id] = organisme
    })

    dataset.departements[name] = departement
  }).then(() => dataset)
}

const HdS = require('./scripts/hauts-de-seine')

function prepareDataset () {
  return generateInitialDataset()
    .then(dataset => enrich.addOrganismesFromFolder(dataset, 'data'))
    .then(HdS.addOrganismes)
}

module.exports = {
  build,
  prepareDataset,
  toJson
}
