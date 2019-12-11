const path = require('path')

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { uniq, intersection } = require('lodash')

const { createCommunesIndex, createDepartementsIndex, createPivotsIndex } = require('./indexes')
const { decorateLegacyResponse } = require('./v1')

const dataset = require('./dataset.json')
const communesIndex = createCommunesIndex(dataset)
const departementsIndex = createDepartementsIndex(dataset)
const pivotsIndex = createPivotsIndex(dataset)

const port = process.env.PORT || 12346

const app = express()

app.use((req, res, next) => {
  res.sendFeatures = features => res.send({
    type: 'FeatureCollection',
    features
  })

  next()
})

const mainRouter = express.Router()

mainRouter.get('/communes/:communeId/:pivot', (req, res) => {
  const pivots = uniq(req.params.pivot.split('+'))
  const candidates = communesIndex[req.params.communeId] || []

  if (!candidates) {
    return res.status(404).json({ message: `communeId ${req.params.communeId} not found` })
  }

  const organismes = candidates.filter(f => pivots.includes(f.properties.pivotLocal))

  return res.sendFeatures(organismes)
})

mainRouter.get('/departements/:departementId/:pivot', (req, res) => {
  const pivots = uniq(req.params.pivot.split('+'))
  const candidates = departementsIndex[req.params.departementId] || []

  if (!candidates) {
    return res.status(404).json({ message: `departementId ${req.params.departementId} not found` })
  }

  const organismes = candidates.filter(f => pivots.includes(f.properties.pivotLocal))

  return res.sendFeatures(organismes)
})

// Legacy API
app.get('/v1/organismes/:departementId/:pivot', (req, res) => {
  const pivots = uniq(req.params.pivot.split('+'))
  const candidates = departementsIndex[req.params.departementId] || []

  if (!candidates) {
    return res.status(404).json({ message: `departementId ${req.params.departementId} not found` })
  }

  const organismes = candidates.filter(f => pivots.includes(f.properties.pivotLocal))

  return res.send(decorateLegacyResponse({ type: 'FeatureCollection', features: organismes }))
})

mainRouter.get('/organismes/:pivot', (req, res) => {
  const pivots = uniq(req.params.pivot.split('+'))
  const organismes = intersection(pivots.map(pivot => pivotsIndex[pivot] || []))
  return res.sendFeatures(organismes)
})

mainRouter.get('/', (req, res) => {
  res.status(404).json({ message: 'There is nothing here, you should check /definitions.yaml.' })
})

mainRouter.get('/definitions.yaml', (req, res) => {
  res.type('yaml').send(require('js-yaml').safeDump(require('./specs')))
})

mainRouter.use((error, req, res, next) => {
  console.log(error)
  res.json({ message: 'error', error: error.message })
})

app.use(cors({ origin: true }))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use('/v3', mainRouter)

app.get('/', (req, res) => {
  res.redirect('https://api.gouv.fr/api/api_etablissements_publics.html')
})

app.listen(port, () => {
  console.log('API listening on port %d', port)
})
