const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))
const yaml = require('js-yaml')

const Ajv = require('ajv')
const definitions = yaml.safeLoad(fs.readFileSync('definitions.yaml'))
const schema = {
  $id: 'http://etablissements-publics.api.gouv.fr/v3/etablissements.json',
  $ref: 'definitions.json#/definitions/etablissement'
}

module.exports = function (organisme) {
  const ajv = new Ajv()
  const validate = ajv.addSchema(definitions).compile(schema)
  const valid = validate(organisme)
  if (!valid) {
    const obj = {
      message: `Error validating YAML file: ${organisme.id}`,
      errors: validate.errors
    }

    console.log(obj)
    throw obj
  }
}
