module.exports = {
  apps: [{
    env: {
      PORT: 12346
    },
    exec_mode: 'cluster',
    instances: 3,
    name: 'annuaire_v3',
    script: 'server.js'
  }]
}
