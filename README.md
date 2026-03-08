# MAGA Orbit Market

A full-stack NFT marketplace dApp for minting, listing, buying, and bidding on NFTs.
Built with React (Vite), Express, Hardhat, and OpenZeppelin on Ethereum Sepolia.

## Live Links
- Frontend (Netlify): https://maga-nft-marketplace.netlify.app/
- Backend (Render): https://maga-nft-marketplace.onrender.com

## Screenshot
![Maga NFT Marketplace Screenshot](./frontend/public/screenshot.png)

## Smart Contract
- Network: **Sepolia (11155111)**
- Address: **`0x3eCc0a9De856Fc9169668a3e581A4C513F61C369`**

## Features
- Wallet connection (MetaMask)
- Mint NFT with image + metadata upload to IPFS (Pinata)
- NFT gallery with search and ownership filtering
- List / cancel / buy fixed-price listings
- Place / cancel / accept top offers (bid flow)
- Responsive UI with dark/light theme and animated glacier-style design

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Ethers.js
- Backend: Express, Multer, Axios, CORS
- Smart Contracts: Solidity, Hardhat, OpenZeppelin
- Storage: IPFS via Pinata
- Hosting: Netlify (frontend), Render (backend)

## Repository Structure
```text
.
├── frontend/         # React dApp
├── backend/          # API for uploads + IPFS pinning
├── smart-contracts/  # Solidity contracts + tests + deploy scripts
└── README.md
```

## Local Development
### 1) Clone
```bash
git clone https://github.com/Maga-khiva/maga-nft-marketplace
cd maga-nft-marketplace
```

### 2) Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
cd ../smart-contracts && npm install
```

### 3) Create env files
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp smart-contracts/.env.example smart-contracts/.env
```

### 4) Configure env values
`backend/.env`
- `PINATA_API_KEY`
- `PINATA_API_SECRET`
- `CORS_ALLOWED_ORIGINS` (include your frontend origin)

`frontend/.env`
- `VITE_CONTRACT_ADDRESS` (local or Sepolia address)
- `VITE_API_BASE_URL` (local backend or Render URL)
- `VITE_REQUIRED_CHAIN_ID` (`31337` local, `11155111` Sepolia)

`smart-contracts/.env`
- `SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`

### 5) Run locally (Hardhat node)
Terminal A:
```bash
cd smart-contracts
npx hardhat node
```

Terminal B:
```bash
cd smart-contracts
npm run deploy:localhost
npm run export:abi
```

Terminal C:
```bash
cd backend
npm start
```

Terminal D:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`, connect MetaMask to Hardhat local network, then mint/list/buy/bid.

## Deploying Contract to Sepolia
```bash
cd smart-contracts
npm run deploy:sepolia
npm run export:abi
```

After deployment:
1. Update `VITE_CONTRACT_ADDRESS` in `frontend/.env`
2. Update Netlify env var `VITE_CONTRACT_ADDRESS` with **address only** (no `KEY=` prefix)
3. Redeploy frontend

## NPM Scripts
### Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`

### Backend
- `npm start`
- `npm run dev`

### Smart Contracts
- `npm test`
- `npm run deploy:localhost`
- `npm run deploy:sepolia`
- `npm run export:abi`

## Troubleshooting
- `invalid ENS name ... VITE_CONTRACT_ADDRESS=...`:
  - Your env var value is wrong. Set value to only `0x...`.
- Mint stuck on “Processing…” on hosted app:
  - Check `VITE_API_BASE_URL` and backend CORS settings.
- Local minted NFTs not visible on Netlify:
  - Local Hardhat chain data is separate from Sepolia.

## License
MIT

Built by Maga-khiva.
