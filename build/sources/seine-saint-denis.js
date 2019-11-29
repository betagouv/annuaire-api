const enrich = require('../enrich')
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

async function computeAndAddOrganismes (dataset) {
  enrich.addOrganismesToDataset(dataset, await importOrganismes(), '93')
}

module.exports = {
  computeAndAddOrganismes,
  type
}
