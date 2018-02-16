const path = require('path')
const http = require('http')

const Promise = require('bluebird')
const xml2js = Promise.promisifyAll(require('xml2js'))
const decompress = require('decompress')
const mkdirp = require('mkdirp')

const fs = Promise.promisifyAll(require('fs'))
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
    const { dir } = path.parse(file.path)
    grouped[dir] = grouped[dir] || []
    grouped[dir].push(file)

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
    const normalizeEntity = file.path.indexOf('organismes') >= 0 ? normalize.organisme : normalize.commune
    return {
      path: file.path,
      json: normalizeEntity(content)
    }
  })
}

function writeOut (group) {
  return Promise.map(group.files, toJson).then(files => {
    const newPath = path.join('tmp', 'cache', group.path + '.json')
    mkdirp.sync(path.dirname(newPath))
    return fs.writeFileAsync(newPath, JSON.stringify(files.map(f => f.json), null, 2), 'utf-8')
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
    writeOut, { concurrency: 5 }
  ).catch(err => {
    console.error(err)
    process.exitCode = 1
  })
}

function prepareDataset () {
  const folder = 'tmp/cache'
  let dataset = {
    communes: {},
    departements: {},
    organismes: {}
  }

  let entityFolder = path.join(folder, 'communes')
  fs.readdirSync(entityFolder).forEach(departementFile => {
    const { name } = path.parse(departementFile)
    const communesPath = path.join(entityFolder, departementFile)
    const communes = require('./' + communesPath)

    let departement = {
      communes: {},
      organismes: {}
    }

    communes.forEach(commune => {
      dataset.communes[commune.codeInsee] = commune
      departement.communes[commune.codeInsee] = commune
    })

    dataset.departements[name] = departement
  })

  entityFolder = path.join(folder, 'organismes')
  fs.readdirSync(entityFolder).forEach(departementFile => {
    const { name } = path.parse(departementFile)
    const organismesPath = path.join(entityFolder, departementFile)
    const organismes = require('./' + organismesPath)

    let departement = dataset.departements[name]

    organismes.forEach(organisme => {
      departement.organismes[organisme.properties.pivotLocal] = departement.organismes[organisme.properties.pivotLocal] || []
      departement.organismes[organisme.properties.pivotLocal].push(organisme)

      dataset.organismes[organisme.properties.id] = organisme
    })
  })

  return dataset
}

module.exports = {
  build,
  prepareDataset,
  toJson
}
