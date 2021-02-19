const { join } = require('path')
const { readdir } = require('fs').promises

const { readYaml } = require('./util')
const validate = require('./validate')

const DATA_DIR = join(__dirname, '..', 'data')

async function readAndConvert (filePath) {
  const organisme = await readYaml(filePath)
  validate(organisme)
  organisme.horaires = organisme.horaires || (organisme['accueil physique'] && organisme['accueil physique'].horaires)

  return {
    type: 'Feature',
    geometry: null,
    properties: organisme
  }
}

async function computeOrganismes (folder) {
  const organismes = []
  const departementsFolders = folder ? [folder] : await readdir(DATA_DIR)

  await Promise.all(departementsFolders.map(async departementFolder => {
    const departementPath = join(DATA_DIR, departementFolder)

    const organismesFiles = await readdir(departementPath)

    await Promise.all(organismesFiles.map(async organismeFile => {
      const organismePath = join(departementPath, organismeFile)
      const organisme = await readAndConvert(organismePath)
      organismes.push(organisme)
    }))
  }))

  return organismes
}

module.exports = {
  computeOrganismes
}
