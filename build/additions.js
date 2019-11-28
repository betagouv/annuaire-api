const enrich = require('./enrich')

const additions = [
  require('./sources/cotes-d-armor'),
  require('./sources/haute-garonne'),
  require('./sources/hauts-de-seine'),
  require('./sources/metropole-lyon'),
  require('./sources/saone-et-loire'),
  require('./sources/seine-et-marne'),
  require('./sources/seine-saint-denis')
]

async function addOpenDataOrganismes (dataset) {
  enrich.addOrganismesFromFolder(dataset, 'data')
  await Promise.all(additions.map(addition => addition.computeAndAddOrganismes(dataset)))
}

module.exports = {
  additions,
  addOpenDataOrganismes
}
