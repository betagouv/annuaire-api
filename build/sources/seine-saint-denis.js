const rp = require('request-promise')
const type = 'centre_social'

function processOrganisme (organisme) {
  const props = organisme.properties

  if (!props.nomcs) {
    return {}
  }

  return {
    nom: props.nomcs,
    pivotLocal: type,
    id: 'centre_social_ssd' + props.id,
    adresses: [processAddress(props)],
    horaires: [],
    telephone: props.tel,
    zonage: { communes: [props.insee + ' ' + props.commune] },
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

  return address
}

async function computeOrganismes () {
  const data = await rp({
    uri: 'https://geoportail93.fr/SERV/DATA/?SERVICE=WFS&LAYERS=1360&FORMAT=GEOJSON&COL=ALL&MODE=2&SRID=undefined',
    json: true
  })

  return data.features
    .map(o => processOrganisme(o))
    .filter(o => o.nom)
    .map(o => ({ type: 'Feature', geometry: null, properties: o }))
}

module.exports = {
  computeOrganismes,
  type
}
