const { getCommunes } = require('../util')
const rp = require('request-promise')
const { processOpeningHours } = require('./utils')
const type = 'mds'

function processOrganisme (organisme) {
  if (!organisme.Nom) {
    return { horaires: [] }
  }

  return {
    nom: organisme.Nom,
    pivotLocal: type,
    id: organisme.id__,
    adresses: [processAddress(organisme)],
    horaires: processOpeningHours(organisme.Horaires),
    telephone: organisme.Tel,
    zonage: {
      communes: getCommunes('22')
    },
    raw: organisme
  }
}

function processAddress (organisme) {
  const address = {
    codePostal: organisme.CP,
    commune: organisme.Commune,
    lignes: [organisme.Adresse],
    type: 'physique'
  }

  if (organisme.Comp_Adr && organisme.Comp_Adr.length) {
    address.lignes.unshift(organisme.Comp_Adr)
  }

  return address
}

async function computeOrganismes () {
  const data = await rp({
    uri: 'http://datarmor.cotesdarmor.fr/dataserver/cg22/data/site_acceuil?&$format=json',
    json: true
  })

  return data.d.results
    .map(o => processOrganisme(o))
    .filter(o => o.horaires.length)
    .map(o => ({ type: 'Feature', geometry: null, properties: o }))
}

module.exports = {
  computeOrganismes,
  type
}
