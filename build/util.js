const { writeFile, readFile } = require('fs').promises

const yaml = require('js-yaml')

async function writeJson (filePath, data) {
  await writeFile(filePath, JSON.stringify(data), { encoding: 'utf-8' })
}

async function readYaml (filePath) {
  const content = await readFile(filePath, { encoding: 'utf-8' })
  return yaml.safeLoad(content)
}

module.exports = { writeJson, readYaml }
