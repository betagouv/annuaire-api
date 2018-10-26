const enrich = require('../enrich')
const rp = require('request-promise')
const utils = require('./utils')

function processOrganisme (organisme) {
  const props = organisme.properties
  if (!props.nom) {
    return { horaires: [] }
  }
  return {
    nom: props.nom.replace(/^EDAS/, 'Établissement départemental d\'actions sociales'),
    pivotLocal: 'edas',
    id: props.id,
    adresses: [processAddress(props)],
    horaires: utils.processOpeningHours(props.horaires),
    telephone: props.tel.replace(/\./g, ' '),
    zonage: { communes: [props.code_insee + ' ' + props.commune] },
    raw: organisme
  }
}

function processAddress (organisme) {
  let address = {
    codePostal: organisme.cp,
    commune: organisme.commune,
    lignes: [organisme.adresse],
    type: 'physique'
  }

  if (organisme.comp_adr && organisme.comp_adr.length) {
    address.lignes.unshift(organisme.comp_adr)
  }

  return address
}

function filterOrganismes (organismes) {
  return organismes.filter(organisme => organisme.horaires.length)
}

function importOrganismes () {
  return rp({
    uri: 'https://opendata.hauts-de-seine.fr/explore/dataset/espaces-departementaux-dactions-sociales-edas/download/?format=geojson',
    json: true
  }).then(d => d.features)
    .then(d => d.map(processOrganisme))
    .then(filterOrganismes)
    .then(d => d.map(props => { return { properties: props } }))
    .catch(e => {
      console.error(e)
      return []
    })
}

function addOrganismes (dataset) {
  return enrich.addOrganismes(dataset, importOrganismes(), '92')
}

module.exports = {
  addOrganismes
}
