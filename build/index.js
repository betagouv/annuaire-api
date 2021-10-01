const { join } = require('path')
const { generateInitialDataset } = require('./initial')
const { writeJsonArray } = require('./util')

async function build () {
  const initialOrganismes = await generateInitialDataset()
  await writeJsonArray(join(__dirname, '..', 'dataset.json'), initialOrganismes)
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
