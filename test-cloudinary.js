// Test Cloudinary credentials
const cloudinary = require('cloudinary').v2;

// Your credentials
cloudinary.config({
  cloud_name: 'dusmps71b',
  api_key: '967577766443571',
  api_secret: 'AKuQbIETmfG1eO-qW4L-NCdMLTY'
});

console.log('Testing Cloudinary connection...');
console.log('Cloud Name:', cloudinary.config().cloud_name);
console.log('API Key:', cloudinary.config().api_key);

// Test upload with a simple text file
cloudinary.uploader.upload('https://via.placeholder.com/150', {
  resource_type: 'image'
})
.then(result => {
  console.log('✅ SUCCESS! Cloudinary is working!');
  console.log('Image URL:', result.secure_url);
  console.log('Public ID:', result.public_id);
})
.catch(error => {
  console.error('❌ FAILED! Cloudinary error:');
  console.error('Error:', error.message);
  console.error('HTTP Code:', error.http_code);
  console.error('Full error:', error);
});
