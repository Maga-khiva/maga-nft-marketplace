// frontend/src/utils/ipfs.js
//
// Single source of truth for IPFS gateway resolution. Used by both
// GallerySection (metadata fetch) and NFTCard (image fetch) so a gateway
// outage/slowness in one place doesn't silently break either.
export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

export function resolveIpfsUri(uri, gatewayIndex = 0) {
  if (!uri) return null;
  if (!uri.startsWith('ipfs://')) return uri; // already a plain http(s) URL
  const cid = uri.slice('ipfs://'.length);
  return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${cid}`;
}

export async function fetchJsonWithGatewayFallback(ipfsUri) {
  let lastError;
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const res = await fetch(resolveIpfsUri(ipfsUri, i));
      if (!res.ok) throw new Error(`Gateway responded with ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}