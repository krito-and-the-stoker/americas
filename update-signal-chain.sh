!#/bin/bash

cd game
npm install signal-chain@latest signal-chain-solid@latest
cd ..

docker-compose -f docker-compose.install-dev.yml build
docker-compose -f docker-compose.install-dev.yml up
docker-compose -f docker-compose.develop.yml build
