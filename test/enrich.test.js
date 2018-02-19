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
    enrich('./data', dataset)
  })

  it('adds organisme in dataset', () => {
    assert.equal(Object.keys(dataset.organismes).length, 1)
    assert.ok(dataset.organismes.cdas_brest_bellevue.properties, 1)
  })

  it('adds the organisme ID in commune', () => {
    assert.equal(Object.keys(dataset.communes['29011'].organismes).length, 1)
    assert.equal(dataset.communes['29011'].organismes.cdas.length, 1)
    assert.equal(dataset.communes['29011'].organismes.cdas[0], 'cdas_brest_bellevue')
  })

  it('adds an organisme in departement', () => {
    assert.equal(Object.keys(dataset.departements['29'].organismes).length, 1)
    assert.ok(dataset.departements['29'].organismes.cdas[0].properties)
  })
})
