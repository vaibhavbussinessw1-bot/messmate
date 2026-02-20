// Vercel serverless function
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    message: 'MessMate API is running!',
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasCloudinaryName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasCloudinaryKey: !!process.env.CLOUDINARY_API_KEY,
      hasCloudinarySecret: !!process.env.CLOUDINARY_API_SECRET
    }
  });
});

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured');
} catch (error) {
  console.error('Cloudinary config error:', error);
}

// MongoDB connection
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    console.log('MongoDB connected');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Post Schema
const postSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  hotelName: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'messmate',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Routes
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received');
    await connectToDatabase();
    const { username, hotelName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageUrl = req.file.path;
    console.log('Image uploaded to:', imageUrl);
    
    const post = new Post({ username, hotelName, imageUrl });
    await post.save();
    console.log('Post saved to database');
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/hotel/:hotelName', async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await Post.find({ 
      hotelName: new RegExp(req.params.hotelName, 'i') 
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Fetch hotel posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/hotels/list', async (req, res) => {
  try {
    await connectToDatabase();
    const hotels = await Post.distinct('hotelName');
    res.json(hotels);
  } catch (error) {
    console.error('Fetch hotels error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
