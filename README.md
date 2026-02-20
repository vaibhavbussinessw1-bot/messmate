# 🍽️ MessMate - Mess Food Sharing Platform

A mobile-first web platform for students to share and discover daily mess/hotel food menus.

## ✨ Features
- 📸 Upload food photos with hotel/mess tagging
- 🏷️ Tag dishes with names
- 🔍 Browse food by hotel/mess
- 👤 No signup required - just enter username
- ⏰ Posts auto-delete after 24 hours (fresh daily content)
- 📱 Mobile-first responsive design
- 🎨 Modern, student-friendly UI

## 🛠️ Tech Stack
- **Frontend**: React (mobile-first design)
- **Backend**: Node.js + Express
- **Database**: MongoDB with TTL indexes
- **Image Upload**: Multer
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

2. **Setup Environment Variables**

Create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/messmate
PORT=5000
```

3. **Run the App**
```bash
# Terminal 1 - Start server
cd server
npm start

# Terminal 2 - Start client
cd client
npm start
```

App will open at `http://localhost:3000`

## 📦 Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:
```bash
npm i -g vercel
vercel
```

## 🎯 Key Features Explained

### Auto-Delete Posts
Posts automatically delete after 24 hours using MongoDB TTL indexes, keeping content fresh and relevant.

### No Authentication
Simple username entry - no complex signup/login flow. Perfect for quick sharing.

### Mobile-First
Designed specifically for mobile users with touch-friendly UI and optimized layouts.

## 📝 Environment Variables

### Server (.env)
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)

### Client (.env.production)
- `REACT_APP_API_URL` - API base URL (empty for same-origin in production)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use for your college/hostel!
