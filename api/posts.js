// Vercel serverless function for posts
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB connection
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB error:', error);
    throw error;
  }
}

// Post Schema
const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  hotelName: { type: String, required: true },
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
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Handle POST request
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    await connectToDatabase();
    const { username, hotelName } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image' });
    const post = new Post({ username, hotelName, imageUrl: req.file.path });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle GET request
app.get('/api/posts', async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle GET by hotel
app.get('/api/posts/hotel/:hotelName', async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await Post.find({ 
      hotelName: new RegExp(req.params.hotelName, 'i') 
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle GET hotels list
app.get('/api/posts/hotels/list', async (req, res) => {
  try {
    await connectToDatabase();
    const hotels = await Post.distinct('hotelName');
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
