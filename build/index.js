const { build } = require('./main')

const fileName = 'all_latest.tar.bz2'
const url = `http://lecomarquage.service-public.fr/donnees_locales_v2/${fileName}`

build(url, fileName).catch(err => {
  console.error(err)
  process.exit(1)
})
