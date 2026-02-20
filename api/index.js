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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB connection
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const db = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = db;
  return db;
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
    await connectToDatabase();
    const { username, hotelName } = req.body;
    const imageUrl = req.file.path;
    const post = new Post({ username, hotelName, imageUrl });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/hotels/list', async (req, res) => {
  try {
    await connectToDatabase();
    const hotels = await Post.distinct('hotelName');
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'MessMate API is running!' });
});

module.exports = app;
