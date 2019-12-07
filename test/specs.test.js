const fs = require('fs')
const yaml = require('js-yaml')

const definitions = yaml.safeLoad(fs.readFileSync('definitions.yaml'))
const types = yaml.safeLoad(fs.readFileSync('types.yaml'))
const assert = require('assert')

describe('specs', function () {
  const typeIds = Object.keys(types)

  describe('types', function () {
    it('should contain custom ids', function () {
      const testedTypes = definitions.definitions.etablissement.properties.pivotLocal.enum

      testedTypes.forEach(type => {
        assert(typeIds.indexOf(type) >= 0, type)
      })
    })
  })
})
