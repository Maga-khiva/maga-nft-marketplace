// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Marketplace } from './pages/Marketplace.jsx';
import { Web3Provider } from './hooks/Web3Provider.jsx';
import './index.css'; // Assuming Tailwind setup in index.css

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3Provider>
      <Marketplace />
    </Web3Provider>
  </React.StrictMode>
);