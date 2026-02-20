// Test endpoint to verify environment variables
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const envCheck = {
    MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing',
  };

  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
    api_key: process.env.CLOUDINARY_API_KEY ? 'SET (hidden)' : 'NOT SET',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'NOT SET',
  };

  res.status(200).json({
    message: 'Environment Variables Check',
    environment: envCheck,
    cloudinary: cloudinaryConfig,
    timestamp: new Date().toISOString()
  });
}
