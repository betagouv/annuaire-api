const { keyBy, flatten } = require('lodash')
const bluebird = require('bluebird')
const got = require('got')
const decompress = require('decompress')

const { parseCommune, parseOrganismes } = require('./parse')
const { expandCommune } = require('./util')

const SPL_URL = 'https://lecomarquage.service-public.fr/donnees_locales_v4/all_latest.tar.bz2'

async function downloadFile (url) {
  process.stdout.write(`Downloading ${url}...`)
  const response = await got(url, { responseType: 'buffer' })
  process.stdout.write('\t✓ Successfull.\n')
  return response.body
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

  const organismesFile = files
    .find(f => f.path.endsWith('data.gouv_local.json'))

  const organismes = await parseOrganismes(organismesFile.data)
  organismes.forEach(organisme => {
    organisme.properties.zonage = { communes: [] }
  })

  console.log(`${organismes.length} organismes trouvés`)

  const organismesIndex = keyBy(organismes, o => o.properties.id)

  const communesArchive = files.find(f => f.path.endsWith('data.gouv_commune.zip'))
  const communesFiles = await decompressArchive(communesArchive.data)

  await bluebird.each(communesFiles, async communeFile => {
    const commune = await parseCommune(communeFile.data)
    const { codeInsee, organismes } = commune

    flatten(Object.values(organismes)).forEach(idOrganisme => {
      if (!(idOrganisme in organismesIndex)) {
        console.log(`Organisme introuvable : ${idOrganisme}`)
        return
      }

      organismesIndex[idOrganisme].properties.zonage.communes.push(expandCommune(codeInsee))
    })
  })

  /* On traite les organismes qui n'ont pas de zonage affecté */
  const organismesSansZonage = organismes.filter(o => o.properties.zonage.communes.length === 0)
  if (organismesSansZonage.length > 0) {
    console.log(`${organismesSansZonage.length} organismes sans commune d’affectation`)
    console.log('On utilise dans ce cas leur commune-siège')
    organismesSansZonage.forEach(o => {
      o.properties.zonage.communes.push(o.properties.codeInsee)
    })
  }

  return organismes
}

module.exports = {
  generateInitialDataset
}
