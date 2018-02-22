const enrich = require('./enrich')

let ds = {
  communes: {},
  departements: {},
  organismes: {}
}
enrich('data', ds)
