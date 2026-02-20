// Get posts filtered by hotel name
const mongoose = require('mongoose');

let cachedDb = null;
async function connectDB() {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = db;
  return db;
}

const postSchema = new mongoose.Schema({
  username: String,
  hotelName: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    const { name } = req.query;
    const hotelName = decodeURIComponent(name);
    
    const posts = await Post.find({ hotelName }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Filter posts error:', error);
    res.status(500).json({ error: error.message });
  }
};
