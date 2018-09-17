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

function addOrganisme (dataset, organisme, departementCode) {
  const props = organisme.properties
  dataset.organismes[props.id] = organisme

  props.zonage.communes.forEach(communesLabel => {
    const communeId = communesLabel.slice(0, 5)

    let commune = dataset.communes[communeId]
    if (!commune) {
      return
    }

    appendOrganisme(commune, props.pivotLocal, props.id)
  })

  if (!dataset.departements[departementCode]) {
    return
  }

  appendOrganisme(dataset.departements[departementCode], props.pivotLocal, organisme)
}

function addOrganismesFromFolder (dataset, folder) {
  let additionCount = 0
  fs.readdirSync(folder).map(departementFolder => {
    const departementPath = path.join(folder, departementFolder)

    fs.readdirSync(departementPath).forEach(organismeFile => {
      additionCount = additionCount + 1
      const organismePath = path.join(departementPath, organismeFile)
      const organisme = YAMLtoJSON(organismePath)
      addOrganisme(dataset, organisme.json, departementFolder)
    })
  })

  console.log(`Added ${additionCount} organismes from ${folder}.`)

  return dataset
}

function addOrganismes (dataset, organismes, departementCode) {
  return Promise.map(organismes, (organisme) => {
    return addOrganisme(dataset, organisme, departementCode)
  }).then(() => dataset)
}

module.exports = {
  addOrganismes,
  addOrganismesFromFolder
}
