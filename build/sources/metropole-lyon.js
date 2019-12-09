const rp = require('request-promise')
const type = 'mds'

function processOrganisme (organisme) {
  return {
    nom: organisme.nom,
    pivotLocal: type,
    id: organisme.identifiant,
    adresses: [processAddress(organisme)],
    horaires: processHoraires(organisme),
    telephone: organisme.telephone,
    zonage: { communes: [organisme.code_insee + ' ' + organisme.ville] },
    raw: organisme
  }
}

const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
const dayParts = ['am', 'pm']

function processHoraires (organisme) {
  const horaires = []

  dayNames.forEach(dayName => {
    const hoursByDay = []
    dayParts.forEach(dayPart => {
      const key = `${dayName}_${dayPart}`
      if (Object.prototype.hasOwnProperty.call(organisme, key)) {
        const matches = organisme[key].match(/^([0-9h]+)-([0-9h]+)$/)
        if (matches) {
          hoursByDay.push({
            de: matches[1],
            a: matches[2]
          })
        }
      }
    })
    if (hoursByDay.length > 0) {
      horaires.push({
        du: dayName,
        au: dayName,
        heures: hoursByDay
      })
    }
  })

  return horaires
}

function processAddress (organisme) {
  const address = {
    codePostal: organisme.code_postal,
    commune: organisme.ville,
    lignes: [organisme.adresse],
    type: 'physique'
  }

  if (organisme.adresse_complement && organisme.adresse_complement.length > 0) {
    address.lignes.unshift(organisme.adresse_complement)
  }

  return address
}

async function computeOrganismes () {
  const data = await rp({
    uri: 'https://download.data.grandlyon.com/ws/grandlyon/ter_territoire.maison_de_la_metropole/all.json',
    json: true
  })

  return data.values
    .map(o => processOrganisme(o))
    .filter(o => o.nom)
    .map(o => ({ type: 'Feature', geometry: null, properties: o }))
}

module.exports = {
  computeOrganismes,
  type
}
