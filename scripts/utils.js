function processOpeningHours (text) {
  if (!text) {
    return {}
  }

  // Replace non-breaking spaces by spaces
  text = text.replace('\u00a0', ' ')

  const matchBase = text.match(/^Du (\w+) au (\w+) : (\w+)-(\w+) \/ (\w+)-(\w+)/)

  if (!matchBase) {
    return []
  }

  return [{
    du: matchBase[1],
    au: matchBase[2],
    heures: [{
      de: matchBase[3],
      a: matchBase[4]
    }, {
      de: matchBase[5],
      a: matchBase[6]
    }]
  }]
}

module.exports = {
  processOpeningHours
}
