// Vercel Serverless Function - Fixed MongoDB connection
const mongoose = require('mongoose');
const formidable = require('formidable');
const fs = require('fs');
const axios = require('axios');

// MongoDB Connection with better error handling
let cachedDb = null;
async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    // Check if URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    cachedDb = connection;
    console.log('✅ MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw new Error('Database connection failed: ' + error.message);
  }
}

// Post Schema
const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  hotelName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Add TTL index for auto-deletion after 24 hours
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Upload to ImgBB using base64
async function uploadToImgBB(filePath) {
  try {
    console.log('Reading image file...');
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Uploading to ImgBB...');
    const formData = new URLSearchParams();
    formData.append('image', base64Image);
    
    const response = await axios.post(
      'https://api.imgbb.com/1/upload?key=d2d52d7a0e7e1b9c8f6e4d3c2b1a0f9e',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    if (response.data && response.data.success && response.data.data && response.data.data.url) {
      console.log('✅ ImgBB upload successful');
      return response.data.data.url;
    } else {
      throw new Error('ImgBB returned invalid response');
    }
  } catch (error) {
    console.error('❌ ImgBB upload error:', error.message);
    if (error.response) {
      console.error('ImgBB error response:', error.response.data);
      throw new Error('Image upload failed: ' + (error.response.data?.error?.message || error.message));
    }
    throw new Error('Image upload failed: ' + error.message);
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
    // Connect to MongoDB first
    await connectDB();

    // GET - Fetch posts
    if (req.method === 'GET') {
      try {
        console.log('Fetching posts from MongoDB...');
        const posts = await Post.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        
        console.log(`✅ Found ${posts.length} posts`);
        return res.status(200).json(posts);
      } catch (error) {
        console.error('❌ Error fetching posts:', error.message);
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
            console.error('❌ Form parse error:', err.message);
            res.status(400).json({ error: 'Failed to parse upload: ' + err.message });
            return resolve();
          }

          try {
            const username = Array.isArray(fields.username) ? fields.username[0] : fields.username;
            const hotelName = Array.isArray(fields.hotelName) ? fields.hotelName[0] : fields.hotelName;
            const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

            console.log('Received upload request:', { username, hotelName, hasImage: !!imageFile });

            if (!username || !hotelName) {
              res.status(400).json({ error: 'Username and hotel name are required' });
              return resolve();
            }

            if (!imageFile || !imageFile.filepath) {
              res.status(400).json({ error: 'Image file is required' });
              return resolve();
            }

            // Upload to ImgBB
            const imageUrl = await uploadToImgBB(imageFile.filepath);

            // Save to MongoDB
            console.log('Saving to MongoDB...');
            const newPost = new Post({
              username: username.trim(),
              hotelName: hotelName.trim(),
              imageUrl: imageUrl
            });

            await newPost.save();
            console.log('✅ Post saved successfully:', newPost._id);

            // Cleanup temp file
            try {
              if (fs.existsSync(imageFile.filepath)) {
                fs.unlinkSync(imageFile.filepath);
              }
            } catch (e) {
              console.log('⚠️ Temp file cleanup skipped');
            }

            res.status(201).json({
              success: true,
              post: newPost
            });
            resolve();

          } catch (error) {
            console.error('❌ Upload error:', error.message);
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
    console.error('❌ Handler error:', error.message);
    return res.status(500).json({ 
      error: error.message || 'Server error'
    });
  }
}
