const rp = require('request-promise')
const XLSX = require('xlsx')
const { processOpeningHours } = require('./utils')

const type = 'mds'

function processOrganisme (props) {
  return {
    nom: props.Nom,
    pivotLocal: type,
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
  const rawData = await rp({
    uri: 'https://static.data.gouv.fr/resources/maisons-departementales-des-solidarites/20181217-100752/mds-seine-et-marne.xlsx',
    method: 'GET',
    encoding: 'binary'
  })

  const workbook = await XLSX.read(rawData, { type: 'binary' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

  return rows
    .map(r => processOrganisme(r))
    .map(o => ({ type: 'Feature', geometry: null, properties: o }))
}

module.exports = {
  computeOrganismes,
  type
}
