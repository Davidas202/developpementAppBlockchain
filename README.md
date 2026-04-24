# Lien vers le repo GitHub

https://github.com/Davidas202/developpementAppBlockchain

# Lien vers la vidéo de démonstration

À AJOUTER

# Installation

## Backend

cd fruit-market
npm install

## Frontend

cd frontend
npm install

# Variables d'environnement

## fruit-market/.env

SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_wallet_private_key

## fruit-market/frontend/.env

VITE_SEPOLIA_PROXY_ADDRESS=your_proxy_address

## Compiler les contrats

npx hardhat compile

## Lancer les tests

npx hardhat test

## Déploiement V1

npx hardhat run scripts/deploy.ts --network sepolia

## Upgrade V1 -> V2

Modifier scripts/upgrade.ts avec l’adresse du proxy :
const PROXY_ADDRESS = "0x...";
Ajouter l'adresse du proxy dans fruit-market/frontend/.env
Puis lancer :
npx hardhat run scripts/upgrade.ts --network sepolia

## Lancer le front-end

cd frontend
npm run dev

## Contrats déployés

# Proxy

0x............

# Implémentation V1:

0x..............

# Implémentation V2:

0x.............

## Explorateur de blocs

# Proxy

https://sepolia.etherscan.io/address/0x...........

# Implémentation V1:

https://sepolia.etherscan.io/address/0x.....

# Implémentation V2:

https://sepolia.etherscan.io/address/0x.....
