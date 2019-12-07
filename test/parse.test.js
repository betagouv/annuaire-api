const fs = require('fs').promises
const path = require('path')

const assert = require('assert')
const { parseOrganisme } = require('../build/parse')

describe('parseOrganisme()', function () {
  let file

  before(async () => {
    const filePath = path.join(__dirname, 'files', 'organismes-msa.xml')
    file = await fs.readFile(filePath)
  })

  it('should work', async () => {
    const organisme = await parseOrganisme(file)
    assert.strictEqual(organisme.geometry.coordinates[0], 5.2306651)
    assert.strictEqual(organisme.geometry.coordinates[1], 46.2069614)
  })
})
