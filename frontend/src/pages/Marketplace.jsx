// frontend/src/pages/Marketplace.jsx
import { MintSection } from '../components/MintSection.jsx';
import { GallerySection } from '../components/GallerySection.jsx';
import { useWeb3 } from '../hooks/Web3Context.js';

// Icon placeholder
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h18a1 1 0 0 1 0 2H5a2 2 0 0 0 0 4h18a1 1 0 0 1 0 2H5a2 2 0 0 0 0 4h14"></path>
    <path d="M15 13V7"></path>
  </svg>
);


export const Marketplace = () => {
  const { account, connectWallet, web3Error, chainId } = useWeb3();

  const accountString = account 
    ? (typeof account === 'string' ? account : account.address || String(account))
    : null;

  const shortAddress = accountString
    ? `${accountString.slice(0, 6)}...${accountString.slice(-4)}`
    : '';

  const isSepolia = chainId === 11155111;

  return (
    <>
      {/* PRO GLASSMORPHISM NAVBAR - Typography Reduced */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          
          {/* Logo & Title - Scaled down 20% */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-base sm:text-xl">
              M
            </div>
            <h1 className="text-base sm:text-xl font-bold text-white tracking-widest">
              MARKETPLACE
            </h1>
          </div>

          {/* Wallet/Chain Status */}
          <div className="flex items-center text-xs sm:text-sm space-x-3 sm:space-x-4">
            
            {/* Network Status */}
            <span className={`px-2 py-1 rounded-full font-semibold ${isSepolia ? 'bg-green-600' : 'bg-red-600'} hidden sm:block text-xs`}>
                {isSepolia ? 'Sepolia' : 'Wrong Network'}
            </span>

            {/* Wallet Status */}
            {accountString ? (
                <a href="#mint-section" className="bg-purple-600/70 hover:bg-purple-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition backdrop-blur-sm flex items-center shadow-lg text-xs sm:text-sm">
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

      {/* Main Content - Typography Reduced */}
      <main className="pt-20 sm:pt-24 pb-12 min-h-screen"> 
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

          {/* Hero Title - Reduced from 7xl to 6xl (desktop) */}
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-2xl">
              MAGA NFT MARKETPLACE
            </h1>
            <p className="text-sm sm:text-lg text-gray-400 mt-3 sm:mt-4">Mint. List. Trade. Own the future of digital assets.</p>
          </div>

          {/* Web3 Error Message */}
          {web3Error && (
              <div className="text-center py-8 bg-red-900/50 border border-red-700 rounded-xl max-w-lg mx-auto mb-10">
                  <p className="text-lg font-bold text-red-300">Connection Error</p> 
                  <p className="text-xs text-red-200 mt-2">{web3Error}</p> 
              </div>
          )}

          {/* Connect Screen - Reduced from 3xl to 2xl (desktop) */}
          {!accountString && !web3Error && (
            <div className="text-center py-20 sm:py-32">
              <div className="inline-block">
                <button
                  onClick={connectWallet}
                  className="app-button-primary text-lg sm:text-2xl px-10 py-5 sm:px-16 sm:py-8 rounded-2xl sm:rounded-3xl shadow-2xl hover-glow transform hover:scale-105"
                >
                  Connect Wallet to Start
                </button>
              </div>
            </div>
          )}

          {/* Main App */}
          {accountString && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
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

      {/* Simple Footer - Reduced from sm to xs (desktop) */}
      <footer className="py-6 border-t border-white/10 text-center text-gray-500 text-xs backdrop-blur-sm">
        &copy; {new Date().getFullYear()} MAGA Marketplace. Built with Hardhat & React.
      </footer>
    </>
  );
};