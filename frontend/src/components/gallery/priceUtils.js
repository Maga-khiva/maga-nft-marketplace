import { ethers } from 'ethers';

export const parsePriceToWei = (rawValue) => {
  const normalized = rawValue.trim().replace(',', '.');
  if (!normalized) return { ok: false, message: 'Price is required.' };
  if (!/^\d*\.?\d{0,18}$/.test(normalized)) {
    return { ok: false, message: 'Use a valid ETH value with up to 18 decimals.' };
  }

  const canonical = normalized.startsWith('.') ? `0${normalized}` : normalized;
  if (canonical === '.' || canonical === '0' || canonical === '0.' || Number(canonical) <= 0) {
    return { ok: false, message: 'Price must be greater than 0.' };
  }

  try {
    return { ok: true, wei: ethers.parseEther(canonical) };
  } catch {
    return { ok: false, message: 'Invalid ETH value.' };
  }
};

export const normalizePriceInput = (value) => value.trim().replace(',', '.');

export const getSuggestedOfferInput = (topOfferAmount) => {
  if (!topOfferAmount || topOfferAmount <= 0n) return '';
  const suggested = topOfferAmount + ethers.parseEther('0.001');
  return ethers.formatEther(suggested);
};
