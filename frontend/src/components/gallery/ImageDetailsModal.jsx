import { ethers } from 'ethers';
import { Modal } from '../Modal.jsx';

export const ImageDetailsModal = ({ open, nft, account, onClose, onOpenAction }) => {
  if (!nft) return null;

  const isOwner = account && nft.owner.toLowerCase() === account.toLowerCase();
  const isTopBidder = account && nft.topOfferBidder.toLowerCase() === account.toLowerCase();
  const isListed = nft.price > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="image-modal-title"
      describedBy="image-modal-description"
      maxWidthClass="max-w-full sm:max-w-2xl lg:max-w-4xl"
      closeOnOverlay
      panelClassName="overflow-hidden"
    >
      <div className="flex max-h-[88vh] flex-col">
        <div className="flex items-center justify-between border-b border-[color:var(--line)] bg-black/30 px-4 py-3 backdrop-blur-sm sm:px-5">
          <h3 id="image-modal-title" className="text-lg sm:text-2xl font-semibold text-slate-50 truncate">{nft.name}</h3>
          <button type="button" aria-label="Close image modal" onClick={onClose} className="text-gray-400 hover:text-white transition text-xl sm:text-2xl font-bold p-1">&times;</button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6 md:grid-cols-5">
          <div className="md:col-span-3 aspect-square w-full rounded-xl overflow-hidden shadow-2xl border border-[color:var(--brand)]/30 bg-black/40">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-contain bg-[#0a0e17]"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E";
                e.target.style.backgroundColor = '#0a0e17';
                e.target.style.padding = '30%';
              }}
            />
          </div>

          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            <p id="image-modal-description" className="text-xs sm:text-base text-gray-300">{nft.description || 'No description provided.'}</p>
            <div className="border-t border-[color:var(--line)] pt-3 sm:pt-4 space-y-2">
              <p className="text-sm sm:text-lg font-semibold text-white">Token ID: <span className="font-data text-[color:var(--brand)]">{nft.tokenId}</span></p>
              <p className="text-sm sm:text-lg font-semibold text-white">Price:
                <span className="font-data text-[color:var(--accent-gold)] ml-2">{isListed ? `${ethers.formatEther(nft.price.toString())} ETH` : 'Not Listed'}</span>
              </p>
              <p className="text-sm sm:text-lg font-semibold text-white">Top Offer:
                <span className="font-data text-[color:var(--brand)] ml-2">{nft.topOfferAmount > 0 ? `${ethers.formatEther(nft.topOfferAmount.toString())} ETH` : 'No offers yet'}</span>
              </p>
              <p className="text-xs text-gray-500 font-data break-words">Owner: {nft.owner}</p>
            </div>

            <div className="pt-3 sm:pt-4">
              {isOwner ? (
                <div className="space-y-2">
                  {isListed ? (
                    <button type="button" onClick={() => { onClose(); onOpenAction('cancel', nft); }} className="card-action-btn btn-action-danger py-3 text-sm sm:text-base">
                      Cancel Listing
                    </button>
                  ) : (
                    <button type="button" onClick={() => { onClose(); onOpenAction('list', nft); }} className="card-action-btn btn-action-list py-3 text-sm sm:text-base">
                      List for Sale
                    </button>
                  )}
                  {nft.topOfferAmount > 0 && (
                    <button type="button" onClick={() => { onClose(); onOpenAction('accept-offer', nft); }} className="card-action-btn btn-action-accept py-3 text-sm sm:text-base">
                      Accept Top Offer
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {isListed && (
                    <button type="button" onClick={() => { onClose(); onOpenAction('buy', nft); }} className="card-action-btn btn-action-primary py-3 text-sm sm:text-base">
                      Buy Now
                    </button>
                  )}
                  <button type="button" onClick={() => { onClose(); onOpenAction('offer', nft); }} className="card-action-btn btn-action-bid py-3 text-sm sm:text-base">
                    Place Bid
                  </button>
                  {isTopBidder && (
                    <button type="button" onClick={() => { onClose(); onOpenAction('cancel-offer', nft); }} className="card-action-btn btn-action-danger py-3 text-sm sm:text-base">
                      Cancel My Bid
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--line)] bg-black/25 px-4 py-3 text-center sm:px-5 sm:py-4">
          <button type="button" onClick={onClose} className="app-button-secondary min-w-32">Close View</button>
        </div>
      </div>
    </Modal>
  );
};