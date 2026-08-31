// frontend/src/components/MintSection.jsx
import { useState, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useWeb3 } from '../hooks/Web3Context.js';

// The backend API base URL for image/metadata upload
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const MintSection = () => {
  // Use contractWithSigner for all state-changing transactions
  const { contractWithSigner, account } = useWeb3();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // NEW LOGIC: Success message timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer); // Cleanup on unmount or success change
    }
  }, [success]);


  const setFileAndPreview = (selectedFile) => {
    // Basic validation to only accept images
    if (selectedFile && selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setError('');
        // Create a preview URL for the image
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
    } else {
        setFile(null);
        setFilePreview(null);
        setError('Please select a valid image file (PNG, JPG, etc.).');
    }
  }
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileAndPreview(selectedFile);
  };

  // Drag-and-Drop Handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep isDragging true while dragging over the drop zone
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    setFileAndPreview(droppedFile);
  };


  const handleMint = async () => {
    if (!account) {
      setError('Wallet not connected');
      return;
    }
    if (!contractWithSigner) { 
      setError('Web3 not initialized or wrong network');
      return;
    }
    if (!name || !description || !file) {
      setError('Missing fields: Name, Description, or Image.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 1. Upload Image and Metadata to IPFS via Backend
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name);
      formData.append('description', description);

      // IMPORTANT: Use the constructed apiBase
      const uploadRes = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        let backendMessage = '';
        try {
          const errorPayload = await uploadRes.json();
          backendMessage = errorPayload?.error || '';
        } catch {
          backendMessage = '';
        }
        throw new Error(
          backendMessage
            ? `Upload failed (${uploadRes.status}): ${backendMessage}`
            : `Upload failed (${uploadRes.status}). Check backend /upload route and CORS settings.`,
        );
      }
      const { tokenURI } = await uploadRes.json();
      
      if (!tokenURI) throw new Error('Missing tokenURI from upload response.');

      // 2. Call the smart contract mint function
      const tx = await contractWithSigner.mint(tokenURI);
      await tx.wait();

      setSuccess(`NFT minted successfully!`);
      // Reset form
      setName('');
      setDescription('');
      setFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error("Minting Error:", err);
      // Display a user-friendly error
      const message = err.reason || err.message || 'Mint failed due to a contract or network error.';
      setError(`Mint failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();


  return (
    <section className="app-card scene-enter p-6 sm:p-7">
      <div className="mb-6">
        <p className="uppercase tracking-[0.2em] text-[11px] text-[color:var(--brand)]/80 mb-2">Creator Studio</p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50">Create New NFT</h2>
      </div>
      
      {/* NFT Metadata Inputs */}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="app-input mb-4"
        aria-label="NFT name"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="app-input mb-4 h-24 resize-none"
        aria-label="NFT description"
      />

      {/* File Upload / Drag-and-Drop Area */}
      <div 
          className={`flex flex-col items-center justify-center p-6 mb-4 rounded-xl border-2 border-dashed transition duration-300 cursor-pointer 
            ${isDragging 
                ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/10 ring-2 ring-[color:var(--brand)]/50' 
                : 'border-[color:var(--toggle-border)] hover:border-[color:var(--brand)] hover:bg-black/20'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput} // Click anywhere in the box to open file picker
      >
          {/* Hidden native input */}
          <input 
              type="file" 
              id="file-upload"
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden"
              accept="image/*"
              aria-label="Upload NFT image"
          />

          {/* Content for the drop zone */}
          {!filePreview && (
            <div className='text-center'>
                <UploadCloud className="mx-auto h-10 w-10 text-slate-500" strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-2 text-sm text-slate-300">Drag and drop image here, or <span className="text-[color:var(--brand)] font-semibold">click to select</span></p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}

          {/* Image Preview */}
          {filePreview && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[color:var(--line)]">
                  <img 
                      src={filePreview} 
                      alt="NFT Preview" 
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                      <p className='text-white font-bold text-center'>Click or Drag to Change</p>
                  </div>
              </div>
          )}
      </div>

      {/* Messages */}
      {error && <p className="text-red-300 mb-4 font-semibold text-center">{error}</p>}
      {success && <p className="text-[color:var(--brand)] mb-4 font-semibold text-center">{success}</p>}
      
      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={loading || !account || !contractWithSigner || !file}
        className="app-button-primary w-full text-base sm:text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Mint NFT'
        )}
      </button>
      
      {!account && <p className="text-gray-400 text-sm mt-3 text-center">Connect your wallet to enable minting.</p>}
    </section>
  );
};