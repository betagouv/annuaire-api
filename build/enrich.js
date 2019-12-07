const path = require('path')
const { readdir } = require('fs').promises

const { readYaml } = require('./util')
const validate = require('./validate')

async function readAndConvert (filePath) {
  const organisme = await readYaml(filePath)
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
    path: filePath,
    json: geoJson
  }
}

function appendOrganisme (holder, key, value) {
  holder.organismes[key] = holder.organismes[key] || []
  holder.organismes[key].push(value)
}

function addOrganisme (dataset, organisme, departementCode) {
  const props = organisme.properties

  dataset.organismesById[props.id] = organisme
  appendOrganisme(dataset, props.pivotLocal, organisme)

  props.zonage.communes.forEach(communesLabel => {
    const communeId = communesLabel.slice(0, 5)

    const commune = dataset.communes[communeId]
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

async function computeAndAddOrganismesFromFolder (dataset, folder) {
  let additionCount = 0
  const departementsFolders = await readdir(folder)

  await Promise.all(departementsFolders.map(async departementFolder => {
    const departementPath = path.join(folder, departementFolder)

    const organismesFiles = await readdir(departementPath)

    await Promise.all(organismesFiles.map(async organismeFile => {
      additionCount = additionCount + 1
      const organismePath = path.join(departementPath, organismeFile)
      const organisme = await readAndConvert(organismePath)
      addOrganisme(dataset, organisme.json, departementFolder)
    }))
  }))

  console.log(`Added ${additionCount} organismes from ${folder}.`)

  return dataset
}

function addOrganismesToDataset (dataset, organismes, departementCode) {
  organismes.forEach(organisme => addOrganisme(dataset, organisme, departementCode))
  console.log(`Added ${organismes.length} organismes for departement ${departementCode}.`)
  return dataset
}

module.exports = {
  appendOrganisme,
  addOrganismesToDataset,
  computeAndAddOrganismesFromFolder
}
