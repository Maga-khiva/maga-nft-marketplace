import { useState } from 'react';
import { ethers } from 'ethers';
import { IPFS_GATEWAYS, resolveIpfsUri } from '../../utils/ipfs.js';

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'%3E%3C/path%3E%3Cpolyline points='7 10 12 15 17 10'%3E%3C/polyline%3E%3Cline x1='12' y1='15' x2='12' y2='3'%3E%3C/line%3E%3C/svg%3E";

export const NFTCard = ({ nft, account, onOpenImage, onOpenAction }) => {
  const isOwner = account && nft.owner.toLowerCase() === account.toLowerCase();
  const isTopBidder = account && nft.topOfferBidder.toLowerCase() === account.toLowerCase();
  const isListed = nft.price > 0;
  const ownerLabel = isOwner ? 'You' : `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`;

  // Try each IPFS gateway in turn before giving up and showing the
  // placeholder icon. A single slow/unreachable gateway on one image
  // shouldn't be a dead end — the metadata fetch already does the same
  // fallback dance, images need it just as much.
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const imageSrc = exhausted ? FALLBACK_IMG : resolveIpfsUri(nft.image, gatewayIndex);

  const handleImageError = () => {
    if (gatewayIndex < IPFS_GATEWAYS.length - 1) {
      setGatewayIndex((i) => i + 1);
    } else {
      setExhausted(true);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open details for NFT ${nft.name} token ${nft.tokenId}`}
      data-listed={isListed ? 'true' : 'false'}
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
        {/* Blurred fill behind the real image so non-square art never looks
            cropped. Shares the same src/retry state as the main image but
            doesn't drive the retry itself, to avoid double-incrementing
            the gateway index when both tags fail on the same bad URL. */}
        <img src={imageSrc} alt="" aria-hidden="true" className="nft-card-image-bg" />
        <img
          src={imageSrc}
          alt={nft.name}
          loading="lazy"
          decoding="async"
          className="nft-card-image"
          onError={handleImageError}
        />
        <div className="nft-card-sheen" />
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-slate-100 font-data text-[11px] px-2 py-1 rounded-full border border-white/15">
          #{nft.tokenId}
        </div>
        <div className="nft-card-overlay">
          <span className="nft-overlay-chip">View Details</span>
        </div>
      </div>

      <div className="p-3 text-white space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold truncate text-slate-100">{nft.name}</h3>
          <p className="font-data text-xs sm:text-sm font-semibold text-[color:var(--accent-gold)] shrink-0">
            {isListed ? `${ethers.formatEther(nft.price.toString())} ETH` : 'Not Listed'}
          </p>
        </div>

        <div className="flex items-center justify-between font-data text-[10px] text-slate-500">
          <span className="truncate">{ownerLabel}</span>
          <span className="truncate text-[color:var(--brand)] shrink-0 ml-2">
            {nft.topOfferAmount > 0 ? `${ethers.formatEther(nft.topOfferAmount.toString())} ETH bid` : 'no bids'}
          </span>
        </div>

        <div className="pt-1 space-y-1.5">
          {isOwner ? (
            <>
              {isListed ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('cancel', nft); }} className="card-action-btn btn-action-danger py-1.5 text-xs">
                  Cancel Listing
                </button>
              ) : (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('list', nft); }} className="card-action-btn btn-action-list py-1.5 text-xs">
                  List for Sale
                </button>
              )}
              {nft.topOfferAmount > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('accept-offer', nft); }} className="card-action-btn btn-action-accept py-1.5 text-xs">
                  Accept Top Offer
                </button>
              )}
            </>
          ) : (
            <>
              {isListed && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('buy', nft); }} className="card-action-btn btn-action-primary py-1.5 text-xs">
                  Buy Now
                </button>
              )}
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('offer', nft); }} className="card-action-btn btn-action-bid py-1.5 text-xs">
                Place Bid
              </button>
              {isTopBidder && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenAction('cancel-offer', nft); }} className="card-action-btn btn-action-danger py-1.5 text-xs">
                  Cancel My Bid
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};