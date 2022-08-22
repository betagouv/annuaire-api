function commune (data) {
  const [commune] = data.commune
  const organismes = commune.type_service_local.reduce((accum, organismes) => {
    accum[organismes.code_type_service_local] = organismes.organisme
    return accum
  }, {})

  return {
    codeInsee: commune.code_insee_commune,
    nom: commune.nom,
    organismes: organismes
  }
}

function hasPhysicalCoordinates (address) {
  return address.type_adresse === 'Adresse' && hasCoordinates(address)
}

function hasCoordinates (address) {
  return address.longitude && address.latitude
}

function getCoordinates (address) {
  return (address && hasCoordinates(address)) ? [parseFloat(address.longitude), parseFloat(address.latitude)] : [null, null]
}

function getAddressLines (address) {
  return [
    address.numero_voie,
    address.complement1,
    address.complement2]
    .filter(Boolean)
}

function address (data) {
  const properties = {
    type: data.type_adresse,
    lignes: getAddressLines(data),
    codePostal: data.code_postal,
    commune: data.nom_commune
  }

  if (data.Localisation) {
    properties.coordonnees = getCoordinates(data)
  }

  return properties
}

function horaires (data) {
  const horaires = data.map(plage => {
    const heures = [{ de: plage.valeur_heure_debut_1, a: plage.valeur_heure_fin_1 }]

    if (plage.valeur_heure_debut_2) {
      heures.push({ de: plage.valeur_heure_debut_2, a: plage.valeur_heure_fin_2 })
    }

    return {
      du: plage.nom_jour_debut,
      au: plage.nom_jour_fin,
      heures
    }
  })

  return horaires
}

function organisme (organisme) {
  const properties = {
    id: organisme.id,
    codeInsee: organisme.code_insee_commune,
    pivotLocal: organisme.pivot[0]?.type_service_local,
    nom: organisme.nom,
    adresses: organisme.adresse.map(address),
    horaires: organisme?.plage_ouverture[0] && horaires(organisme.plage_ouverture),
    email: organisme?.adresse_courriel[0],
    telephone: organisme?.telephone[0]?.valeur,
    url: organisme?.site_internet[0]?.valeur
  }

  const physicalAdresse = organisme.adresse.find(hasPhysicalCoordinates) || organisme.adresse.find(hasCoordinates)
  const coordinates = getCoordinates(physicalAdresse)

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates
    },
    properties
  }
}

async function parseOrganismes (data) {
  const json = JSON.parse(data.toString())
  return json.service.map(data => organisme(data))
}

async function parseCommune (data) {
  const json = JSON.parse(data.toString())
  return commune(json)
}

module.exports = {
  parseOrganismes,
  parseCommune
}
