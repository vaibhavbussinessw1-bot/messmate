// Vercel Serverless Function - Using native Node.js (no external dependencies)
const mongoose = require('mongoose');
const formidable = require('formidable');
const fs = require('fs');
const https = require('https');
const { URL } = require('url');

// MongoDB Connection
let cachedDb = null;
async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    cachedDb = connection;
    console.log('✅ MongoDB connected');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
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

postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Upload to ImgBB using native https
function uploadToImgBB(filePath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Reading image...');
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      const postData = `image=${encodeURIComponent(base64Image)}`;
      
      const options = {
        hostname: 'api.imgbb.com',
        path: '/1/upload?key=d2d52d7a0e7e1b9c8f6e4d3c2b1a0f9e',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000
      };

      console.log('Uploading to ImgBB...');
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success && response.data && response.data.url) {
              console.log('✅ Upload successful');
              resolve(response.data.url);
            } else {
              reject(new Error('ImgBB upload failed: ' + (response.error?.message || 'Unknown error')));
            }
          } catch (e) {
            reject(new Error('Failed to parse ImgBB response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error('Upload request failed: ' + error.message));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Upload timeout'));
      });

      req.write(postData);
      req.end();
      
    } catch (error) {
      reject(new Error('Image processing failed: ' + error.message));
    }
  });
}

// Disable body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main Handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET
    if (req.method === 'GET') {
      try {
        const posts = await Post.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        
        return res.status(200).json(posts);
      } catch (error) {
        return res.status(500).json({ 
          error: 'Failed to fetch posts: ' + error.message
        });
      }
    }

    // POST
    if (req.method === 'POST') {
      return new Promise((resolve) => {
        const form = formidable({
          maxFileSize: 10 * 1024 * 1024,
          keepExtensions: true,
        });

        form.parse(req, async (err, fields, files) => {
          if (err) {
            res.status(400).json({ error: 'Parse failed: ' + err.message });
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
              res.status(400).json({ error: 'Image required' });
              return resolve();
            }

            // Upload image
            const imageUrl = await uploadToImgBB(imageFile.filepath);

            // Save to DB
            const newPost = new Post({
              username: username.trim(),
              hotelName: hotelName.trim(),
              imageUrl: imageUrl
            });

            await newPost.save();
            console.log('✅ Saved:', newPost._id);

            // Cleanup
            try {
              if (fs.existsSync(imageFile.filepath)) {
                fs.unlinkSync(imageFile.filepath);
              }
            } catch (e) {}

            res.status(201).json({
              success: true,
              post: newPost
            });
            resolve();

          } catch (error) {
            console.error('❌ Error:', error.message);
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
