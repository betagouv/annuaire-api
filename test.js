const enrich = require('./build/enrich')

const ds = {
  communes: {},
  departements: {},
  organismes: {},
  organismesById: {}
}
enrich('data', ds)
