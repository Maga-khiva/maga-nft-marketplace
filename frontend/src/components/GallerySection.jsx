// frontend/src/components/GallerySection.jsx
import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/Web3Context.js';
import { ethers } from 'ethers';

// Helper function for input validation
const validatePrice = (value) => {
    // Allows empty string, or positive number (integer or decimal)
    if (value === '') return true;
    // Regex for: Starts with 0. or 1-9. Can have 0-1 decimal points and any number of digits after
    return /^\d*(\.\d*)?$/.test(value) && Number(value) >= 0;
};


export const GallerySection = () => {
  const { contract, account: rawAccount, signer } = useWeb3();

  // Safe account string - LOGIC PRESERVED
  const account = rawAccount 
    ? (typeof rawAccount === 'string' ? rawAccount : rawAccount.address || String(rawAccount))
    : null;

  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  
  // Existing state for action modals (List/Buy/Cancel)
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedNft, setSelectedNft] = useState(null);
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState(''); // NEW: State for price validation error

  // NEW STATE: For the image viewing modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageNft, setSelectedImageNft] = useState(null);

  // LOGIC PRESERVED
  const fetchNFTs = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const total = Number(await contract.totalSupply());
      const items = [];
      for (let i = 0; i < total; i++) {
        try {
          const owner = await contract.ownerOf(i);
          const uri = await contract.tokenURI(i);
          const listingPrice = await contract.listings(i);

          // CRITICAL FIX 1: Change IPFS gateway for robustness
          const metadataRes = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          const metadata = await metadataRes.json();

          items.push({
            tokenId: i,
            owner,
            name: metadata.name || 'Unnamed NFT',
            description: metadata.description || '',
            image: metadata.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : null,
            price: listingPrice, // Keep as BigInt
          });
        } catch (err) {
          console.error(`Failed to load NFT ${i}:`, err);
        }
      }
      setNfts(items);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  // LOGIC PRESERVED (Event listeners and filtering)
  useEffect(() => {
    if (contract) fetchNFTs();
  }, [contract]);

  useEffect(() => {
    if (!contract) return;
    const refresh = () => fetchNFTs();
    contract.on('Transfer', refresh);
    contract.on('Listed', refresh);
    contract.on('ListingCancelled', refresh);
    contract.on('Bought', refresh);
    return () => {
      contract.off('Transfer', refresh);
      contract.off('Listed', refresh);
      contract.off('ListingCancelled', refresh);
      contract.off('Bought', refresh);
    };
  }, [contract]);

  useEffect(() => {
    let filtered = nfts;
    if (view === 'my' && account) {
      filtered = filtered.filter(nft => 
        nft.owner.toLowerCase() === account.toLowerCase()
      );
    }
    if (search) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredNfts(filtered);
  }, [nfts, view, search, account]);

  // Handler for action modals (List/Buy/Cancel)
  const openActionModal = (type, nft) => {
    setModalType(type);
    setSelectedNft(nft);
    setPrice('');
    setPriceError(''); // Reset error on open
    setActionModalOpen(true);
  };
  
  // NEW HANDLER: For image viewing modal
  const openImageModal = (nft) => {
    setSelectedImageNft(nft);
    setImageModalOpen(true);
  };

  // NEW HANDLER: Price input change with validation
  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (validatePrice(value)) {
        setPrice(value);
        setPriceError('');
    } else {
        setPrice(value);
        setPriceError('Please enter a valid ETH amount (e.g., 0.01)');
    }
  };


  // LOGIC PRESERVED (Action handler using signer)
  const handleAction = async () => {
    if (!selectedNft || !contract || !signer) return;
    
    // CRITICAL FIX 2: Check for price validation before proceeding with 'list'
    if (modalType === 'list') {
        if (!price || Number(price) <= 0 || priceError) {
            setPriceError('Price must be a positive number.');
            return;
        }
    }

    try {
      let tx;
      const signedContract = contract.connect(signer);
      if (modalType === 'list') {
        tx = await signedContract.list(selectedNft.tokenId, ethers.parseEther(price));
      } else if (modalType === 'cancel') {
        tx = await signedContract.cancel(selectedNft.tokenId);
      } else if (modalType === 'buy') {
        tx = await signedContract.buy(selectedNft.tokenId, { value: selectedNft.price });
      }
      await tx.wait();
      setActionModalOpen(false); // Close action modal
      fetchNFTs();
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div className="app-card p-4 sm:p-6"> 
      <h2 className="text-xl sm:text-2xl font-extrabold mb-6 text-center text-cyan-300">NFT Marketplace</h2> {/* Typography Reduced */}
      
      {/* Control Bar (Responsive stacking on phone screens) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
        
        {/* Toggles - Typography Reduced */}
        <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-lg border border-gray-700/50 w-full sm:w-auto text-xs sm:text-sm">
          <button 
            onClick={() => setView('all')} 
            className={`flex-1 px-3 py-1 rounded-lg font-semibold transition ${view === 'all' ? 'bg-cyan-500 text-black' : 'text-gray-300 hover:bg-gray-700/50'}`}
          >
            All NFTs
          </button>
          <button 
            onClick={() => setView('my')} 
            className={`flex-1 px-3 py-1 rounded-lg font-semibold transition ${view === 'my' ? 'bg-cyan-500 text-black' : 'text-gray-300 hover:bg-gray-700/50'}`}
          >
            My NFTs
          </button>
        </div>

        {/* Search Input and Refresh Button - Typography Reduced */}
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="app-input px-3 py-1 w-full sm:w-64 text-xs sm:text-sm" 
          />
          <button 
            onClick={fetchNFTs} 
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition flex items-center gap-1 disabled:opacity-50 text-xs sm:text-sm shadow-md"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading / Empty state - Typography Reduced */}
      {loading ? (
        <div className="text-center py-12 text-cyan-400 font-bold text-base">Loading NFTs from IPFS...</div>
      ) : filteredNfts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No NFTs found. Time to mint one or check your filters!</div>
      ) : (
        // NFT Grid - Typography Reduced
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredNfts.map((nft) => (
            <div 
              key={nft.tokenId} 
              className="bg-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-cyan-500/50 transition duration-300 transform hover:scale-[1.02] border border-gray-700 cursor-pointer"
              onClick={(e) => {
                // Ensure click only opens image modal if not on an action button
                if (!e.target.closest('button')) {
                    openImageModal(nft);
                }
              }}
            >
              
              {/* Image and ID */}
              <div className="overflow-hidden relative aspect-square"> 
                <img 
                  src={nft.image} 
                  alt={nft.name} 
                  className="w-full h-full object-cover transition duration-300 hover:opacity-80" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src=`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E`;
                    e.target.style.backgroundColor = '#1F2937'; 
                    e.target.style.padding = '30%';
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
                    ID: {nft.tokenId}
                </div>
              </div>

              <div className="p-4 text-white">
                <h3 className="text-base sm:text-lg font-bold truncate text-cyan-300">{nft.name}</h3>
                <p className="text-xs text-gray-400 h-8 sm:h-10 overflow-hidden line-clamp-2">{nft.description}</p>
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm sm:text-base font-extrabold text-yellow-300 flex items-center gap-1">
                      {nft.price > 0 ? `${ethers.formatEther(nft.price.toString())} ETH` : 'Not Listed'}
                    </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Owner: {account && nft.owner.toLowerCase() === account.toLowerCase() ? 'You' : `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`}
                </p>

                {/* Action Buttons - Typography Reduced */}
                <div className="mt-4">
                  {account && nft.owner.toLowerCase() === account.toLowerCase() ? (
                    nft.price > 0 ? (
                      <button onClick={(e) => {e.stopPropagation(); openActionModal('cancel', nft);}} className="mt-2 w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-md text-xs sm:text-sm">
                        Cancel Listing
                      </button>
                    ) : (
                      <button onClick={(e) => {e.stopPropagation(); openActionModal('list', nft);}} className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-md text-xs sm:text-sm">
                        List for Sale
                      </button>
                    )
                  ) : (
                    nft.price > 0 && (
                      <button onClick={(e) => {e.stopPropagation(); openActionModal('buy', nft);}} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md text-xs sm:text-sm">
                        Buy Now
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* IMAGE VIEW MODAL - Typography Reduced */}
      {imageModalOpen && selectedImageNft && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-2 sm:p-4" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setImageModalOpen(false);
            }
          }}
        >
          <div 
            className="app-card max-w-full sm:max-w-3xl lg:max-w-5xl w-full text-white overflow-hidden" 
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-4 flex justify-between items-center border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
              <h3 className="text-lg sm:text-2xl font-bold text-cyan-300 truncate">{selectedImageNft.name}</h3>
              <button onClick={() => setImageModalOpen(false)} className="text-gray-400 hover:text-white transition text-xl sm:text-2xl font-bold p-1">
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 p-4 sm:p-6"> 
              
              <div className="md:col-span-3 aspect-square w-full rounded-xl overflow-hidden shadow-2xl border-2 border-cyan-500/50"> 
                <img 
                  src={selectedImageNft.image} 
                  alt={selectedImageNft.name} 
                  className="w-full h-full object-contain bg-gray-900" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src=`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E`;
                    e.target.style.backgroundColor = '#1F2937'; 
                    e.target.style.padding = '30%';
                  }}
                />
              </div>

              {/* Right Side: Details & Action */}
              <div className="md:col-span-2 space-y-3 sm:space-y-4"> 
                <p className="text-xs sm:text-base text-gray-300">{selectedImageNft.description}</p>
                <div className="border-t border-gray-700 pt-3 sm:pt-4 space-y-2">
                    <p className="text-sm sm:text-lg font-bold text-white">Token ID: <span className="text-purple-400">{selectedImageNft.tokenId}</span></p>
                    <p className="text-sm sm:text-lg font-bold text-white">Price: 
                        <span className="text-yellow-300 ml-2">
                           {selectedImageNft.price > 0 ? `${ethers.formatEther(selectedImageNft.price.toString())} ETH` : 'Not Listed'}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500 break-words">
                        Owner: {selectedImageNft.owner}
                    </p>
                </div>
                
                {/* Action button in the view modal - Typography Reduced */}
                <div className="pt-3 sm:pt-4">
                    {account && selectedImageNft.owner.toLowerCase() === account.toLowerCase() ? (
                        selectedImageNft.price > 0 ? (
                            <button onClick={() => {openActionModal('cancel', selectedImageNft); setImageModalOpen(false);}} className="app-button-primary w-full bg-red-600 hover:bg-red-700 text-sm sm:text-base">
                                Cancel Listing
                            </button>
                        ) : (
                            <button onClick={() => {openActionModal('list', selectedImageNft); setImageModalOpen(false);}} className="app-button-primary w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base">
                                List for Sale
                            </button>
                        )
                    ) : (
                        selectedImageNft.price > 0 && (
                            <button onClick={() => {openActionModal('buy', selectedImageNft); setImageModalOpen(false);}} className="app-button-primary w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
                                Buy Now
                            </button>
                        )
                    )}
                </div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 text-center border-t border-gray-700/50">
              <button 
                  onClick={() => setImageModalOpen(false)} 
                  className="bg-gray-700 text-white py-2 px-6 rounded-lg font-bold hover:bg-gray-600 transition text-sm"
              >
                  Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL (List/Buy/Cancel) - Typography Reduced + Validation Added */}
      {actionModalOpen && selectedNft && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setActionModalOpen(false); }}
        >
          <div className="app-card p-6 sm:p-8 max-w-sm w-full text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-cyan-300">
                {modalType === 'list' ? 'List NFT' : modalType === 'cancel' ? 'Cancel Listing' : 'Buy NFT'}
              </h3>
              <button onClick={() => setActionModalOpen(false)} className="text-gray-400 hover:text-white transition text-xl font-bold p-1">
                &times;
              </button>
            </div>
            
            <p className="mb-4 text-xs sm:text-sm text-gray-300">
              {modalType === 'list' && `You are listing NFT ID ${selectedNft.tokenId} (${selectedNft.name}).`}
              {modalType === 'cancel' && `Are you sure you want to cancel the listing for NFT ID ${selectedNft.tokenId}?`}
              {modalType === 'buy' && `Confirm purchase of NFT ID ${selectedNft.tokenId} for ${ethers.formatEther(selectedNft.price.toString())} ETH.`}
            </p>

            {modalType === 'list' && (
              <>
                <input
                  type="text"
                  placeholder="Price in ETH (e.g., 0.01)"
                  value={price}
                  onChange={handlePriceChange} // CRITICAL FIX 2: Added validation handler
                  className="app-input mb-4 text-sm"
                />
                {priceError && <p className="text-red-400 text-xs mb-4">{priceError}</p>}
              </>
            )}
            <div className="flex gap-4">
              <button 
                onClick={handleAction} 
                disabled={modalType === 'list' && (Number(price) <= 0 || priceError)} // Disabled if validation fails
                className="app-button-primary flex-1 py-3 text-sm"> 
                Confirm
              </button>
              <button onClick={() => setActionModalOpen(false)} className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition shadow-md text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};