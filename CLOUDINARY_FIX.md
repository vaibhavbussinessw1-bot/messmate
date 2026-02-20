# Fix Cloudinary Upload Issues

## Problem
Upload fails with "[object Object]" error - this means Cloudinary credentials or settings are incorrect.

## Solution Steps

### Step 1: Verify Cloudinary Account Settings

1. Go to https://cloudinary.com/console
2. Login with your account
3. You should see your Dashboard

### Step 2: Check Upload Preset

Cloudinary requires an "Upload Preset" for unsigned uploads. Here's how to enable it:

1. In Cloudinary Dashboard, go to **Settings** (gear icon)
2. Click on **Upload** tab
3. Scroll down to **Upload presets**
4. Find the preset named **"ml_default"** or create a new one:
   - Click **"Add upload preset"**
   - Set **Signing Mode** to **"Unsigned"**
   - Set **Preset name** to **"messmate"** (or any name you like)
   - Set **Folder** to empty or **"messmate"**
   - Click **Save**

### Step 3: Update Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your **messmate** project
3. Go to **Settings** → **Environment Variables**
4. Make sure these are set for **Production, Preview, and Development**:

```
MONGODB_URI=mongodb+srv://createsomethingnew018_db_user:0xXeGzzW2lYHgQKm@cluster0.jmexhpx.mongodb.net/messmate

CLOUDINARY_CLOUD_NAME=dusmps71b

CLOUDINARY_API_KEY=967577766443571

CLOUDINARY_API_SECRET=AKuQbIETmfG1eO-qW4L-NCdMLTY
```

5. Click **Save** for each variable

### Step 4: Test Environment Variables

After deployment completes, visit:
```
https://your-app.vercel.app/api/test
```

You should see all variables marked as ✅ Set

### Step 5: Alternative - Use Different Cloudinary Credentials

If the above doesn't work, your Cloudinary account might have restrictions. Try:

1. Create a NEW Cloudinary account at https://cloudinary.com/users/register/free
2. Get the new credentials from the dashboard
3. Update all environment variables in Vercel with new credentials
4. Redeploy

### Step 6: Enable Unsigned Uploads (IMPORTANT!)

This is the most common issue:

1. Go to Cloudinary Dashboard → Settings → Security
2. Find **"Unsigned uploading"** section
3. Make sure it's **ENABLED**
4. If disabled, enable it and save

### Step 7: Check API Limits

Free Cloudinary accounts have limits:
- 25 credits/month
- 25,000 transformations/month
- 25GB storage

If you've exceeded limits, uploads will fail. Check your usage in the dashboard.

## Quick Fix Option

If nothing works, I can switch to a different image hosting service:

### Option A: Use Imgur API (Free, no signup needed)
- Simpler setup
- No configuration needed
- 12.5MB file limit

### Option B: Use ImgBB API (Free)
- Get API key from https://api.imgbb.com/
- Simple integration
- 32MB file limit

### Option C: Store images in MongoDB (Not recommended)
- No external service needed
- Slower performance
- Database size limits

## Testing

After making changes:

1. Wait 2-3 minutes for Vercel deployment
2. Try uploading a small image (< 1MB)
3. Check browser console for errors
4. Check Vercel function logs for detailed errors

## Get Detailed Error

Visit your deployed app and try to upload. Then:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the error message
4. Share the EXACT error message with me

## Current Status

Your credentials:
- Cloud Name: `dusmps71b`
- API Key: `967577766443571`
- API Secret: `AKuQbIETmfG1eO-qW4L-NCdMLTY`

These should work if:
1. Upload preset is enabled
2. Unsigned uploads are enabled
3. Account is not over limits
4. Environment variables are set in Vercel
