const { writeFile, readFile } = require('fs').promises

const { keyBy } = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const yaml = require('js-yaml')

const communesIndex = keyBy(communes, 'code')

async function writeJson (filePath, data) {
  await writeFile(filePath, JSON.stringify(data), { encoding: 'utf-8' })
}

async function readYaml (filePath) {
  const content = await readFile(filePath, { encoding: 'utf-8' })
  return yaml.safeLoad(content)
}

function expandCommune (codeCommune) {
  const commune = communesIndex[codeCommune]
  return commune ? `${codeCommune} ${commune.nom}` : `${codeCommune} ???`
}

function getCommunes (codeDepartement) {
  const communesDepartement = communes.filter(c => c.type === 'commune-actuelle' && c.codeDepartement === codeDepartement)
  return communesDepartement.map(c => expandCommune(c.code))
}

module.exports = { writeJson, readYaml, expandCommune, getCommunes }
