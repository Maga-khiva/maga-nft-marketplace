import { ethers } from 'ethers';

export const NFTCard = ({ nft, account, onOpenImage, onOpenAction }) => {
  const isOwner = account && nft.owner.toLowerCase() === account.toLowerCase();
  const isTopBidder = account && nft.topOfferBidder.toLowerCase() === account.toLowerCase();

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open details for NFT ${nft.name} token ${nft.tokenId}`}
      className="nft-card group cursor-pointer w-full"
      onClick={(e) => {
        if (!e.target.closest('button')) onOpenImage(nft);
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
          e.preventDefault();
          onOpenImage(nft);
        }
      }}
    >
      <div className="nft-card-media">
        <img
          src={nft.image}
          alt={nft.name}
          loading="lazy"
          decoding="async"
          className="nft-card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E";
            e.target.style.backgroundColor = '#1F2937';
            e.target.style.padding = '30%';
          }}
        />
        <div className="nft-card-sheen" />
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-slate-100 text-xs font-bold px-2 py-1 rounded-full border border-white/20">
          ID: {nft.tokenId}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 to-transparent">
          <p className="text-[11px] text-slate-200/85">Collection: MAGA Orbit</p>
        </div>
        <div className="nft-card-overlay">
          <span className="nft-overlay-chip">View Details</span>
        </div>
      </div>

      <div className="p-3.5 text-white space-y-2">
        <h3 className="text-base sm:text-lg font-bold truncate text-slate-100">{nft.name}</h3>
        <p className="text-xs text-slate-400 h-8 sm:h-10 overflow-hidden line-clamp-2">{nft.description}</p>

        <div className="grid grid-cols-1 gap-2 text-[11px]">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 px-2 py-1">
            <p className="text-slate-400">Owner</p>
            <p className="truncate text-slate-200">{isOwner ? 'You' : `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`}</p>
          </div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 px-2 py-1">
            <p className="text-slate-400">Top Offer</p>
            <p className="truncate text-teal-200">
              {nft.topOfferAmount > 0 ? `${ethers.formatEther(nft.topOfferAmount.toString())} ETH` : 'No offers yet'}
            </p>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <p className="text-sm sm:text-base font-extrabold text-amber-300">
            {nft.price > 0 ? `${ethers.formatEther(nft.price.toString())} ETH` : 'Not Listed'}
          </p>
        </div>

        <div className="pt-2">
          {isOwner ? (
            <div className="space-y-2">
              {nft.price > 0 ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('cancel', nft); }} className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-md text-xs sm:text-sm">
                  Cancel Listing
                </button>
              ) : (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('list', nft); }} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition shadow-md text-xs sm:text-sm">
                  List for Sale
                </button>
              )}
              {nft.topOfferAmount > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('accept-offer', nft); }} className="w-full bg-fuchsia-600 text-white py-2 rounded-lg font-bold hover:bg-fuchsia-700 transition shadow-md text-xs sm:text-sm">
                  Accept Top Offer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {nft.price > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('buy', nft); }} className="w-full bg-sky-600 text-white py-2 rounded-lg font-bold hover:bg-sky-700 transition shadow-md text-xs sm:text-sm">
                  Buy Now
                </button>
              )}
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('offer', nft); }} className="w-full bg-violet-600 text-white py-2 rounded-lg font-bold hover:bg-violet-700 transition shadow-md text-xs sm:text-sm">
                Place Bid
              </button>
              {isTopBidder && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('cancel-offer', nft); }} className="w-full bg-slate-600 text-white py-2 rounded-lg font-bold hover:bg-slate-700 transition shadow-md text-xs sm:text-sm">
                  Cancel My Bid
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
