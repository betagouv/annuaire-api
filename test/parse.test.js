const path = require('path')
const fs = require('fs')
const assert = require('assert')
const { parse } = require('../main')

describe('parse', function() {
  it('should work', function() {
    const files = [
      {
        data: fs.readFileSync(path.join(__dirname, 'files', 'msa.xml'))
      }
    ]

    const result = parse(files);
    assert.equal(result[0].json.geometry.coordinates[0], 5.2306651)
    assert.equal(result[0].json.geometry.coordinates[1], 46.2069614)
  })
})
