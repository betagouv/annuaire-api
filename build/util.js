const { writeFile } = require('fs').promises

async function writeJson (filePath, data) {
  await writeFile(filePath, JSON.stringify(data), { encoding: 'utf-8' })
}

module.exports = { writeJson }
