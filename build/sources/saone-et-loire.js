const rp = require('request-promise')
const csv = require('csv-parser')
const iconv = require('iconv-lite')
const getStream = require('get-stream')
const intoStream = require('into-stream')

const { processOpeningHours } = require('./utils')

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
    horaires: processOpeningHours(props.Horaires),
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

async function computeOrganismes () {
  const data = await rp({
    uri: 'https://static.data.gouv.fr/resources/implantations-territoriales-de-laction-sociale/20190130-142932/implantations-territoriales-cd71.csv',
    method: 'GET',
    encoding: null
  })

  const rows = await getStream.array(
    intoStream(data)
      .pipe(iconv.decodeStream('utf-16le'))
      .pipe(csv({ separator: ';' }))
  )

  return rows
    .map(processOrganisme)
    .filter(organisme => organisme.nom)
    .map(organisme => ({ type: 'Feature', geometry: null, properties: organisme }))
}

module.exports = {
  computeOrganismes,
  types
}
