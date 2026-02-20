// Vercel Serverless Function - Simple base64 image upload
const mongoose = require('mongoose');
const formidable = require('formidable');
const fs = require('fs');
const axios = require('axios');

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
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Upload to ImgBB using base64
async function uploadToImgBB(filePath) {
  try {
    // Read file as base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Upload to ImgBB
    const formData = new URLSearchParams();
    formData.append('image', base64Image);
    
    const response = await axios.post(
      'https://api.imgbb.com/1/upload?key=d2d52d7a0e7e1b9c8f6e4d3c2b1a0f9e',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.success && response.data.data && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error('ImgBB upload failed');
    }
  } catch (error) {
    console.error('ImgBB upload error:', error.response?.data || error.message);
    throw new Error('Image upload failed: ' + (error.response?.data?.error?.message || error.message));
  }
}

// Disable body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main Handler
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET - Fetch posts
    if (req.method === 'GET') {
      try {
        const posts = await Post.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        
        return res.status(200).json(posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch posts: ' + error.message
        });
      }
    }

    // POST - Upload
    if (req.method === 'POST') {
      return new Promise((resolve) => {
        const form = formidable({
          maxFileSize: 10 * 1024 * 1024,
          keepExtensions: true,
        });

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error('Form parse error:', err);
            res.status(400).json({ error: 'Failed to parse upload: ' + err.message });
            return resolve();
          }

          try {
            const username = Array.isArray(fields.username) ? fields.username[0] : fields.username;
            const hotelName = Array.isArray(fields.hotelName) ? fields.hotelName[0] : fields.hotelName;
            const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

            if (!username || !hotelName) {
              res.status(400).json({ error: 'Username and hotel name required' });
              return resolve();
            }

            if (!imageFile || !imageFile.filepath) {
              res.status(400).json({ error: 'Image file required' });
              return resolve();
            }

            console.log('📤 Uploading image...');
            
            // Upload to ImgBB
            const imageUrl = await uploadToImgBB(imageFile.filepath);
            
            console.log('✅ Upload successful:', imageUrl);

            // Save to MongoDB
            const newPost = new Post({
              username: username.trim(),
              hotelName: hotelName.trim(),
              imageUrl: imageUrl
            });

            await newPost.save();
            console.log('✅ Saved to MongoDB:', newPost._id);

            // Cleanup
            try {
              if (fs.existsSync(imageFile.filepath)) {
                fs.unlinkSync(imageFile.filepath);
              }
            } catch (e) {
              console.log('Cleanup skipped');
            }

            res.status(201).json({
              success: true,
              post: newPost
            });
            resolve();

          } catch (error) {
            console.error('❌ Upload error:', error);
            res.status(500).json({ 
              error: error.message || 'Upload failed'
            });
            resolve();
          }
        });
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: error.message || 'Server error'
    });
  }
}
