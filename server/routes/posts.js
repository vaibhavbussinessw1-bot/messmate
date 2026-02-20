const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Post = require('../models/Post');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'messmate',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create new post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { username, hotelName } = req.body;
    const imageUrl = req.file.path; // Cloudinary URL

    const post = new Post({
      username,
      hotelName,
      imageUrl
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posts by hotel
router.get('/hotel/:hotelName', async (req, res) => {
  try {
    const posts = await Post.find({ 
      hotelName: new RegExp(req.params.hotelName, 'i') 
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique hotel names
router.get('/hotels/list', async (req, res) => {
  try {
    const hotels = await Post.distinct('hotelName');
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
