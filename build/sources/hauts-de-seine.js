const rp = require('request-promise')
const { processOpeningHours } = require('./utils')
const type = 'edas'

function processOrganisme (organisme) {
  const props = organisme.properties
  if (!props.nom) {
    return { horaires: [] }
  }
  return {
    nom: props.nom.replace(/^EDAS/, 'Établissement départemental d\'actions sociales'),
    pivotLocal: type,
    id: props.id,
    adresses: [processAddress(props)],
    horaires: processOpeningHours(props.horaires),
    telephone: props.tel && props.tel.replace(/\./g, ' '),
    zonage: { communes: [props.code_insee + ' ' + props.commune] },
    raw: organisme
  }
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
    uri: 'https://opendata.hauts-de-seine.fr/explore/dataset/espaces-departementaux-dactions-sociales-edas/download/?format=geojson',
    json: true
  })

  return data.features
    .map(f => processOrganisme(f))
    .filter(o => o.horaires.length)
    .map(o => ({ type: 'Feature', geometry: null, properties: o }))
}

module.exports = {
  computeOrganismes,
  type
}
