// backend/index.js  ←←← FULLY WORKING ES MODULE VERSION
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PORT = process.env.PORT || 3000;

console.log("Pinata keys loaded:", !!PINATA_API_KEY, !!PINATA_API_SECRET);

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("PINATA KEYS MISSING! Check your .env file");
  process.exit(1);
}

app.get('/', (req, res) => {
  res.send('OK');
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const { name, description } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'Missing name or description' });

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
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});