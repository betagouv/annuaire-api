const fs = require('fs')
const yaml = require('js-yaml')
const Ajv = require('ajv')
const { keyBy } = require('lodash')
const chalk = require('chalk')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['commune-actuelle', 'arrondissement-municipal'].includes(c.type))

const communesIndex = keyBy(communes, 'code')

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
  organisme.zonage.communes.forEach(commune => {
    const codeCommune = commune.substr(0, 5)
    const nomCommune = commune.substr(6).trim()

    const matchingCommune = communesIndex[codeCommune]
    if (!matchingCommune) {
      console.log(`${chalk.grey(organisme.id)} | commune inconnue ou désormais déléguée : ${chalk.yellow(codeCommune)}`)
      return
    }
    if (matchingCommune.nom !== nomCommune) {
      console.log(`${chalk.grey(organisme.id)} | nom de la commune différent du Code Officiel Géographique : ${chalk.yellow(nomCommune)} au lieu de ${chalk.green(matchingCommune.nom)}`)
    }
  })
}
