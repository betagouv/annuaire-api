var express = require('express')
const { prepareDataset } = require('./main')

const port = process.env.PORT || 12346

function serve (dataset) {
  const app = express()

  function generateGeoJson (pivots, source, operation) {
    if (!operation) {
      operation = o => o
    }

    let organismes = []
    pivots.forEach(pivot => {
      organismes = organismes.concat((source[pivot] || []).map(operation))
    })

    return {
      type: 'FeatureCollection',
      features: organismes
    }
  }

  const mainRouter = express.Router()
  mainRouter.get('/communes/:communeId/:pivot', (req, res) => {
    const pivots = new Set(req.params.pivot.split('+'))
    const commune = dataset.communes[req.params.communeId]

    if (!commune) {
      return res.status(401).json({ message: `communeId ${req.params.communeId} not found` })
    }

    return res.json(generateGeoJson(pivots, commune.organismes, organismeId => dataset.organismesById[organismeId]))
  })

  function getDepartementOrganismes(req, res) {
    const pivots = new Set(req.params.pivot.split('+'))
    const departement = dataset.departements[req.params.departementId]

    if (!departement) {
      return res.status(401).json({ message: `departementId ${req.params.departementId} not found` })
    }

    return res.json(generateGeoJson(pivots, departement.organismes))
  }

  mainRouter.get('/departements/:departementId/:pivot', getDepartementOrganismes)
  app.get('/v1/organismes/:departementId/:pivot', getDepartementOrganismes)

  mainRouter.get('/organismes/:pivot', (req, res) => {
    const pivots = new Set(req.params.pivot.split('+'))
    return res.json(generateGeoJson(pivots, dataset.organismes))
  })

  mainRouter.get('/', (req, res) => {
    res.status(401).json({ message: 'There is nothing here, you should check /definitions.yaml.' })
  })

  mainRouter.get('/definitions.yaml', (req, res) => {
    res.type('yaml').send(require('js-yaml').safeDump(require('./specs')))
  })

  mainRouter.use((error, req, res, next) => {
    console.log(error)
    res.json({ message: 'error', error: error.message })
  })

  app.use('/v3', mainRouter)

  app.listen(port, () => {
    console.log('API listening on port %d', port)
  })
}

prepareDataset()
  .then(serve)
