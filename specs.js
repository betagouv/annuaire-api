const fs = require('fs')
const yaml = require('js-yaml')

const types = yaml.safeLoad(fs.readFileSync('types.yaml'))
const labels = Object.keys(types).map(function (key) {
  return ['*', '`' + key + '`', types[key]].join(' ')
})
const description = ["Code du type de l'organisme :", ...labels].join('\n')

const specs = {
  'swagger': '2.0',
  'info': {
    'title': "API Annuaire des établissements publics de l'administration",
    'version': '1.0.0'
  },
  'host': 'etablissements-publics.api.gouv.fr',
  'schemes': [
    'https'
  ],
  'produces': [
    'application/json'
  ],
  'paths': {
    '/v1/organismes/{departement}/{type}': {
      'get': {
        'summary': 'Trouver des organismes par département et par type',
        'tags': [
          'Organismes'
        ],
        'parameters': [
          {
            'name': 'departement',
            'in': 'path',
            'description': 'Code departement sur deux caractères',
            'required': true,
            'type': 'string',
            'default': '14'
          },
          {
            'name': 'type',
            'in': 'path',
            'required': true,
            'type': 'string',
            'default': 'maison_handicapees',
            'enum': Object.keys(types),
            'description': description
          }
        ],
        'responses': {
          '200': {
            'description': 'Liste des organismes du département'
          },
          '404': {
            'description': 'Département introuvable'
          }
        }
      }
    }
  }
}

module.exports = specs
