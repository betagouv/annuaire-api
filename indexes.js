const { groupBy } = require('lodash')

function getCodeDepartement (commune) {
  return commune.startsWith('97') ? commune.substr(0, 3) : commune.substr(0, 2)
}

function createPivotsIndex (dataset) {
  return groupBy(dataset, f => f.properties.pivotLocal)
}

function createDepartementsIndex (dataset) {
  return groupBy(dataset, f => {
    if (f.properties.zonage.communes.length === 0) {
      console.log(`${f.properties.pivotLocal} ${f.properties.nom}`)
      return '00'
    }
    return getCodeDepartement(f.properties.zonage.communes[0])
  })
}

function createCommunesIndex (dataset) {
  return dataset.reduce((acc, item) => {
    item.properties.zonage.communes.forEach(commune => {
      const codeCommune = commune.substr(0, 5)
      if (!(codeCommune in acc)) {
        acc[codeCommune] = []
      }
      acc[codeCommune].push(item)
    })
    return acc
  }, {})
}

module.exports = {
  createCommunesIndex,
  createDepartementsIndex,
  createPivotsIndex
}
