// Vercel Serverless Function for Posts
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');
const fs = require('fs');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dusmps71b',
  api_key: process.env.CLOUDINARY_API_KEY || '967577766443571',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'AKuQbIETmfG1eO-qW4L-NCdMLTY'
});

// MongoDB Connection
let cachedDb = null;
async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    cachedDb = connection;
    console.log('✅ MongoDB connected');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Post Schema
const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  hotelName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main Handler
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Connect to MongoDB
    await connectDB();

    // GET - Fetch all posts
    if (req.method === 'GET') {
      try {
        const posts = await Post.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        
        console.log(`✅ Fetched ${posts.length} posts`);
        return res.status(200).json(posts);
      } catch (error) {
        console.error('❌ Error fetching posts:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch posts',
          message: error.message 
        });
      }
    }

    // POST - Upload new post
    if (req.method === 'POST') {
      return new Promise((resolve) => {
        const form = formidable({
          maxFileSize: 10 * 1024 * 1024, // 10MB
          keepExtensions: true,
          multiples: false,
        });

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error('❌ Form parsing error:', err);
            res.status(400).json({ 
              error: 'Failed to parse upload',
              message: err.message 
            });
            return resolve();
          }

          try {
            // Extract fields
            const username = Array.isArray(fields.username) ? fields.username[0] : fields.username;
            const hotelName = Array.isArray(fields.hotelName) ? fields.hotelName[0] : fields.hotelName;
            const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

            // Validation
            if (!username || !hotelName) {
              res.status(400).json({ error: 'Username and hotel name are required' });
              return resolve();
            }

            if (!imageFile || !imageFile.filepath) {
              res.status(400).json({ error: 'Image file is required' });
              return resolve();
            }

            console.log('📤 Uploading to Cloudinary...', {
              file: imageFile.originalFilename,
              size: imageFile.size,
              type: imageFile.mimetype
            });

            // Upload to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(imageFile.filepath, {
              resource_type: 'auto',
              upload_preset: 'ml_default', // Use default preset
              transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto:good', fetch_format: 'auto' }
              ]
            });

            console.log('✅ Cloudinary upload successful:', uploadResult.secure_url);

            // Save to MongoDB
            const newPost = new Post({
              username: username.trim(),
              hotelName: hotelName.trim(),
              imageUrl: uploadResult.secure_url
            });

            await newPost.save();
            console.log('✅ Post saved to MongoDB:', newPost._id);

            // Cleanup temp file
            try {
              if (fs.existsSync(imageFile.filepath)) {
                fs.unlinkSync(imageFile.filepath);
              }
            } catch (cleanupError) {
              console.log('⚠️ Temp file cleanup skipped');
            }

            // Success response
            res.status(201).json({
              success: true,
              post: newPost
            });
            resolve();

          } catch (uploadError) {
            console.error('❌ Upload error:', uploadError);
            
            let errorMessage = 'Upload failed';
            
            if (uploadError.http_code) {
              errorMessage = `Cloudinary error (${uploadError.http_code}): ${uploadError.message}`;
            } else if (uploadError.message) {
              errorMessage = uploadError.message;
            }

            res.status(500).json({ 
              error: errorMessage,
              details: uploadError.error?.message || 'Unknown error'
            });
            resolve();
          }
        });
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}
