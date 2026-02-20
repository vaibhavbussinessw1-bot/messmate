// Test MongoDB connection
const mongoose = require('mongoose');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    // Try to connect
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Try to query
    const testSchema = new mongoose.Schema({
      test: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.models.Test || mongoose.model('Test', testSchema);
    
    // Try to count documents
    const count = await TestModel.countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'MongoDB connection successful',
      database: connection.connection.name,
      host: connection.connection.host,
      documentCount: count,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      details: {
        hasMongoUri: !!process.env.MONGODB_URI,
        mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET'
      }
    });
  }
}
