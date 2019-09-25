const enrich = require('../enrich')
const rp = require('request-promise')
const utils = require('./utils')
const type = 'mds'

function processOrganisme (organisme) {
  const props = organisme.fields
  if (!props.nom) {
    return { horaires: [] }
  }

  const normalized = {
    nom: props.nom,
    pivotLocal: type,
    id: organisme.recordid,
    adresses: [processAddress(props)],
    horaires: props.horaires ? utils.processOpeningHours(props.horaires) : [],
    zonage: { communes: [props.code_insee + ' ' + props.commune] },
    raw: organisme
  }

  if (props.telephone) {
    return Object.assign(normalized, { telephone: props.telephone.replace(/[.-]/g, ' ') })
  }

  return normalized
}

function processAddress (organisme) {
  const address = {
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
    uri: 'https://data.opendatasoft.com/explore/dataset/site_social@haute-garonne/download/?format=json&timezone=Europe/Berlin',
    json: true
  })
    .then(d => d.map(processOrganisme))
    .then(filterOrganismes)
    .then(d => d.map(props => { return { properties: props } }))
    .catch(e => {
      console.error(e)
      return []
    })
}

function addOrganismes (dataset) {
  return enrich.addOrganismes(dataset, importOrganismes(), '31')
}

module.exports = {
  addOrganismes,
  type
}
