# Maga NFT Marketplace

A full-stack NFT marketplace built with React (Vite + Tailwind), Express backend (Pinata IPFS upload), and Hardhat smart contracts on Ethereum (Sepolia testnet).

![Maga NFT Marketplace Screenshot](./frontend/public/screenshot.png)  

## Features
- **Mint NFTs**: Upload image, add name/description, mint on Sepolia.
- **Gallery**: View all/my NFTs with search, list/cancel/buy.
- **Web3 Integration**: MetaMask connect, real-time events.
- **IPFS Storage**: Images/metadata pinned via Pinata.
- **Responsive Design**: Works on desktop/mobile.
- **Live Demo**: https://maga-nft-marketplace.netlify.app/

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Ethers.js
- **Backend**: Express.js, Multer (uploads), Axios (Pinata API)
- **Smart Contract**: Solidity, Hardhat, OpenZeppelin (ERC721)
- **Deployment**: Netlify (frontend + functions), Sepolia testnet, Render(backend)

## Setup & Run Locally
1. Clone repo: `git clone https://github.com/Maga-khiva/maga-nft-marketplace`
2. Install deps:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
   - Smart contracts: `cd smart-contracts && npm install`
3. Copy `.env.example` to `.env` in root + frontend/backend — fill keys (Pinata, RPC, private key).
4. Run local blockchain: `cd smart-contracts && npx hardhat node`
5. Deploy contract: New terminal → `npx hardhat run scripts/deploy.js --network localhost`
6. Update `frontend/.env`: `VITE_CONTRACT_ADDRESS=deployed_address` & `VITE_API_BASE_URL=http://localhost:3000`
7. Run backend: `cd backend && npm start`
8. Run frontend: `cd frontend && npm run dev`
9. Open http://localhost:5173 → Connect MetaMask (Localhost 8545) → Mint NFTs!

## Deployment
- **Smart Contract**: Deployed on Sepolia:0x9d0D3D8aEdE7740Cd3DB3FFeBB3C4BfB18FcD981
- **Backend**: Render - https://maga-nft-marketplace.onrender.com
- **Frontend**: Netlify Site (Vite build)

## License
MIT — Free to use/fork.

Built by Maga-khiva — Questions? Open an issue!