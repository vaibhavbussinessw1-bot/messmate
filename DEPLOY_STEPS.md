# 🚀 Quick Deploy to Vercel

Your MongoDB is already configured! Follow these steps:

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "MessMate - Food sharing platform"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy on Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: Leave default
   - **Output Directory**: Leave default

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add: `MONGODB_URI` = `mongodb+srv://createsomethingnew018_db_user:0xXeGzzW2lYHgQKm@cluster0.jmexhpx.mongodb.net/messmate`
   - Add: `PORT` = `5000`

6. Click "Deploy"

### Option B: Vercel CLI (Fast)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# When prompted, add environment variables:
# MONGODB_URI=mongodb+srv://createsomethingnew018_db_user:0xXeGzzW2lYHgQKm@cluster0.jmexhpx.mongodb.net/messmate
# PORT=5000

# Deploy to production
vercel --prod
```

## Step 3: Done! 🎉

Your app will be live at: `https://your-app-name.vercel.app`

## ⚠️ Important Notes

### Image Storage Issue
Vercel serverless functions don't persist uploaded files. For production, you need cloud storage:

**Recommended: Cloudinary (Free tier available)**

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials (Cloud Name, API Key, API Secret)
3. Install packages:
```bash
cd server
npm install cloudinary multer-storage-cloudinary
```

4. Update `server/routes/posts.js`:
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'messmate',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});
```

5. Add to Vercel Environment Variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Testing Locally

```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm start
```

## Troubleshooting

**Build fails?**
- Check all dependencies are in package.json
- Verify MongoDB connection string is correct

**Can't upload images?**
- Implement Cloudinary (see above)
- Vercel doesn't support file system storage

**MongoDB connection error?**
- Verify connection string
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

---

Need help? Check the full guide in DEPLOYMENT.md
