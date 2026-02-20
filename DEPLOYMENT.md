# 🚀 Deploy MessMate to Vercel

## Prerequisites
- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)

## Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Vercel
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/messmate`)

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - MessMate platform"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/build`

5. Add Environment Variables:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `PORT` = 5000

6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

## Step 4: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these variables:
- `MONGODB_URI` = `mongodb+srv://username:password@cluster.mongodb.net/messmate`
- `PORT` = `5000`

## Step 5: Update Client Environment

After deployment, your app will be at: `https://your-app.vercel.app`

No additional configuration needed - the app uses relative URLs in production!

## Important Notes

⚠️ **File Uploads**: Vercel's serverless functions have limitations:
- Files are stored temporarily
- For production, use cloud storage like:
  - Cloudinary (recommended for images)
  - AWS S3
  - Vercel Blob Storage

### To Use Cloudinary (Recommended):

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials
3. Install: `npm install cloudinary multer-storage-cloudinary`
4. Update `server/routes/posts.js` to use Cloudinary storage

## Troubleshooting

**Build fails?**
- Check that all dependencies are in package.json
- Ensure MongoDB connection string is correct

**Images not loading?**
- Implement Cloudinary or another cloud storage solution
- Vercel serverless functions don't persist files

**API not working?**
- Check environment variables are set correctly
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0

## Local Development

```bash
# Client
cd client
npm start

# Server (separate terminal)
cd server
npm start
```

## Production URL Structure

- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/*`
- Uploads: Use Cloudinary URLs

---

Need help? Check [Vercel Docs](https://vercel.com/docs) or [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
