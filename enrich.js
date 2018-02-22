const path = require('path')

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))
const yaml = require('js-yaml')

const validate = require('./validate')

function YAMLtoJSON (p) {
  let organisme
  try {
    const content = fs.readFileSync(p)
    organisme = yaml.safeLoad(content)
  } catch (error) {
    const obj = {
      message: `Error reading YAML file: ${p}`,
      error: error
    }
    throw obj
  }

  validate(organisme)
  organisme.horaires = organisme.horaires || (organisme['accueil physique'] && organisme['accueil physique'].horaires)

  const geoJson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [null, null]
    },
    properties: organisme
  }

  return {
    path: p,
    json: geoJson
  }
}

function appendOrganisme (holder, key, value) {
  holder.organismes[key] = holder.organismes[key] || []
  holder.organismes[key].push(value)
}

function addOrganismes (folder, dataset) {
  let additionCount = 0
  fs.readdirSync(folder).map(departementFolder => {
    const departementPath = path.join(folder, departementFolder)

    fs.readdirSync(departementPath).map(organismeFile => {
      additionCount = additionCount + 1
      const organismePath = path.join(departementPath, organismeFile)
      const organisme = YAMLtoJSON(organismePath)

      const props = organisme.json.properties
      dataset.organismes[props.id] = dataset.organismes[props.pivotLocal] || []
      dataset.organismes[props.id] = organisme.json

      props.zonage.communes.forEach(communesLabel => {
        const communeId = communesLabel.slice(0, 5)

        let commune = dataset.communes[communeId]
        if (!commune) {
          return
        }

        appendOrganisme(commune, props.pivotLocal, props.id)
      })

      if (!dataset.departements[departementFolder]) {
        return
      }

      appendOrganisme(dataset.departements[departementFolder], props.pivotLocal, organisme.json)
    })
  })

  console.log(`Added ${additionCount} organismes.`)

  return dataset
}

module.exports = addOrganismes
