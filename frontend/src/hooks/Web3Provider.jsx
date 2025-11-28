// frontend/src/hooks/Web3Provider.jsx  ←←← SEPOLIA VERSION (fixes network mismatch)
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from './Web3Context.js';

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractWithSigner, setContractWithSigner] = useState(null);
  const [web3Error, setWeb3Error] = useState(null);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const requiredChainId = 11155111;  // ←←← SEPOLIA CHAIN ID

  const abi = [
    "function mint(string memory tokenURI) public returns (uint256)",
    "function list(uint256 tokenId, uint256 price) public",
    "function cancel(uint256 tokenId) public",
    "function buy(uint256 tokenId) public payable",
    "function totalSupply() public view returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tokenURI(uint256 tokenId) public view returns (string memory)",
    "function listings(uint256 tokenId) public view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Listed(uint256 indexed tokenId, uint256 price)",
    "event ListingCancelled(uint256 indexed tokenId)",
    "event Bought(uint256 indexed tokenId, address buyer, uint256 price)"
  ];

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        setWeb3Error('Install MetaMask!');
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      try {
        const network = await web3Provider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);

        if (currentChainId !== requiredChainId) {
          setWeb3Error(`Wrong network! Switch to Sepolia (chainId 11155111)`);
          return;
        }

        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          const userSigner = await web3Provider.getSigner();
          setSigner(userSigner);
          setAccount(accounts[0]);

          const readOnlyContract = new ethers.Contract(contractAddress, abi, web3Provider);
          const writableContract = new ethers.Contract(contractAddress, abi, userSigner);
          
          setContract(readOnlyContract);
          setContractWithSigner(writableContract);
        }

        setWeb3Error(null);
      } catch (err) {
        setWeb3Error('Connection failed: ' + (err.message || 'Unknown error'));
      }
    };

    init();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setContract(null);
        setContractWithSigner(null);
      } else {
        window.location.reload();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (provider) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      window.location.reload();
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