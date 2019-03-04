const rp = require('request-promise')
const parse = require('csv-parse')
const utils = require('./utils')

function processOrganisme (props) {
  let pivotLocal
  if (props.ID.startsWith('mds_')) {
    pivotLocal = 'mds'
  }
  if (props.ID.startsWith('mdph_')) {
    pivotLocal = 'maison_handicapees '
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
  let address = {
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
    encoding: 'utf8'
  })
    .then(data => {
      return new Promise((resolve, reject) => {
        // Remove BOM
        data = data.slice(2)

        // Remove unicode spaces
        data = data.replace(/\u0000/g, '')

        parse(data, {
          delimiter: ';',
          skip_lines_with_error: true,
          ltrim: true,
          rtrim: true,
          quote: '"',
          columns: true
        }, function (err, output) {
          if (err) {
            reject(err)
            return
          }

          resolve(output)
        })
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
  addOrganismes
}
