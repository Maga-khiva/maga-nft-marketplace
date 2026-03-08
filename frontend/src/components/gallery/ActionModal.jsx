import { ethers } from 'ethers';
import { Modal } from '../Modal.jsx';
import { normalizePriceInput } from './priceUtils.js';

const TITLES = {
  list: 'List NFT',
  cancel: 'Cancel Listing',
  buy: 'Buy NFT',
  offer: 'Place Bid',
  'cancel-offer': 'Cancel Bid',
  'accept-offer': 'Accept Top Offer',
};

export const ActionModal = ({
  open,
  selectedNft,
  modalType,
  price,
  setPrice,
  priceError,
  setPriceError,
  actionError,
  onConfirm,
  onClose,
}) => {
  if (!selectedNft) return null;

  const needsPriceInput = modalType === 'list' || modalType === 'offer';

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="action-modal-title"
      describedBy="action-modal-description"
      maxWidthClass="max-w-sm"
      closeOnOverlay
      containerClassName="items-end sm:items-center"
      panelClassName="rounded-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl overflow-hidden"
    >
      <div className="max-h-[88vh] overflow-y-auto p-5 text-white sm:p-8">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-500/70 sm:hidden" />
        <div className="mb-4 flex justify-between items-start">
          <h3 id="action-modal-title" className="text-lg sm:text-xl font-bold text-slate-50">{TITLES[modalType] || 'Action'}</h3>
          <button type="button" aria-label="Close action modal" onClick={onClose} className="text-gray-400 hover:text-white transition text-xl font-bold p-1">&times;</button>
        </div>

        <p id="action-modal-description" className="mb-4 text-xs sm:text-sm text-gray-300">
          {modalType === 'list' && `You are listing NFT ID ${selectedNft.tokenId} (${selectedNft.name}).`}
          {modalType === 'cancel' && `Are you sure you want to cancel the listing for NFT ID ${selectedNft.tokenId}?`}
          {modalType === 'buy' && `Confirm purchase of NFT ID ${selectedNft.tokenId} for ${ethers.formatEther(selectedNft.price.toString())} ETH.`}
          {modalType === 'offer' && `Set your bid price for NFT ID ${selectedNft.tokenId}. Funds are escrowed until accepted, cancelled, or outbid.`}
          {modalType === 'cancel-offer' && `Cancel your current top bid for NFT ID ${selectedNft.tokenId}. Funds return to your wallet.`}
          {modalType === 'accept-offer' && `Accept highest bid of ${ethers.formatEther(selectedNft.topOfferAmount.toString())} ETH for NFT ID ${selectedNft.tokenId}.`}
        </p>

        {needsPriceInput && (
          <>
            <input
              type="text"
              data-autofocus
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder={modalType === 'list' ? 'Listing price in ETH (e.g., 0.05)' : 'Bid price in ETH (e.g., 0.08)'}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setPriceError('');
              }}
              onBlur={() => setPrice(normalizePriceInput(price))}
              className="app-input mb-4 text-sm"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {['0.01', '0.05', '0.1'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setPrice(preset);
                    setPriceError('');
                  }}
                  className="app-button-secondary !py-1.5 !px-3 text-xs"
                >
                  {preset} ETH
                </button>
              ))}
            </div>
            {priceError && <p className="text-red-400 text-xs mb-4">{priceError}</p>}
          </>
        )}

        {actionError && <p className="text-red-400 text-xs mb-4">{actionError}</p>}

        <div className="flex gap-3 sm:gap-4">
          <button type="button" onClick={onConfirm} className="app-button-primary flex-1 py-3 text-sm">
            Confirm
          </button>
          <button type="button" onClick={onClose} className="app-button-secondary flex-1 py-3 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
