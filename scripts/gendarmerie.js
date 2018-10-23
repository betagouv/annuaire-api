const csv = require('csv-parser')
const request = require('request')
const Promise = require('bluebird')

function processOrganisme (props) {
  return {
    nom: props.service,
    pivotLocal: 'brigade_gendarmerie',
    id: props.identifiant_public_unite,
    adresses: [processAddress(props)],
    horaires: processOpeningHours(props),
    telephone: props.telephone,
    zonage: { communes: [props.code_commune_insee + ' ' + props.commune] },
    raw: props
  }
}

function processAddress (props) {
  let address = {
    codePostal: props.code_postal,
    commune: props.commune,
    lignes: [props.voie],
    type: 'physique'
  }

  return address
}

function processOpeningHours (props) {
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

  var day = days.map(function (dayName) {
    let day = {
      du: dayName,
      au: dayName,
      heures: []
    }

    for (var i = 1; i <= 3; i++) {
      const start = `${dayName}_plage${i}_debut`
      const end = `${dayName}_plage${i}_fin`
      if (props[start].length && props[end].length) {
        day.heures.push({
          de: props[start],
          a: props[end]
        })
      }
    }
    return day
  })

  return day.filter(function (plage) {
    return plage.heures.length
  })
}

function importOrganismes () {
  return new Promise(resolve => {
    const results = []
    request('https://static.data.gouv.fr/resources/liste-des-unites-de-gendarmerie-accueillant-du-public-comprenant-leur-geolocalisation-et-leurs-horaires-douverture/20181023-050146/export-gn2.csv')
      .pipe(csv({ separator: ';' }))
      .on('data', row => results.push({ properties: processOrganisme(row) }))
      .on('end', () => {
        resolve(results)
      })
  })
}

const enrich = require('../enrich')
function addOrganismes (dataset) {
  return importOrganismes()
    .then(organismes => {
      return organismes.reduce((result, organisme) => {
        const departement = organisme.properties.raw.departement
        result[departement] = result[departement] || []
        result[departement].push(organisme)

        return result
      }, {})
    })
    .then(departements => {
      return Object.keys(departements).map(departementCode => {
        return {
          code: departementCode,
          organismes: departements[departementCode]
        }
      })
    })
    .map(departement => enrich.addOrganismes(dataset, departement.organismes, departement.code))
    .then(() => dataset)
}

module.exports = {
  addOrganismes
}
