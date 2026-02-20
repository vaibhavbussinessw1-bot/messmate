const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Create new post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { username, hotelName } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

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
