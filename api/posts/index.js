// Direct Vercel serverless function (no Express)
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB connection
let cachedDb = null;
async function connectDB() {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = db;
  return db;
}

// Post Schema
const postSchema = new mongoose.Schema({
  username: String,
  hotelName: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === 'POST') {
      // Parse form data
      const form = formidable({ multiples: false });
      
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          return res.status(500).json({ error: err.message });
        }

        try {
          const username = fields.username[0] || fields.username;
          const hotelName = fields.hotelName[0] || fields.hotelName;
          const imageFile = files.image[0] || files.image;

          if (!imageFile) {
            return res.status(400).json({ error: 'No image provided' });
          }

          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(imageFile.filepath, {
            folder: 'messmate'
          });

          // Save to MongoDB
          const post = new Post({
            username,
            hotelName,
            imageUrl: result.secure_url
          });
          await post.save();

          // Clean up temp file
          fs.unlinkSync(imageFile.filepath);

          res.status(201).json(post);
        } catch (error) {
          console.error('Upload error:', error);
          res.status(500).json({ error: error.message });
        }
      });
    } else if (req.method === 'GET') {
      const posts = await Post.find().sort({ createdAt: -1 });
      res.status(200).json(posts);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message });
  }
};
