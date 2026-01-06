# Backend Deployment Options for Standalone APK

## The Requirement

For a standalone APK to work on any network (not just same WiFi), your backend **must be publicly accessible** via a public URL.

## Option 1: Deploy Backend to Cloud (Recommended for Production)

### Cloud Hosting Services

#### A. Railway (Easy & Free Tier Available)
```bash
# 1. Sign up at https://railway.app
# 2. Connect your GitHub repo
# 3. Deploy backend
# 4. Get public URL: https://your-app.railway.app
```

**Pros:**
- ✅ Free tier available
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Good for Node.js/Express

**Cons:**
- ⚠️ Free tier has limits

#### B. Render (Free Tier Available)
```bash
# 1. Sign up at https://render.com
# 2. Create new Web Service
# 3. Connect GitHub repo
# 4. Deploy
# 5. Get URL: https://your-app.onrender.com
```

**Pros:**
- ✅ Free tier
- ✅ Easy setup
- ✅ Auto HTTPS

**Cons:**
- ⚠️ Free tier spins down after inactivity

#### C. Heroku (Paid, but reliable)
```bash
# 1. Sign up at https://heroku.com
# 2. Install Heroku CLI
# 3. Deploy: git push heroku main
# 4. Get URL: https://your-app.herokuapp.com
```

**Pros:**
- ✅ Reliable
- ✅ Good documentation
- ✅ Easy deployment

**Cons:**
- ❌ No free tier anymore
- 💰 Paid plans start at $5/month

#### D. DigitalOcean App Platform
```bash
# 1. Sign up at https://digitalocean.com
# 2. Create App
# 3. Connect repo and deploy
# 4. Get URL: https://your-app.ondigitalocean.app
```

**Pros:**
- ✅ Good performance
- ✅ Scalable

**Cons:**
- 💰 Paid (starts around $5/month)

#### E. AWS / Google Cloud / Azure
- More complex setup
- More control
- Better for large scale
- Requires more technical knowledge

### Quick Deployment Example (Railway)

1. **Prepare your backend**:
   - Ensure it has a `package.json`
   - Set PORT from environment variable
   - Add start script: `"start": "node server.js"`

2. **Deploy to Railway**:
   - Sign up at railway.app
   - New Project → Deploy from GitHub
   - Select your backend repo
   - Railway auto-detects and deploys

3. **Get your URL**:
   - Railway provides: `https://your-app.railway.app`
   - Use this in `eas.json`:
     ```json
     "EXPO_PUBLIC_API_URL": "https://your-app.railway.app/api"
     ```

## Option 2: Use Tunneling Service (For Testing/Development)

### ngrok (Popular Choice)

```bash
# 1. Install ngrok
npm install -g ngrok
# or download from https://ngrok.com

# 2. Start your backend locally
cd backend
npm start  # Runs on localhost:3000

# 3. In another terminal, create tunnel
ngrok http 3000

# 4. Get public URL
# Example: https://abc123.ngrok.io
```

**Update eas.json:**
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://abc123.ngrok.io/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://abc123.ngrok.io"
      }
    }
  }
}
```

**Pros:**
- ✅ Quick setup
- ✅ Good for testing
- ✅ Free tier available

**Cons:**
- ⚠️ URL changes each time (free tier)
- ⚠️ Not suitable for production
- ⚠️ Requires local server running

### Cloudflare Tunnel (Free, More Stable)

```bash
# 1. Install cloudflared
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# 2. Create tunnel
cloudflared tunnel --url http://localhost:3000

# 3. Get stable URL (with account)
```

**Pros:**
- ✅ Free
- ✅ More stable URLs
- ✅ Good performance

**Cons:**
- ⚠️ Still requires local server

## Option 3: Use Your Own Server

If you have a server with public IP:

1. **Deploy backend** to your server
2. **Set up domain** (optional but recommended)
3. **Configure firewall** to allow port 3000 (or use reverse proxy)
4. **Use your domain/IP** in `eas.json`

**Example:**
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://api.yourdomain.com"
      }
    }
  }
}
```

## Recommended Approach

### For Development/Testing:
1. Use **ngrok** or **Cloudflare Tunnel** for quick testing
2. Build APK with tunnel URL
3. Test on device

### For Production:
1. Deploy backend to **Railway** or **Render** (free tiers)
2. Get stable public URL
3. Update `eas.json` with production URL
4. Build production APK
5. Distribute to drivers

## Step-by-Step: Deploy Backend to Railway

### 1. Prepare Backend

Ensure your backend has:
- `package.json` with start script
- Listens on `process.env.PORT || 3000`
- CORS configured for mobile app

### 2. Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

### 3. Deploy

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your backend repository
4. Railway auto-detects Node.js and deploys

### 4. Get URL

1. Railway provides URL: `https://your-app.up.railway.app`
2. Copy this URL

### 5. Update Mobile App Config

Edit `mobile-app/eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.up.railway.app/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://your-app.up.railway.app"
      }
    }
  }
}
```

### 6. Build APK

```bash
cd mobile-app
eas build --platform android --profile preview
```

## Important Notes

### Backend Requirements

Your backend must:
- ✅ Be accessible via HTTP/HTTPS
- ✅ Have CORS configured for mobile app
- ✅ Support Socket.IO (if using real-time features)
- ✅ Handle authentication (JWT tokens)
- ✅ Be running 24/7 (for production)

### Environment Variables

If your backend needs environment variables (database URL, API keys, etc.):
- Set them in Railway/Render dashboard
- They'll be available to your backend at runtime

### Database

If using a database:
- Use cloud database (MongoDB Atlas, PostgreSQL on Railway, etc.)
- Don't use local database for production

## Quick Comparison

| Option | Cost | Setup Time | Best For |
|--------|------|------------|----------|
| Railway | Free tier | 5 min | Production |
| Render | Free tier | 5 min | Production |
| ngrok | Free | 2 min | Testing |
| Cloudflare Tunnel | Free | 5 min | Testing |
| Heroku | $5+/month | 10 min | Production |
| Own Server | Varies | 30+ min | Production |

## Next Steps

1. **Choose deployment option** (Railway recommended for free tier)
2. **Deploy backend** to get public URL
3. **Update `eas.json`** with public URL
4. **Build APK** with `eas build`
5. **Test** - APK works on any network!

## Troubleshooting

### Backend Not Accessible

- Check backend is running
- Verify URL is correct
- Check firewall/security groups
- Test URL in browser: `https://your-url.com/api/health`

### CORS Errors

- Configure CORS on backend to allow mobile app
- Add your domain to allowed origins

### Socket.IO Not Working

- Ensure Socket.IO server is configured correctly
- Check WebSocket support on hosting platform
- Verify Socket.IO URL matches API URL

