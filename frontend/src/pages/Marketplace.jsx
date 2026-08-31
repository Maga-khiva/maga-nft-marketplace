// frontend/src/pages/Marketplace.jsx
import { MintSection } from '../components/MintSection.jsx';
import { GallerySection } from '../components/GallerySection.jsx';
import { useWeb3 } from '../hooks/Web3Context.js';
import { useEffect, useState } from 'react';
import logoImage from '../../logo.png';

// Icon placeholder
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h18a1 1 0 0 1 0 2H5a2 2 0 0 0 0 4h18a1 1 0 0 1 0 2H5a2 2 0 0 0 0 4h14"></path>
    <path d="M15 13V7"></path>
  </svg>
);

// A small orbiting-dots motif tied to the "Orbit" name — the one
// deliberate animated moment on the page. Purely decorative/aria-hidden.
const OrbitVisual = () => (
  <svg width="100%" height="100%" viewBox="0 0 220 220" role="img" aria-hidden="true">
    <circle cx="110" cy="110" r="7" fill="var(--accent-gold)" />
    <g className="orbit-ring-cw">
      <circle cx="110" cy="110" r="62" fill="none" stroke="var(--line)" strokeWidth="1" />
      <circle cx="172" cy="110" r="5.5" fill="var(--brand)" />
    </g>
    <g className="orbit-ring-ccw">
      <circle cx="110" cy="110" r="98" fill="none" stroke="var(--line)" strokeWidth="1" />
      <circle cx="110" cy="12" r="4.5" fill="var(--accent-warm)" />
      <circle cx="24" cy="152" r="3.5" fill="var(--muted)" />
    </g>
  </svg>
);

export const Marketplace = () => {
  const { account, connectWallet, web3Error, chainId } = useWeb3();
  const [showBottomPushButton, setShowBottomPushButton] = useState(false);
  const requiredChainId = Number(import.meta.env.VITE_REQUIRED_CHAIN_ID || 11155111);

  const accountString = account 
    ? (typeof account === 'string' ? account : account.address || String(account))
    : null;

  const shortAddress = accountString
    ? `${accountString.slice(0, 6)}...${accountString.slice(-4)}`
    : '';

  const isTargetNetwork = chainId === requiredChainId;
  const networkLabel = requiredChainId === 11155111 ? 'Sepolia' : `Chain ${requiredChainId}`;

  // Site is dark-only now, set once for mobile browser chrome color.
  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', '#0a0e17');
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const scrollableHeight = Math.max(pageHeight - viewportHeight, 0);
      if (scrollableHeight === 0) {
        setShowBottomPushButton(false);
        return;
      }
      const progress = scrollTop / scrollableHeight;
      setShowBottomPushButton(progress > 0.5);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="app-header fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            type="button"
            className="brand-link flex items-center space-x-2 sm:space-x-3"
            aria-label="Refresh app"
            title="Refresh app"
            onClick={() => window.location.reload()}
          >
            <div className="app-brand-mark">
              <img src={logoImage} alt="MAGA Orbit logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
            </div>
            <h1 className="text-sm sm:text-xl font-semibold tracking-wide">
              MAGA ORBIT MARKET
            </h1>
          </button>

          <div className="flex items-center text-xs sm:text-sm space-x-2 sm:space-x-4">
            <span className={`status-pill network-pill font-data ${isTargetNetwork ? 'network-pill-ok' : 'network-pill-warn'}`}>
                {isTargetNetwork ? networkLabel : 'Wrong Network'}
            </span>

            {accountString ? (
                <a href="#mint-section" className="app-button-secondary font-data flex items-center">
                    <WalletIcon />
                    <span className="hidden sm:inline">{shortAddress}</span>
                    <span className="inline sm:hidden">Wallet</span>
                </a>
            ) : (
                <button
                    onClick={connectWallet}
                    className="app-button-primary py-2 px-3 sm:px-4 text-xs sm:text-sm"
                >
                    Connect Wallet
                </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 sm:pt-24 pb-12 min-h-screen"> 
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-6 items-center mb-12 sm:mb-16 scene-enter">
            <div className="md:col-span-3">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] text-slate-50">
                Every trade has
                <br />
                a gravity of its own.
              </h1>
              <p className="text-sm sm:text-lg text-slate-400 mt-4 sm:mt-5 max-w-xl">
                Mint, list, and bid on NFTs settled entirely on-chain — no order book, no middleman.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="font-data text-[10px] tracking-wide text-[color:var(--muted)] border border-[color:var(--line)] rounded px-2 py-1">ERC-721</span>
                <span className="font-data text-[10px] tracking-wide text-[color:var(--muted)] border border-[color:var(--line)] rounded px-2 py-1">IPFS Metadata</span>
                <span className="font-data text-[10px] tracking-wide text-[color:var(--muted)] border border-[color:var(--line)] rounded px-2 py-1">Real-time Events</span>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-center md:justify-end">
              <div className="w-40 h-40 sm:w-52 sm:h-52">
                <OrbitVisual />
              </div>
            </div>
          </div>

          {/* Web3 Error Message */}
          {web3Error && (
              <div className="app-alert app-alert-error text-center py-8 rounded-xl max-w-lg mx-auto mb-10">
                  <p className="text-lg font-bold">Connection Error</p> 
                  <p className="text-xs mt-2">{web3Error}</p> 
              </div>
          )}

          {!accountString && !web3Error && (
            <div className="text-center py-20 sm:py-32 scene-enter-delayed">
              <div className="inline-block">
                <button
                  onClick={connectWallet}
                  className="app-button-primary text-lg sm:text-2xl px-10 py-5 sm:px-16 sm:py-8 rounded-2xl sm:rounded-3xl"
                >
                  Connect Wallet to Start
                </button>
              </div>
            </div>
          )}

          {accountString && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 scene-enter-delayed">
              <div id="mint-section" className="lg:col-span-4">
                <MintSection />
              </div>
              <div id="gallery-section" className="lg:col-span-8">
                <GallerySection />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer py-6 border-t text-center text-xs backdrop-blur-sm">
        &copy; {new Date().getFullYear()} MAGA Orbit Market. Built with Hardhat &amp; React.
      </footer>

      <button
        type="button"
        aria-label="Scroll to top"
        title="Scroll to top"
        className={`bottom-push-btn ${showBottomPushButton ? 'bottom-push-btn-visible' : 'bottom-push-btn-hidden'}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑ Top
      </button>
    </>
  );
};