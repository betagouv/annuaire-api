const enrich = require('./enrich')

let ds = {
  communes: {},
  departements: {},
  organismes: {},
  organismesById: {}
}
enrich('data', ds)
