const { join } = require('path')
const { prepareInitialDataset, generateInitialDataset } = require('./initial')
const { addOpenDataOrganismes } = require('./additions')
const { writeJson } = require('./util')

async function build () {
  await prepareInitialDataset()
  const dataset = await generateInitialDataset()
  await addOpenDataOrganismes(dataset)
  await writeJson(join(__dirname, '..', 'dataset.json'), dataset)
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
