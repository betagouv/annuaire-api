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

function toJson (file) {
  return xml2js.parseStringAsync(file.data).then(content => {
    const normalizeEntity = file.path.indexOf('organismes') >= 0 ? normalize.organisme : normalize.commune
    return {
      path: file.path,
      json: normalizeEntity(content)
    }
  })
}

function writeOut (file) {
  return toJson(file).then(file => {
    const details = path.parse(file.path)
    const newPath = path.join('tmp', 'cache', details.dir, details.name + '.json')
    mkdirp.sync(path.dirname(newPath))
    return fs.writeFileAsync(newPath, JSON.stringify(file.json, null, 2), 'utf-8')
  }).catch(error => {
    console.error(`The following error occured while processing ${file.path}:`)
    console.error(error)
  })
}

function build (url, fileName) {
  return Promise.map(
    download(url, fileName)
      .then(decompressWithlogs)
      .then(filter),
    writeOut, { concurrency: 25 }
  ).catch(err => {
    console.error(err)
    process.exitCode = 1
  })
}

module.exports = {
  build,
  toJson
}
