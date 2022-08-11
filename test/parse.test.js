const fs = require('fs').promises
const path = require('path')

const assert = require('assert')
const { parseOrganismes } = require('../build/parse')

describe('parseOrganismes()', function () {
  let file

  before(async () => {
    const filePath = path.join(__dirname, 'files', 'organismes-bsa.json')
    file = await fs.readFile(filePath)
  })

  it('should work', async () => {
    const [organisme] = await parseOrganismes(file)

    assert.strictEqual(organisme.properties.id, '0b19da66-336b-4a4d-a56a-1bbf731ec306')
    assert.strictEqual(organisme.properties.codeInsee, '27115')
    assert.strictEqual(organisme.properties.pivotLocal, 'mairie')
    assert.strictEqual(organisme.properties.nom, 'Mairie - Breux-sur-Avre')
    assert.deepStrictEqual(organisme.properties.adresses, [{ type: 'Adresse', lignes: ['Le Bourg', '10 ancienne route du Mans'], codePostal: '27570', commune: 'Breux-sur-Avre' }])
    assert.deepStrictEqual(organisme.properties.horaires, [{ du: 'Lundi', au: 'Lundi', heures: [{ de: '16:30:00', a: '18:30:00' }] }, { du: 'Jeudi', au: 'Jeudi', heures: [{ de: '16:30:00', a: '18:30:00' }] }])
    assert.strictEqual(organisme.properties.email, 'mairie@breux-sur-avre.fr')
    assert.strictEqual(organisme.properties.telephone, '02 32 32 50 76')
    assert.strictEqual(organisme.properties.url, 'https://www.breux-sur-avre.fr ')
    assert.strictEqual(organisme.geometry.coordinates[0], 1.081901)
    assert.strictEqual(organisme.geometry.coordinates[1], 48.76231)
  })
})
