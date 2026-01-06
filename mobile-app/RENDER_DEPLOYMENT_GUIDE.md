# Deploy Backend to Render - Step by Step Guide

This guide will walk you through deploying your backend to Render and configuring your mobile app to use it.

## Prerequisites

1. **GitHub Account** (Render deploys from GitHub)
2. **Backend code** pushed to GitHub repository
3. **Render account** (free at https://render.com)

## Step 1: Prepare Your Backend

### Check Your Backend Structure

Your backend should have:
- ✅ `package.json` with start script
- ✅ Main server file (e.g., `server.js`, `index.js`, `app.js`)
- ✅ Listens on `process.env.PORT` (Render sets this automatically)

### Example package.json

```json
{
  "name": "dealer-portal-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.5.0",
    // ... other dependencies
  }
}
```

### Update Server Port

Make sure your server uses the PORT environment variable:

```javascript
// server.js or app.js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Configure CORS for Mobile App

Ensure CORS allows requests from mobile app:

```javascript
const cors = require('cors');

app.use(cors({
  origin: '*', // Or specify your mobile app's bundle identifier
  credentials: true
}));
```

## Step 2: Push Backend to GitHub

If your backend isn't on GitHub yet:

```bash
cd /path/to/your/backend

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/your-backend-repo.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render

### 3.1 Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### 3.2 Create New Web Service

1. Click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select your backend repository
5. Click **"Connect"**

### 3.3 Configure Service

Fill in the details:

- **Name**: `dealer-portal-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your main branch)
- **Root Directory**: Leave empty (or specify if backend is in subfolder)
- **Runtime**: `Node`
- **Build Command**: `npm install` (or `yarn install`)
- **Start Command**: `npm start` (or `node server.js`)

### 3.4 Environment Variables (If Needed)

If your backend needs environment variables:

1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add variables like:
   - `NODE_ENV=production`
   - `DATABASE_URL=your-database-url`
   - `JWT_SECRET=your-secret`
   - etc.

### 3.5 Create Service

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (2-5 minutes)

## Step 4: Get Your Public URL

After deployment completes:

1. Render provides a URL like: `https://dealer-portal-backend.onrender.com`
2. **Copy this URL** - you'll need it for the mobile app

### Note: Custom Domain (Optional)

You can add a custom domain later:
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)

## Step 5: Test Your Backend

Test that your backend is accessible:

```bash
# Test health endpoint (if you have one)
curl https://dealer-portal-backend.onrender.com/api/health

# Or test any endpoint
curl https://dealer-portal-backend.onrender.com/api/your-endpoint
```

## Step 6: Update Mobile App Configuration

### 6.1 Update eas.json

Edit `mobile-app/eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://dealer-portal-backend.onrender.com/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://dealer-portal-backend.onrender.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://dealer-portal-backend.onrender.com/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://dealer-portal-backend.onrender.com"
      }
    }
  }
}
```

**Replace `dealer-portal-backend.onrender.com` with your actual Render URL!**

### 6.2 Verify Configuration

Check `mobile-app/utils/config.js` - it should read from environment variables:

```javascript
const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // ... fallback
};
```

This is already configured ✅

## Step 7: Build APK

Now build your standalone APK:

```bash
cd mobile-app

# Login to Expo (if not already)
eas login

# Build APK
eas build --platform android --profile preview
```

The APK will be built with your Render backend URL embedded!

## Step 8: Test Standalone APK

1. **Download APK** from build output
2. **Install on Android device**
3. **Open app** - should connect to Render backend
4. **Test login** - should work on any network
5. **Test location tracking** - should work in background

## Important Notes About Render

### Free Tier Limitations

- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **Takes 30-60 seconds to wake up** when accessed after spin-down
- ⚠️ **Limited to 750 hours/month** (usually enough for testing)

### For Production

Consider upgrading to **Paid Plan** ($7/month):
- ✅ Always-on (no spin-down)
- ✅ Faster response times
- ✅ More resources

### Socket.IO on Render

Render supports WebSockets, so Socket.IO should work fine. Just ensure:
- Your Socket.IO server is configured correctly
- CORS allows your mobile app
- Using HTTPS (Render provides this automatically)

## Troubleshooting

### Backend Not Responding

1. **Check Render logs**:
   - Go to your service dashboard
   - Click "Logs" tab
   - Look for errors

2. **Check if service spun down**:
   - First request after inactivity takes 30-60 seconds
   - Subsequent requests are fast

3. **Verify start command**:
   - Should be `npm start` or `node server.js`
   - Check package.json has correct start script

### CORS Errors

Update CORS configuration in your backend:

```javascript
app.use(cors({
  origin: '*', // Allow all origins (or specify mobile app)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### Socket.IO Not Connecting

1. **Check Socket.IO server** is running
2. **Verify URL** in mobile app matches Render URL
3. **Check Render logs** for Socket.IO errors
4. **Ensure WebSocket support** is enabled (Render supports this)

### Database Connection

If using a database:
- Use cloud database (MongoDB Atlas, PostgreSQL on Render, etc.)
- Don't use local database
- Set `DATABASE_URL` in Render environment variables

## Quick Checklist

- [ ] Backend pushed to GitHub
- [ ] Render account created
- [ ] Web service created on Render
- [ ] Backend deployed successfully
- [ ] Got public URL from Render
- [ ] Updated `eas.json` with Render URL
- [ ] Built APK with `eas build`
- [ ] Tested APK on device
- [ ] Verified connection to Render backend

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Update mobile app config
3. ✅ Build APK
4. ✅ Test on device
5. ✅ Distribute to drivers

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Render Support: support@render.com

---

**Your backend is now publicly accessible and your mobile app can connect to it from anywhere!** 🎉

