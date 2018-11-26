const enrich = require('../enrich')
const rp = require('request-promise')

function processOrganisme (organisme) {
  const props = organisme.properties

  if (!props.nomcs) {
    return {}
  }

  return {
    nom: props.nomcs,
    pivotLocal: 'centre_social',
    id: 'centre_social_ssd' + props.id,
    adresses: [processAddress(props)],
    horaires: [],
    telephone: props.tel,
    zonage: { communes: [props.insee + ' ' + props.commune] },
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

  return address
}

function filterOrganismes (organismes) {
  return organismes.filter(organisme => organisme.nom)
}

function importOrganismes () {
  return rp({
    uri: 'https://geoportail93.fr/SERV/DATA/?SERVICE=WFS&LAYERS=1360&FORMAT=GEOJSON&COL=ALL&MODE=2&SRID=undefined',
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
  return enrich.addOrganismes(dataset, importOrganismes(), '93')
}

module.exports = {
  addOrganismes
}
