const rp = require('request-promise')
const csv = require('csv-parser')
const iconv = require('iconv-lite')
const utils = require('./utils')
const Readable = require('stream').Readable
const types = ['mds', 'maison_handicapees']

function processOrganisme (props) {
  let pivotLocal
  if (props.ID.startsWith('mds_')) {
    pivotLocal = types[0]
  }
  if (props.ID.startsWith('mdph_')) {
    pivotLocal = types[1]
  }

  if (!pivotLocal) {
    return {}
  }

  return {
    nom: props.Nom,
    pivotLocal: pivotLocal,
    id: props.ID,
    adresses: [processAddress(props)],
    horaires: utils.processOpeningHours(props.Horaires),
    telephone: props.Tel,
    zonage: { communes: props.Zonage.split(';') },
    raw: props
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
  return organismes.filter(organisme => organisme.nom)
}

function importOrganismes () {
  return rp({
    uri: 'https://static.data.gouv.fr/resources/implantations-territoriales-de-laction-sociale/20190130-142932/implantations-territoriales-cd71.csv',
    method: 'GET',
    encoding: null
  })
    .then(data => {
      return new Promise((resolve, reject) => {
        const stream = new Readable()
        stream.push(iconv.decode(data, 'utf-16le'))
        stream.push(null)

        const results = []

        stream
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
      })
    })
    .then(data => data.map(processOrganisme))
    .then(filterOrganismes)
    .then(data => data.map(props => { return { properties: props } }))
    .catch(e => {
      console.error(e)
      return []
    })
}

const enrich = require('../enrich')
function addOrganismes (dataset) {
  return enrich.addOrganismes(dataset, importOrganismes(), '71')
}

module.exports = {
  addOrganismes,
  types
}
