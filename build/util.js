const { writeFile } = require('fs').promises

const { keyBy } = require('lodash')

const communes = require('@etalab/decoupage-administratif/data/communes.json')
const communesActuelles = communes.filter(c => ['commune-actuelle', 'arrondissement-municipal'].includes(c.type))
const communesAnciennes = communes.filter(c => !['commune-actuelle', 'arrondissement-municipal'].includes(c.type))

const communesActuellesIndex = keyBy(communesActuelles, 'code')
const communesAnciennesIndex = keyBy(communesAnciennes, 'code')

async function writeJsonArray (filePath, data) {
  const str = '[\n' + data.map(d => JSON.stringify(d)).join(',\n') + '\n]\n'
  await writeFile(filePath, str, { encoding: 'utf-8' })
}

function expandCommune (codeCommune) {
  const commune = communesActuellesIndex[codeCommune] || communesAnciennesIndex[codeCommune]
  return commune ? `${codeCommune} ${commune.nom}` : `${codeCommune} ???`
}

module.exports = { writeJsonArray, expandCommune }
