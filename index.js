const { run } = require('./main');

const fileName = 'all_latest.tar.bz2'
const url = `http://lecomarquage.service-public.fr/donnees_locales_v2/${fileName}`

run(url, fileName)
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
