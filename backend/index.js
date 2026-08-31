// backend/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

// Bumped the default from 5MB -> 10MB: typical NFT artwork (PNG/JPEG at
// reasonable resolution) routinely exceeds 5MB. Still fully overridable
// via env so you can tune it without a redeploy of code.
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
const MAX_UPLOADS_PER_MINUTE = Number(process.env.MAX_UPLOADS_PER_MINUTE || 20);
const PINATA_TIMEOUT_MS = Number(process.env.PINATA_TIMEOUT_MS || 20_000);

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error('PINATA KEYS MISSING! Check your .env file (PINATA_API_KEY / PINATA_API_SECRET).');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '1mb' }));

const upload = multer({
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    cb(null, Boolean(file.mimetype && file.mimetype.startsWith('image/')));
  },
});

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per-instance; resets on restart/redeploy —
// fine for a portfolio project, swap for Redis if this ever needs to scale
// horizontally across multiple Render instances).
// ---------------------------------------------------------------------------
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000;

const uploadRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || now > current.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  current.count += 1;
  if (current.count > MAX_UPLOADS_PER_MINUTE) {
    res.status(429).json({ error: 'Too many upload requests. Try again later.' });
    return;
  }
  next();
};

// ---------------------------------------------------------------------------
// Pinata helpers (kept separate from the route so the route body stays
// readable and each step's failure is easy to trace in logs)
// ---------------------------------------------------------------------------
async function pinImageToIpfs(file) {
  const form = new FormData();
  form.append('file', file.buffer, file.originalname);

  const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
    headers: {
      ...form.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
    timeout: PINATA_TIMEOUT_MS,
    maxBodyLength: Infinity, // form-data can exceed axios's small default for big images
    maxContentLength: Infinity,
  });

  return response.data.IpfsHash;
}

async function pinJsonToIpfs(metadata) {
  const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
    timeout: PINATA_TIMEOUT_MS,
  });

  return response.data.IpfsHash;
}

function validateMetadataFields(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!name || !description) {
    return { error: 'Missing name or description' };
  }
  if (name.length > 120 || description.length > 2000) {
    return { error: 'Metadata exceeds length limits' };
  }
  return { name, description };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('OK');
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'maga-marketplace-backend',
    timestamp: new Date().toISOString(),
  });
});

app.post('/upload', uploadRateLimit, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const parsed = validateMetadataFields(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const imageIpfs = await pinImageToIpfs(req.file);
    const jsonIpfs = await pinJsonToIpfs({
      name: parsed.name,
      description: parsed.description,
      image: `ipfs://${imageIpfs}`,
    });

    res.json({ tokenURI: `ipfs://${jsonIpfs}` });
  } catch (error) {
    // Anything that reaches here is a failure *inside* the async handler
    // (e.g. Pinata request failed/timed out) — Multer/CORS errors that
    // happen in middleware are caught separately below, since they never
    // reach this try/catch at all.
    console.error('Upload error:', error.response?.data || error.message);
    res.status(502).json({ error: 'Failed to pin file to IPFS. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// Centralized error handler — MUST be defined after all routes, and MUST
// keep all 4 arguments (err, req, res, next) for Express to recognize it
// as an error handler. This is what actually catches:
//   - Multer errors (file too large, wrong mimetype) thrown in middleware
//     before the /upload route body ever runs
//   - CORS rejections thrown in the cors() middleware
//   - Any other middleware-level error
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `Image too large. Max size is ${(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)}MB.`,
      });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});