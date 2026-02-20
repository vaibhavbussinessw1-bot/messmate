// Simple test upload to diagnose the issue
const formidable = require('formidable');
const fs = require('fs');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    });

    console.log('Starting form parse...');

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        res.status(400).json({ 
          step: 'form_parse',
          error: err.message,
          errorType: err.name
        });
        return resolve();
      }

      try {
        console.log('Form parsed successfully');
        console.log('Fields:', fields);
        console.log('Files:', Object.keys(files));

        const username = Array.isArray(fields.username) ? fields.username[0] : fields.username;
        const hotelName = Array.isArray(fields.hotelName) ? fields.hotelName[0] : fields.hotelName;
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

        if (!imageFile) {
          res.status(400).json({ 
            step: 'validation',
            error: 'No image file found',
            receivedFiles: Object.keys(files)
          });
          return resolve();
        }

        console.log('Image file details:', {
          originalFilename: imageFile.originalFilename,
          mimetype: imageFile.mimetype,
          size: imageFile.size,
          filepath: imageFile.filepath
        });

        // Check if file exists
        const fileExists = fs.existsSync(imageFile.filepath);
        console.log('File exists:', fileExists);

        if (!fileExists) {
          res.status(500).json({ 
            step: 'file_check',
            error: 'Uploaded file not found on server'
          });
          return resolve();
        }

        // Try to read file
        try {
          const fileBuffer = fs.readFileSync(imageFile.filepath);
          console.log('File read successfully, size:', fileBuffer.length);

          res.status(200).json({
            success: true,
            message: 'File upload test successful',
            fileDetails: {
              name: imageFile.originalFilename,
              type: imageFile.mimetype,
              size: imageFile.size,
              bufferSize: fileBuffer.length
            },
            fields: {
              username,
              hotelName
            }
          });
        } catch (readError) {
          console.error('File read error:', readError);
          res.status(500).json({ 
            step: 'file_read',
            error: readError.message
          });
        }

        resolve();

      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ 
          step: 'processing',
          error: error.message,
          stack: error.stack
        });
        resolve();
      }
    });
  });
}
