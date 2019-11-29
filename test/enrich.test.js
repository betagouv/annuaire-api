const assert = require('assert')
const enrich = require('../build/enrich')

describe('enrich', function () {
  let dataset

  before(async () => {
    dataset = {
      communes: {
        29011: {
          organismes: {}
        }
      },
      departements: {
        29: {
          organismes: {}
        }
      },
      organismes: {},
      organismesById: {}
    }
    await enrich.computeAndAddOrganismesFromFolder(dataset, './data')
  })

  it('adds organisme in dataset', () => {
    assert.ok(Object.keys(dataset.organismesById).length >= 1)
    assert.ok(dataset.organismesById.cdas_brest_bellevue.properties)
  })

  it('adds organisme in cdas list', () => {
    assert.ok(dataset.organismes.cdas.length >= 1)
    assert.ok(dataset.organismes.cdas.filter(({ properties: { id } }) => id === 'cdas_brest_bellevue').length > 0)
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
