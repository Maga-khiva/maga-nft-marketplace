// frontend/src/components/MintSection.jsx
import { useState } from 'react';
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
  const [filePreview, setFilePreview] = useState(null); // Added for image preview
  const [isDragging, setIsDragging] = useState(false); // State for visual drag cue

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

      if (!uploadRes.ok) throw new Error('Upload failed on backend/IPFS side.');
      const { tokenURI } = await uploadRes.json();
      
      if (!tokenURI) throw new Error('Missing tokenURI from upload response.');

      // 2. Call the smart contract mint function
      const tx = await contractWithSigner.mint(tokenURI);
      await tx.wait();

      setSuccess(`NFT minted successfully! Token URI: ${tokenURI}`);
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

  // Helper to visually hide the native file input but keep its functionality
  const triggerFileInput = () => document.getElementById('file-upload').click();


  return (
    <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-md shadow-2xl border border-gray-700/50">
      <h2 className="text-3xl font-bold mb-6 text-cyan-300 font-poppins text-center">Create New NFT</h2>
      
      {/* NFT Metadata Inputs */}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="app-input mb-4"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="app-input mb-4 h-24 resize-none"
      />

      {/* File Upload / Drag-and-Drop Area */}
      <div 
          className={`flex flex-col items-center justify-center p-6 mb-4 rounded-xl border-2 border-dashed transition duration-300 cursor-pointer 
            ${isDragging 
                ? 'border-cyan-400 bg-gray-700/70 ring-2 ring-cyan-400' 
                : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-700/50'
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
              onChange={handleFileChange} 
              className="hidden" // Visually hide it
              accept="image/*"
          />

          {/* Content for the drop zone */}
          {!filePreview && (
            <div className='text-center'>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H10c-1.1 0-2 .9-2 2v28c0 1.1.9 2 2 2h28c1.1 0 2-.9 2-2V20M20 16v16m-8-8h16m12-8l-8-8m0 8l8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-sm text-gray-400">Drag 'n' drop image here, or <span className="text-cyan-400 font-medium">click to select</span></p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 1MB</p>
            </div>
          )}

          {/* Image Preview */}
          {filePreview && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-600/50">
                  <img 
                      src={filePreview} 
                      alt="NFT Preview" 
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                      <p className='text-white font-bold text-center'>Click or Drag to Change</p>
                  </div>
              </div>
          )}
      </div>

      {/* Messages */}
      {error && <p className="text-red-400 mb-4 font-semibold text-center">{error}</p>}
      {success && <p className="text-green-400 mb-4 font-semibold text-center">{success}</p>}
      
      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={loading || !account || !contractWithSigner || !file}
        className="app-button-primary w-full text-lg hover-glow" // Applied global button styling
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Mint NFT'
        )}
      </button>
      
      {!account && <p className="text-gray-500 text-sm mt-3 text-center">Connect your wallet to enable minting.</p>}
    </div>
  );
};