const { join } = require('path')
const { generateInitialDataset } = require('./initial')
const { writeJson } = require('./util')

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

async function computeAdditionalOrganismes () {
  const organismes = []

  await Promise.all(additions.map(async addition => {
    const computedOrganismes = await require('./' + addition).computeOrganismes()
    organismes.push(...computedOrganismes)
    console.log(`${addition} : ajout de ${computedOrganismes.length} organismes`)
  }))

  return organismes
}

async function build () {
  const initialOrganismes = await generateInitialDataset()
  const additionalOrganismes = await computeAdditionalOrganismes()
  await writeJson(join(__dirname, '..', 'dataset.json'), [...initialOrganismes, ...additionalOrganismes])
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
