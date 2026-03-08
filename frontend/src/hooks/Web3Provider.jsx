// frontend/src/hooks/Web3Provider.jsx  ←←← SEPOLIA VERSION (fixes network mismatch)
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from './Web3Context.js';
import contractArtifact from '../abi/MagaMarketplace.json';

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractWithSigner, setContractWithSigner] = useState(null);
  const [web3Error, setWeb3Error] = useState(null);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const requiredChainId = Number(import.meta.env.VITE_REQUIRED_CHAIN_ID || 11155111);

  const abi = contractArtifact.abi;

  const resetWeb3State = () => {
    setSigner(null);
    setAccount(null);
    setContract(null);
    setContractWithSigner(null);
  };

  const syncWeb3State = async (web3Provider) => {
    try {
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      if (!contractAddress) {
        setWeb3Error('Missing VITE_CONTRACT_ADDRESS');
        resetWeb3State();
        return;
      }

      if (currentChainId !== requiredChainId) {
        setWeb3Error(`Wrong network. Required chainId: ${requiredChainId}`);
        resetWeb3State();
        return;
      }

      const accounts = await web3Provider.listAccounts();
      if (accounts.length === 0) {
        resetWeb3State();
        setWeb3Error(null);
        return;
      }

      const userSigner = await web3Provider.getSigner();
      const accountAddress = await userSigner.getAddress();
      const readOnlyContract = new ethers.Contract(contractAddress, abi, web3Provider);
      const writableContract = new ethers.Contract(contractAddress, abi, userSigner);

      setSigner(userSigner);
      setAccount(accountAddress);
      setContract(readOnlyContract);
      setContractWithSigner(writableContract);
      setWeb3Error(null);
    } catch (err) {
      resetWeb3State();
      setWeb3Error('Connection failed: ' + (err.message || 'Unknown error'));
    }
  };

  useEffect(() => {
    if (!window.ethereum) {
      setWeb3Error('Install MetaMask!');
      return;
    }

    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(web3Provider);
    syncWeb3State(web3Provider);

    const handleAccountsChanged = () => syncWeb3State(web3Provider);
    const handleChainChanged = () => syncWeb3State(web3Provider);

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [contractAddress, requiredChainId]);

  const connectWallet = async () => {
    if (provider) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await syncWeb3State(provider);
    }
  };

  return (
    <Web3Context.Provider value={{
      provider,
      signer,
      account,
      chainId,
      contract,
      contractWithSigner,
      connectWallet,
      web3Error
    }}>
      {children}
    </Web3Context.Provider>
  );
};
