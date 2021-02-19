const { join } = require('path')
const { generateInitialDataset } = require('./initial')
const { writeJsonArray } = require('./util')

const additions = [
  'sources/cotes-d-armor',
  'sources/haute-garonne',
  'sources/hauts-de-seine',
  'sources/metropole-lyon',
  'sources/saone-et-loire',
  'sources/seine-et-marne',
  'sources/seine-saint-denis',
  'data-directory'
]

async function computeAdditionalOrganismes (specificSource, config) {
  const organismes = []
  const sources = specificSource ? [specificSource] : additions

  await Promise.all(sources.map(async addition => {
    const computedOrganismes = await require('./' + addition).computeOrganismes(config)
    organismes.push(...computedOrganismes)
    console.log(`${addition} : ajout de ${computedOrganismes.length} organismes`)
  }))

  return organismes
}

async function build () {
  if (process.argv.length>2) {
    const organismes = await computeAdditionalOrganismes(process.argv[2], process.argv[3])
    await writeJsonArray(join(__dirname, '..', 'dataset.json'), organismes)
  } else {
    const initialOrganismes = await generateInitialDataset()
    const additionalOrganismes = await computeAdditionalOrganismes()
    await writeJsonArray(join(__dirname, '..', 'dataset.json'), [...initialOrganismes, ...additionalOrganismes])
  }
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
