#!/bin/bash

cd $(dirname "$BASH_SOURCE")

set -ev

# Loads NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Get latest master
git pull

# Update packages
yarn

# Restart server
/home/cloud/.nvm/versions/node/v6.12.2/bin/pm2 reload annuaire_v3
