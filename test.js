const enrich = require('./enrich')

const ds = {
  communes: {},
  departements: {},
  organismes: {},
  organismesById: {}
}
enrich('data', ds)
