const fs = require('fs').promises
const path = require('path')

const assert = require('assert')
const { toJson } = require('../build/main')

describe('toJson', function () {
  let file

  before(async () => {
    const filePath = path.join(__dirname, 'files', 'organismes-msa.xml')
    const content = await fs.readFile(filePath)
    file = {
      path: filePath,
      data: content
    }
  })

  it('should work', async () => {
    const result = await toJson(file)
    assert.strictEqual(result.json.geometry.coordinates[0], 5.2306651)
    assert.strictEqual(result.json.geometry.coordinates[1], 46.2069614)
  })
})
