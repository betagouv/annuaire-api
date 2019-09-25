function toLegacyFeature (feature, lastUpdatedAt) {
  let firstAddress
  if (feature.properties.adresses.length > 0) {
    firstAddress = feature.properties.adresses[0]
  }

  let address = {}
  if (firstAddress) {
    address = {
      type: firstAddress.type,
      Ligne: firstAddress.lignes.join(' '),
      CodePostal: firstAddress.codePostal,
      NomCommune: firstAddress.commune,
      Localisation: {
        Latitude: firstAddress.coordonnees[0],
        Longitude: firstAddress.coordonnees[1],
        Précision: '4' // FIXME Not sure where this is coming from
      },
      Accessibilité: {
        type: 'ACC' // FIXME What is this?
      }
    }
  }

  let openings = []
  if (feature.properties.horaires.length > 0) {
    openings = feature.properties.horaires.map(opening => {
      return {
        début: opening.du,
        fin: opening.au,
        PlageH: opening.heures.map(hours => ({
          début: hours.d,
          fin: hours.a
        }))
      }
    })
  }

  return {
    ...feature,
    Nom: feature.properties.nom,
    EditeurSource: '',
    dateMiseAJour: lastUpdatedAt,
    Adresse: address,
    CoordonnéesNum: {
      Téléphone: feature.properties.telephone || '',
      Télécopie: feature.properties.fax || '',
      Email: feature.properties.email || ''
    },
    Ouverture: {
      PlageJ: openings
    }
  }
}

function decorateLegacyResponse (featureCollection, lastUpdatedAt) {
  return {
    ...featureCollection,
    features: featureCollection.features.map(feature => toLegacyFeature(feature, lastUpdatedAt))
  }
}

module.exports = {
  toLegacyFeature,
  decorateLegacyResponse
}
