const enrich = require('../enrich')
const rp = require('request-promise')

function processEntity (entity) {
  const props = entity.properties
  if (!props.nom) {
    return { horaires: [] }
  }
  return {
    nom: props.nom.replace(/^EDAS/, 'Établissement départemental d\'actions sociales'),
    pivotLocal: 'edas',
    id: props.id,
    adresses: [processAddress(entity)],
    horaires: processOpeningHours(props.horaires),
    telephone: props.tel.replace(/\./g, ' '),
    zonage: { communes: [props.code_insee + ' ' + props.commune] },
    raw: entity
  }
}

function processAddress (entity) {
  var address = {
    codePostal: entity.cp,
    commune: entity.commune,
    lignes: [entity.adresse],
    type: 'physique'
  }

  if (entity.comp_adr && entity.comp_adr.length) {
    address.lignes.unshift(entity.comp_adr)
  }

  return address
}

function processOpeningHours (text) {
  if (!text) {
    return {}
  }
  const matchBase = text.match(/^Du (\w+) au (\w+) : (\w+)-(\w+) \/ (\w+)-(\w+)/)

  if (!matchBase) {
    return []
  }

  return [{
    du: matchBase[1],
    au: matchBase[2],
    heures: [{
      de: matchBase[3],
      a: matchBase[4]
    }, {
      de: matchBase[5],
      a: matchBase[6]
    }]
  }]
}

function filterEntities (entities) {
  return entities.filter(entity => entity.horaires.length)
}

function importOrganismes () {
  return rp({
    uri: 'https://opendata.hauts-de-seine.fr/explore/dataset/espaces-departementaux-dactions-sociales-edas/download/?format=geojson',
    json: true
  }).then(d => d.features)
    .then(d => d.map(processEntity))
    .then(filterEntities)
    .then(d => d.map(props => { return { properties: props } }))
    .catch(e => {
      console.error(e)
      return []
    })
}

function addOrganismes (dataset) {
  return importOrganismes()
    .then(organismes => enrich.addOrganismes(dataset, organismes, '92'))
}

module.exports = {
  addOrganismes
}
