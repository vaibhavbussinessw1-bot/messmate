// Get list of hotels
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
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log('Fetching hotels list...');
    await connectDB();
    const hotels = await Post.distinct('hotelName');
    console.log(`Found ${hotels.length} hotels`);
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Hotels list error:', error);
    res.status(500).json({ error: error.message });
  }
}
