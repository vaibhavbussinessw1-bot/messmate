# Push Code to GitHub

You need to push the code yourself since you're logged in as a different GitHub user.

## Run these commands:

```bash
git push -u origin main
```

If it asks for credentials, use your GitHub username and password (or personal access token).

## After pushing, deploy on Vercel:

1. Go to: https://vercel.com/new
2. Import: `vaibhavbussinessw1-bot/messmate`
3. Add Environment Variables:
   ```
   MONGODB_URI = mongodb+srv://createsomethingnew018_db_user:0xXeGzzW2lYHgQKm@cluster0.jmexhpx.mongodb.net/messmate
   CLOUDINARY_CLOUD_NAME = dzrtmm26r
   CLOUDINARY_API_KEY = 185526815912936
   CLOUDINARY_API_SECRET = VoFqpjG9ZYtsXfKH_7x63WV_arI
   ```
4. Click "Deploy"

Done! 🚀
