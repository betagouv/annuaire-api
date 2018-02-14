function commune (data) {
  const commune = data.Commune
  const organismes = commune.TypeOrganisme.reduce((accum, organismes) => {
    accum[organismes.$.pivotLocal] = organismes.Organisme.map(o => o.$.id)
    return accum
  }, {})
  return {
    codeInsee: commune.$.codeInsee,
    nom: commune.Nom[0],
    organismes: organismes
  }
}

function hasPhysicalCoordinates (address) {
  return address.type === 'physique' && hasCoordinates(address)
}

function hasCoordinates (address) {
  return typeof address.Localisation !== 'undefined'
}

function getCoordinates (address) {
  return (address && address.Localisation[0]) ? [parseFloat(address.Localisation[0].Longitude[0]), parseFloat(address.Localisation[0].Latitude[0])] : [null, null]
}

function address (data) {
  let properties = {
    type: data.$.type,
    lignes: data.Ligne,
    codePostal: data.CodePostal && data.CodePostal[0],
    commune: data.NomCommune && data.NomCommune[0]
  }

  if (data.Localisation) {
    properties.coordonnees = getCoordinates(data)
  }

  return properties
}

function horaires (data) {
  return data.PlageJ.map(plage => {
    return {
      du: plage.$['début'],
      au: plage.$.fin,
      heures: plage.PlageH.map(heures => {
        return {
          de: heures.$['début'],
          a: heures.$.fin
        }
      })
    }
  })
}

function organisme (data) {
  const organisme = data.Organisme

  const properties = {
    id: organisme.$.id,
    codeInsee: organisme.$.codeInsee,
    pivotLocal: organisme.$.pivotLocal,
    nom: organisme.Nom[0],
    adresses: organisme.Adresse.map(address),
    horaires: organisme.Ouverture && organisme.Ouverture[0] && horaires(organisme.Ouverture[0])
  }

  if (organisme['CoordonnéesNum'] && organisme['CoordonnéesNum'][0]) {
    const contacts = organisme['CoordonnéesNum'][0]
    const coords = [
      { key: 'Email', property: 'email' },
      { key: 'Téléphone', property: 'telephone' },
      { key: 'Url', property: 'url' }
    ]
    coords.forEach(p => {
      if (contacts[p.key]) {
        const t = contacts[p.key][0]
        if (typeof t === 'string') {
          properties[p.property] = t
        } else {
          properties[p.property] = t._
        }
      }
    })
  }

  const physicalAdresse = organisme.Adresse.find(hasPhysicalCoordinates) || organisme.Adresse.find(hasCoordinates)
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

module.exports = {
  commune,
  organisme
}
