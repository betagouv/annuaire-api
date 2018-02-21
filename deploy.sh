#!/bin/bash

cd $(dirname "$BASH_SOURCE")

set -ev

git pull
/home/cloud/.nvm/versions/node/v6.12.2/bin/pm2 reload annuaire_v3
