import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/Web3Context.js';
import { NFTCard } from './gallery/NFTCard.jsx';
import { ImageDetailsModal } from './gallery/ImageDetailsModal.jsx';
import { ActionModal } from './gallery/ActionModal.jsx';
import { getSuggestedOfferInput, parsePriceToWei } from './gallery/priceUtils.js';

export const GallerySection = () => {
  const { contract, account: rawAccount, signer } = useWeb3();

  const account = rawAccount
    ? (typeof rawAccount === 'string' ? rawAccount : rawAccount.address || String(rawAccount))
    : null;

  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedNft, setSelectedNft] = useState(null);
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [actionError, setActionError] = useState('');

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageNft, setSelectedImageNft] = useState(null);

  const fetchNFTs = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const total = Number(await contract.totalSupply());
      const items = [];

      for (let i = total - 1; i >= 0; i--) {
        try {
          const owner = await contract.ownerOf(i);
          const uri = await contract.tokenURI(i);
          const listingPrice = await contract.listings(i);
          const listingSeller = await contract.listingSellers(i);
          const highestOffer = await contract.highestOffers(i);

          const metadataRes = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          const metadata = await metadataRes.json();

          items.push({
            tokenId: i,
            owner,
            name: metadata.name || 'Unnamed NFT',
            description: metadata.description || '',
            image: metadata.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : null,
            price: listingPrice,
            listingSeller,
            topOfferBidder: highestOffer[0],
            topOfferAmount: highestOffer[1],
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
    contract.on('OfferPlaced', refresh);
    contract.on('OfferCancelled', refresh);
    contract.on('OfferAccepted', refresh);

    return () => {
      contract.off('Transfer', refresh);
      contract.off('Listed', refresh);
      contract.off('ListingCancelled', refresh);
      contract.off('Bought', refresh);
      contract.off('OfferPlaced', refresh);
      contract.off('OfferCancelled', refresh);
      contract.off('OfferAccepted', refresh);
    };
  }, [contract]);

  useEffect(() => {
    let filtered = nfts;
    if (view === 'my' && account) {
      filtered = filtered.filter((nft) => nft.owner.toLowerCase() === account.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter((nft) => nft.name.toLowerCase().includes(search.toLowerCase()));
    }
    setFilteredNfts(filtered);
  }, [nfts, view, search, account]);

  const openActionModal = (type, nft) => {
    let initialPrice = '';

    if (type === 'list' && nft.price > 0) {
      initialPrice = ethers.formatEther(nft.price.toString());
    }
    if (type === 'offer') {
      initialPrice = getSuggestedOfferInput(nft.topOfferAmount);
    }

    setModalType(type);
    setSelectedNft(nft);
    setPrice(initialPrice);
    setPriceError('');
    setActionError('');
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setSelectedNft(null);
    setPrice('');
    setPriceError('');
    setActionError('');
  };

  const openImageModal = (nft) => {
    setSelectedImageNft(nft);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageNft(null);
  };

  const handleAction = async () => {
    if (!selectedNft || !contract || !signer) return;

    const needsPrice = modalType === 'list' || modalType === 'offer';
    const parsedPrice = needsPrice ? parsePriceToWei(price) : null;

    if (needsPrice && (!parsedPrice || !parsedPrice.ok)) {
      setPriceError(parsedPrice?.message || 'Please enter a valid price.');
      return;
    }

    try {
      setActionError('');
      const signedContract = contract.connect(signer);
      let tx;

      if (modalType === 'list') tx = await signedContract.list(selectedNft.tokenId, parsedPrice.wei);
      if (modalType === 'cancel') tx = await signedContract.cancel(selectedNft.tokenId);
      if (modalType === 'buy') tx = await signedContract.buy(selectedNft.tokenId, { value: selectedNft.price });
      if (modalType === 'offer') tx = await signedContract.placeOffer(selectedNft.tokenId, { value: parsedPrice.wei });
      if (modalType === 'cancel-offer') tx = await signedContract.cancelOffer(selectedNft.tokenId);
      if (modalType === 'accept-offer') tx = await signedContract.acceptOffer(selectedNft.tokenId);

      if (!tx) {
        setActionError('Unknown action type.');
        return;
      }

      await tx.wait();
      closeActionModal();
      fetchNFTs();
    } catch (error) {
      console.error('Transaction failed:', error);
      const reason = error?.shortMessage || error?.reason || error?.message || 'Transaction failed';
      setActionError(reason.replace('execution reverted: ', '').trim());
    }
  };

  return (
    <section className="app-card scene-enter-delayed p-4 sm:p-6">
      <div className="mb-6">
        <p className="uppercase tracking-[0.2em] text-[11px] text-teal-200/70 mb-2">Marketplace</p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">Discover and Trade</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
        <div className="flex space-x-2 p-1 bg-slate-900/70 rounded-lg border border-slate-700/60 w-full sm:w-auto text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setView('all')}
            className={`flex-1 px-3 py-1 rounded-lg font-semibold transition ${view === 'all' ? 'bg-teal-300 text-[#10242f]' : 'text-gray-300 hover:bg-slate-700/70'}`}
          >
            All NFTs
          </button>
          <button
            type="button"
            onClick={() => setView('my')}
            className={`flex-1 px-3 py-1 rounded-lg font-semibold transition ${view === 'my' ? 'bg-teal-300 text-[#10242f]' : 'text-gray-300 hover:bg-slate-700/70'}`}
          >
            My NFTs
          </button>
        </div>

        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="app-input px-3 py-1 w-full sm:w-64 text-xs sm:text-sm"
            aria-label="Search NFTs by name"
          />
          <button type="button" onClick={fetchNFTs} disabled={loading} className="app-button-secondary px-4 py-2">
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-teal-200 font-bold text-base">Loading NFTs from IPFS...</div>
      ) : filteredNfts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No NFTs found. Mint one or update your filters.</div>
      ) : (
        <div className="stagger-grid grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:gap-5">
          {filteredNfts.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              nft={nft}
              account={account}
              onOpenImage={openImageModal}
              onOpenAction={openActionModal}
            />
          ))}
        </div>
      )}

      <ImageDetailsModal
        open={imageModalOpen && Boolean(selectedImageNft)}
        nft={selectedImageNft}
        account={account}
        onClose={closeImageModal}
        onOpenAction={openActionModal}
      />

      <ActionModal
        open={actionModalOpen && Boolean(selectedNft)}
        selectedNft={selectedNft}
        modalType={modalType}
        price={price}
        setPrice={setPrice}
        priceError={priceError}
        setPriceError={setPriceError}
        actionError={actionError}
        onConfirm={handleAction}
        onClose={closeActionModal}
      />
    </section>
  );
};
