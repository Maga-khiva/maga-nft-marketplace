import { ethers } from 'ethers';
import { Modal } from '../Modal.jsx';

export const ImageDetailsModal = ({ open, nft, account, onClose, onOpenAction }) => {
  if (!nft) return null;

  const isOwner = account && nft.owner.toLowerCase() === account.toLowerCase();
  const isTopBidder = account && nft.topOfferBidder.toLowerCase() === account.toLowerCase();

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
        <div className="flex items-center justify-between border-b border-gray-700/50 bg-slate-900/70 px-4 py-3 backdrop-blur-sm sm:px-5">
          <h3 id="image-modal-title" className="text-lg sm:text-2xl font-bold text-slate-50 truncate">{nft.name}</h3>
          <button type="button" aria-label="Close image modal" onClick={onClose} className="text-gray-400 hover:text-white transition text-xl sm:text-2xl font-bold p-1">&times;</button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6 md:grid-cols-5">
          <div className="md:col-span-3 aspect-square w-full rounded-xl overflow-hidden shadow-2xl border border-cyan-400/40 bg-slate-950/70">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-contain bg-gray-900"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E";
                e.target.style.backgroundColor = '#1F2937';
                e.target.style.padding = '30%';
              }}
            />
          </div>

          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            <p id="image-modal-description" className="text-xs sm:text-base text-gray-300">{nft.description || 'No description provided.'}</p>
            <div className="border-t border-gray-700 pt-3 sm:pt-4 space-y-2">
              <p className="text-sm sm:text-lg font-bold text-white">Token ID: <span className="text-teal-300">{nft.tokenId}</span></p>
              <p className="text-sm sm:text-lg font-bold text-white">Price:
                <span className="text-amber-300 ml-2">{nft.price > 0 ? `${ethers.formatEther(nft.price.toString())} ETH` : 'Not Listed'}</span>
              </p>
              <p className="text-sm sm:text-lg font-bold text-white">Top Offer:
                <span className="text-fuchsia-300 ml-2">{nft.topOfferAmount > 0 ? `${ethers.formatEther(nft.topOfferAmount.toString())} ETH` : 'No offers yet'}</span>
              </p>
              <p className="text-xs text-gray-500 break-words">Owner: {nft.owner}</p>
            </div>

            <div className="pt-3 sm:pt-4">
              {isOwner ? (
                <div className="space-y-2">
                  {nft.price > 0 ? (
                    <button type="button" onClick={() => { onClose(); onOpenAction('cancel', nft); }} className="app-button-primary w-full !bg-red-600 hover:!bg-red-700 text-sm sm:text-base !text-white">
                      Cancel Listing
                    </button>
                  ) : (
                    <button type="button" onClick={() => { onClose(); onOpenAction('list', nft); }} className="app-button-primary w-full !bg-emerald-600 hover:!bg-emerald-700 text-sm sm:text-base !text-white">
                      List for Sale
                    </button>
                  )}
                  {nft.topOfferAmount > 0 && (
                    <button type="button" onClick={() => { onClose(); onOpenAction('accept-offer', nft); }} className="app-button-primary w-full !bg-fuchsia-600 hover:!bg-fuchsia-700 text-sm sm:text-base !text-white">
                      Accept Top Offer
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {nft.price > 0 && (
                    <button type="button" onClick={() => { onClose(); onOpenAction('buy', nft); }} className="app-button-primary w-full !bg-sky-600 hover:!bg-sky-700 text-sm sm:text-base !text-white">
                      Buy Now
                    </button>
                  )}
                  <button type="button" onClick={() => { onClose(); onOpenAction('offer', nft); }} className="app-button-primary w-full !bg-violet-600 hover:!bg-violet-700 text-sm sm:text-base !text-white">
                    Place Bid
                  </button>
                  {isTopBidder && (
                    <button type="button" onClick={() => { onClose(); onOpenAction('cancel-offer', nft); }} className="app-button-primary w-full !bg-slate-600 hover:!bg-slate-700 text-sm sm:text-base !text-white">
                      Cancel My Bid
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700/50 bg-slate-900/65 px-4 py-3 text-center sm:px-5 sm:py-4">
          <button type="button" onClick={onClose} className="app-button-secondary min-w-32">Close View</button>
        </div>
      </div>
    </Modal>
  );
};
