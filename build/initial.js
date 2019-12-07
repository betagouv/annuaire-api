const { keyBy, flatten } = require('lodash')
const bluebird = require('bluebird')
const rp = require('request-promise')
const decompress = require('decompress')

const { parseCommune, parseOrganisme } = require('./parse')
const { expandCommune } = require('./util')

const SPL_URL = 'http://lecomarquage.service-public.fr/donnees_locales_v2/all_latest.tar.bz2'

async function downloadFile (url) {
  process.stdout.write(`Downloading ${url}...`)
  const data = await rp({ uri: url, encoding: null })
  process.stdout.write('\t✓ Successfull.\n')
  return data
}

async function decompressArchive (archiveBuffer) {
  process.stdout.write(`Decompressing archive, (${archiveBuffer.length} bytes)...`)
  const files = await decompress(archiveBuffer, { strip: 1 })
  process.stdout.write(`\t✓ ${files.length} extracted.\n`)
  return files
}

async function generateInitialDataset () {
  const archive = await downloadFile(SPL_URL)
  const files = await decompressArchive(archive)

  const organismesFiles = files
    .filter(f => f.path.startsWith('organismes') && f.path.endsWith('.xml'))

  const organismes = await bluebird.map(organismesFiles, async organismeFile => {
    const organisme = await parseOrganisme(organismeFile.data)
    organisme.properties.zonage = { communes: [] }
    return organisme
  }, { concurrency: 8 })

  console.log(`${organismes.length} organismes trouvés`)

  const organismesIndex = keyBy(organismes, o => o.properties.id)

  const communesFiles = files
    .filter(f => f.path.startsWith('communes') && f.path.endsWith('.xml'))

  await bluebird.map(communesFiles, async communeFile => {
    const commune = await parseCommune(communeFile.data)
    const { codeInsee, organismes } = commune

    flatten(Object.values(organismes)).forEach(idOrganisme => {
      if (!(idOrganisme in organismesIndex)) {
        console.log(`Organisme introuvable : ${idOrganisme}`)
        return
      }

      organismesIndex[idOrganisme].properties.zonage.communes.push(expandCommune(codeInsee))
    })
  }, { concurrency: 8 })

  return organismes
}

module.exports = {
  generateInitialDataset
}
