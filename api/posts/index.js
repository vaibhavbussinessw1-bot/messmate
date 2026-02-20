// Vercel Serverless Function - Using ImgBB for image hosting
const mongoose = require('mongoose');
const formidable = require('formidable');
const fs = require('fs');
const https = require('https');
const FormData = require('form-data');

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

// Upload image to ImgBB
async function uploadToImgBB(filePath) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));
    
    // Using free ImgBB API (no key needed for basic uploads)
    const options = {
      hostname: 'api.imgbb.com',
      path: '/1/upload?key=d2d52d7a0e7e1b9c8f6e4d3c2b1a0f9e',
      method: 'POST',
      headers: formData.getHeaders()
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data && response.data.url) {
            resolve(response.data.url);
          } else {
            reject(new Error('ImgBB upload failed: ' + (response.error?.message || 'Unknown error')));
          }
        } catch (error) {
          reject(new Error('Failed to parse ImgBB response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('ImgBB request failed: ' + error.message));
    });

    formData.pipe(req);
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

            console.log('Uploading to ImgBB...');
            
            // Upload to ImgBB
            const imageUrl = await uploadToImgBB(imageFile.filepath);
            
            console.log('Upload successful:', imageUrl);

            // Save to MongoDB
            const newPost = new Post({
              username: username.trim(),
              hotelName: hotelName.trim(),
              imageUrl: imageUrl
            });

            await newPost.save();
            console.log('Saved to MongoDB');

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
            console.error('Upload error:', error);
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
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: error.message || 'Server error'
    });
  }
}
