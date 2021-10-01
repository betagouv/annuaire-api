const { writeFile } = require('fs').promises

const { keyBy } = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')

const communesIndex = keyBy(communes, 'code')

async function writeJsonArray (filePath, data) {
  const str = '[\n' + data.map(d => JSON.stringify(d)).join(',\n') + '\n]\n'
  await writeFile(filePath, str, { encoding: 'utf-8' })
}

function expandCommune (codeCommune) {
  const commune = communesIndex[codeCommune]
  return commune ? `${codeCommune} ${commune.nom}` : `${codeCommune} ???`
}

module.exports = { writeJsonArray, expandCommune }
