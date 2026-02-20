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

// Disable body parsing - MUST be at top level
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected');

    if (req.method === 'POST') {
      console.log('Processing POST request...');
      
      // Parse form data
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        keepExtensions: true,
      });
      
      return new Promise((resolve) => {
        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error('Form parse error:', err);
            res.status(500).json({ error: 'Failed to parse form: ' + err.message });
            return resolve();
          }

          try {
            console.log('Form parsed:', { fields, files: Object.keys(files) });
            
            const username = Array.isArray(fields.username) ? fields.username[0] : fields.username;
            const hotelName = Array.isArray(fields.hotelName) ? fields.hotelName[0] : fields.hotelName;
            const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

            if (!imageFile || !imageFile.filepath) {
              console.error('No image file found');
              res.status(400).json({ error: 'No image provided' });
              return resolve();
            }

            console.log('Uploading to Cloudinary:', {
              filepath: imageFile.filepath,
              size: imageFile.size,
              mimetype: imageFile.mimetype
            });

            // Upload to Cloudinary WITHOUT folder (root level)
            const result = await cloudinary.uploader.upload(imageFile.filepath, {
              resource_type: 'auto',
              transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            });

            console.log('Cloudinary success:', result.secure_url);

            // Save to MongoDB
            const post = new Post({
              username: username || 'Anonymous',
              hotelName: hotelName || 'Unknown',
              imageUrl: result.secure_url
            });
            
            await post.save();
            console.log('MongoDB save success:', post._id);

            // Clean up temp file
            try {
              if (fs.existsSync(imageFile.filepath)) {
                fs.unlinkSync(imageFile.filepath);
              }
            } catch (e) {
              console.log('Cleanup skipped:', e.message);
            }

            res.status(201).json(post);
            resolve();
          } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            res.status(500).json({ 
              error: errorMessage,
              details: error.http_code ? `Cloudinary error: ${error.http_code}` : 'Server error'
            });
            resolve();
          }
        });
      });
    } else if (req.method === 'GET') {
      console.log('Fetching posts...');
      const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
      console.log(`Found ${posts.length} posts`);
      res.status(200).json(posts);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    res.status(500).json({ 
      error: errorMessage
    });
  }
}
