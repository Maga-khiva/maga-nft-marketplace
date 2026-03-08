// backend/index.js  ←←← FULLY WORKING ES MODULE VERSION
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const app = express();
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

const upload = multer({
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  },
  fileFilter: (req, file, cb) => {
    cb(null, Boolean(file.mimetype && file.mimetype.startsWith('image/')));
  },
});

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PORT = process.env.PORT || 3000;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("PINATA KEYS MISSING! Check your .env file");
  process.exit(1);
}

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = Number(process.env.MAX_UPLOADS_PER_MINUTE || 20);

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
  if (current.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: 'Too many upload requests. Try again later.' });
    return;
  }
  next();
};

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
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!name || !description) return res.status(400).json({ error: 'Missing name or description' });
    if (name.length > 120 || description.length > 2000) {
      return res.status(400).json({ error: 'Metadata exceeds length limits' });
    }

    const imageForm = new FormData();
    imageForm.append('file', req.file.buffer, req.file.originalname);

        const pinImageRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', imageForm, {
      headers: {
        ...imageForm.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    const imageIpfs = pinImageRes.data.IpfsHash;

    const metadata = {
      name,
      description,
      image: `ipfs://${imageIpfs}`,
    };

    const pinJsonRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    const jsonIpfs = pinJsonRes.data.IpfsHash;
    res.json({ tokenURI: `ipfs://${jsonIpfs}` });
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image too large' });
    }
    if (error.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
