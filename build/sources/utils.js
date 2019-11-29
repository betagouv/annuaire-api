const patterns = [
  /^Du (\w+) au (\w+) : (\w+)-(\w+) \/ (\w+)-(\w+)/,
  /^(\w+) à (\w+) - (\w+)-(\w+) - (\w+)-(\w+)/
]

function processOpeningHours (text) {
  if (!text) {
    return {}
  }

  // Replace non-breaking spaces by spaces
  text = text.replace('\u00a0', ' ')

  let matchBase
  for (let i = 0; i < patterns.length; i++) {
    matchBase = text.match(patterns[i])
    if (matchBase) {
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
  }

  return []
}

module.exports = {
  processOpeningHours
}
