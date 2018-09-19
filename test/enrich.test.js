const assert = require('assert')
const enrich = require('../enrich')

describe('enrich', function () {
  let dataset

  before(() => {
    dataset = {
      communes: {
        '29011': {
          organismes: {}
        }
      },
      departements: {
        '29': {
          organismes: {}
        }
      },
      organismes: {}
    }
    enrich.addOrganismesFromFolder(dataset, './data')
  })

  it('adds organisme in dataset', () => {
    assert.ok(Object.keys(dataset.organismes).length >= 1)
    assert.ok(dataset.organismes.cdas_brest_bellevue.properties)
  })

  it('adds the organisme ID in commune', () => {
    assert.ok(Object.keys(dataset.communes['29011'].organismes).length >= 1)
    assert.ok(dataset.communes['29011'].organismes.cdas.length >= 1)
    assert.ok(dataset.communes['29011'].organismes.cdas.indexOf('cdas_brest_lambezellec') >= 0)
  })

  it('adds an organisme in departement', () => {
    assert.ok(Object.keys(dataset.departements['29'].organismes).length >= 1)
    assert.ok(dataset.departements['29'].organismes.cdas[0].properties)
  })
})
