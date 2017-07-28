const path = require('path')
const http = require('http')
const parser = require('xml2json')
const decompress = require('decompress')
const mkdirp = require('mkdirp')

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs"));

const fileName = 'all_latest.tar.bz2'
const filePath = path.join(__dirname, 'tmp', fileName)
const url = `http://lecomarquage.service-public.fr/donnees_locales_v2/${fileName}`

function download (url) {
  process.stdout.write(`Downloading ${url}...`)
  const file = fs.createWriteStream(filePath)

  return new Promise((resolve, reject) => {
    http.get(url, response => response.pipe(file).on('finish', (err) => {
      if (err) return reject(err)

      process.stdout.write(`\t✓ Successfull.\n`)
      return resolve(filePath)
    }))
  })
}

function decompressWithlogs (filePath) {
  process.stdout.write(`Decompressing ${path.relative(__dirname, filePath)}, (${fs.statSync(filePath).size} bytes)...`)
  return decompress(filePath).then(files => {
    process.stdout.write(`\t✓ ${files.length} extracted.\n`)
    return files
  }).catch(err => {
    console.log(err)
  })
}

function filter (files) {
  process.stdout.write(`Filtering ${files.length} files...`)
  const filtered = files.filter(file => file.path.indexOf('/organismes/') >= 0 && file.type === 'file')
  process.stdout.write(`\t✓ ${filtered.length} remaining.\n`)
  return filtered
}

function toJson (file) {
  return { path: file.path, json: parser.toJson(file.data, { object: true, sanitize: true }) }
}

function parsePointGeoJson (localisation, properties) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [localisation.Longitude, localisation.Latitude]
    },
    properties
  }
}

function toGeoJson (file) {
  let physicalLocalisation

  // Keep only the physical localisation, ignore every other type of adress
  if (Array.isArray(file.json.Organisme.Adresse)) {
    physicalLocalisation = file.json.Organisme.Adresse.find(localisation => localisation.type === 'physique')
  } else if (typeof file.json.Organisme.Adresse.Localisation !== 'undefined') {
    physicalLocalisation = file.json.Organisme.Adresse.Localisation
  }

  if (typeof physicalLocalisation === 'undefined') {
    return undefined
  }

  return {
    path: file.path,
    json: parsePointGeoJson(physicalLocalisation, file.json)
  }
}

function parse (files) {
  process.stdout.write(`Parsing ${files.length} files to GeoJSON...`)
  const withGeoJson = files.map(file => toGeoJson(toJson(file))).filter(file => typeof file !== 'undefined')
  process.stdout.write(`\t✓ ${withGeoJson.length} Successfull.\n`)
  return withGeoJson
}

function writeOut (files) {
  const logPath = path.join(__dirname, 'tmp', path.parse(files[0].path).dir)
  process.stdout.write(`Writing ${files.length} to ${logPath}...\n`)

  return Promise.map(files, file => {
    const { dir, name } = path.parse(file.path)
    const newPath = path.join(__dirname, 'tmp', dir, `${name}.json`)

    mkdirp.sync(path.dirname(newPath))

    return fs.writeFileAsync(newPath, JSON.stringify(file.json, null, 2), 'utf-8');
  }, { concurrency: 5 })
}

download(url)
  .then(decompressWithlogs)
  .then(filter)
  .then(parse)
  .then(writeOut)
  .then((files, outputDir) => {
    console.log(`✓ Successfully wrote ${files.length} files.`)
    process.exit(0)
  })
  .catch(err => {
    process.stderr.write(err)
    process.exit(1)
  })
