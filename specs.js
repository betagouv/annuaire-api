const fs = require('fs')
const yaml = require('js-yaml')

const types = yaml.safeLoad(fs.readFileSync('types.yaml'))
const labels = Object.keys(types).map(function (key) {
  return ['*', '`' + key + '`', types[key]].join(' ')
})
const description = ["Code du type de l'organisme :", ...labels].join('\n')

const responses = {
  '200': {
    'description': 'Liste des organismes du département'
  },
  '404': {
    'description': 'Département introuvable'
  }
}

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
    '/v3/departements/{departement}/{type}': {
      'get': {
        'summary': 'Trouver des organismes par département et par type',
        'tags': [
          'Organismes', 'Département'
        ],
        'parameters': [
          {
            'name': 'departement',
            'in': 'path',
            'description': 'Code département sur deux caractères',
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
        'responses': responses
      }
    },
    '/v3/communes/{commune}/{type}': {
      'get': {
        'summary': 'Trouver des organismes par commune et par type',
        'tags': [
          'Organismes', 'Commune'
        ],
        'parameters': [
          {
            'name': 'commune',
            'in': 'path',
            'description': 'Code commune sur cinq caractères',
            'required': true,
            'type': 'string',
            'default': '27103'
          },
          {
            'name': 'type',
            'in': 'path',
            'required': true,
            'type': 'string',
            'default': 'mairie',
            'enum': Object.keys(types),
            'description': description
          }
        ],
        'responses': responses
      }
    },
    '/v1/organismes/{departement}/{type}': {
      'get': {
        'summary': 'Trouver des organismes par département et par type',
        'description': 'Les données ne sont plus mises à jour.',
        'tags': [
          'Organismes', 'Département'
        ],
        'deprecated': true,
        'parameters': [
          {
            'name': 'departement',
            'in': 'path',
            'description': 'Code département sur deux caractères',
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
        'responses': responses
      }
    }
  }
}

module.exports = specs
