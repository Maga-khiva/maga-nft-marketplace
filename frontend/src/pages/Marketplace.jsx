// frontend/src/pages/Marketplace.jsx
import { MintSection } from '../components/MintSection.jsx';
import { GallerySection } from '../components/GallerySection.jsx';
import { useWeb3 } from '../hooks/Web3Context.js';
import { useEffect, useState } from 'react';

// Icon placeholder
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h18a1 1 0 0 1 0 2H5a2 2 0 0 0 0 4h18a1 1 0 0 1 0 2H5a2 2 0 0 0 0 4h14"></path>
    <path d="M15 13V7"></path>
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7.2 7.2 0 0 0 9.8 9.8Z" />
  </svg>
);

const THEME_STORAGE_KEY = 'maga-ui-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const Marketplace = () => {
  const { account, connectWallet, web3Error, chainId } = useWeb3();
  const [theme, setTheme] = useState(getInitialTheme);
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'light' ? '#f1f5f9' : '#0f1824');
    }
  }, [theme]);

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
              <img src="/logo.png" alt="MAGA Orbit logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
            </div>
            <h1 className="text-sm sm:text-xl font-bold tracking-wide">
              MAGA ORBIT MARKET
            </h1>
          </button>

          <div className="flex items-center text-xs sm:text-sm space-x-2 sm:space-x-4">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <span className={`status-pill network-pill ${isTargetNetwork ? 'network-pill-ok' : 'network-pill-warn'}`}>
                {isTargetNetwork ? networkLabel : 'Wrong Network'}
            </span>

            {accountString ? (
                <a href="#mint-section" className="app-button-secondary flex items-center">
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

          <div className="text-center mb-10 sm:mb-12 scene-enter">
            <p className="uppercase tracking-[0.26em] text-[11px] text-sky-200/75 mb-3">Modern on-chain marketplace</p>
            <h1 className="hero-title text-3xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-cyan-100 to-blue-200 drop-shadow-2xl">
              Mint. List. Trade.
            </h1>
            <p className="text-sm sm:text-lg text-slate-300 mt-3 sm:mt-4 max-w-3xl mx-auto">
              A cleaner, faster NFT flow with live wallet state, safer listings, and responsive trading UI.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="status-pill bg-slate-700/60 text-slate-200 border border-slate-500/40">ERC-721</span>
              <span className="status-pill bg-slate-700/60 text-slate-200 border border-slate-500/40">IPFS Metadata</span>
              <span className="status-pill bg-slate-700/60 text-slate-200 border border-slate-500/40">Real-time Events</span>
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
        &copy; {new Date().getFullYear()} MAGA Orbit Market. Built with Hardhat & React.
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
