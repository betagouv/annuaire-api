const { writeFile, readFile } = require('fs').promises

const { keyBy } = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const yaml = require('js-yaml')

const communesIndex = keyBy(communes, 'code')

async function writeJsonArray (filePath, data) {
  const str = '[\n' + data.map(d => JSON.stringify(d)).join(',\n') + '\n]\n'
  await writeFile(filePath, str, { encoding: 'utf-8' })
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
  const communesDepartement = communes.filter(c => c.type === 'commune-actuelle' && c.departement === codeDepartement)
  return communesDepartement.map(c => expandCommune(c.code))
}

module.exports = { writeJsonArray, readYaml, expandCommune, getCommunes }
