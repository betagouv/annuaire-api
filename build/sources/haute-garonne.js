const rp = require('request-promise')
const { processOpeningHours } = require('./utils')
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
    horaires: props.horaires ? processOpeningHours(props.horaires) : [],
    zonage: { communes: [props.code_insee + ' ' + props.commune] },
    raw: organisme
  }

  if (props.telephone) {
    normalized.telephone = props.telephone.replace(/[.-]/g, ' ')
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

async function computeOrganismes () {
  const data = await rp({
    uri: 'https://data.opendatasoft.com/explore/dataset/site_social@haute-garonne/download/?format=json&timezone=Europe/Berlin',
    json: true
  })

  return data
    .map(o => processOrganisme(o))
    .filter(o => o.horaires.length)
    .map(o => ({ type: 'Feature', geometry: null, properties: o }))
}

module.exports = {
  computeOrganismes,
  type
}
