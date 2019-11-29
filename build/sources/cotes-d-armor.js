const enrich = require('../enrich')
const rp = require('request-promise')
const utils = require('./utils')
const type = 'mds'

function processOrganisme (zonage, organisme) {
  if (!organisme.Nom) {
    return { horaires: [] }
  }

  return {
    nom: organisme.Nom,
    pivotLocal: type,
    id: organisme.id__,
    adresses: [processAddress(organisme)],
    horaires: utils.processOpeningHours(organisme.Horaires),
    telephone: organisme.Tel,
    zonage: {
      communes: zonage
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

function filterOrganismes (organismes) {
  return organismes.filter(organisme => organisme.horaires.length)
}

function importOrganismes (zonage) {
  return rp({
    uri: 'http://datarmor.cotesdarmor.fr/dataserver/cg22/data/site_acceuil?&$format=json',
    json: true
  }).then(d => d.d.results)
    .then(d => d.map(processOrganisme.bind(null, zonage)))
    .then(filterOrganismes)
    .then(d => d.map(props => { return { properties: props } }))
    .catch(e => {
      console.error(e)
      return []
    })
}

async function computeAndAddOrganismes (dataset) {
  const communes = dataset.departements['22'].communes

  const zonage = []
  for (const codeInsee in communes) {
    if (Object.prototype.hasOwnProperty.call(communes, codeInsee)) {
      const commune = communes[codeInsee]
      zonage.push(commune.codeInsee + ' ' + commune.nom)
    }
  }

  enrich.addOrganismesToDataset(dataset, await importOrganismes(zonage), '22')
}

module.exports = {
  computeAndAddOrganismes,
  type
}
