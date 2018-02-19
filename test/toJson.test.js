const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

const assert = require('assert')
const { toJson } = require('../main')

describe('toJson', function () {
  let file

  before((done) => {
    const filePath = path.join(__dirname, 'files', 'organismes-msa.xml')

    fs.readFileAsync(filePath).then(content => {
      file = {
        path: filePath,
        data: content
      }
    }).then(done)
  })

  it('should work', function (done) {
    toJson(file).then(result => {
      assert.equal(result.json.geometry.coordinates[0], 5.2306651)
      assert.equal(result.json.geometry.coordinates[1], 46.2069614)
    }).then(done)
  })
})
