# StrideMind Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Checklist

- [ ] macOS with Xcode 15+ installed
- [ ] Node.js 18+ installed (`node --version`)
- [ ] OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here
nano .env  # or use your preferred editor

# Start the server
npm start
```

✅ You should see: `🏃 StrideMind API running on port 3000`

## Step 2: iOS App Setup (10 minutes)

**⚠️ IMPORTANT**: The iOS app requires a proper Xcode project setup.

### Quick Setup:

1. **Create Xcode Project:**
   - Open Xcode
   - File → New → Project
   - Choose iOS → App
   - Name: **StrideMind**
   - Interface: **SwiftUI**
   - Save to: `/Users/ayameira/Projects/strider/StrideMind`

2. **Add HealthKit:**
   - Select project → Target → Signing & Capabilities
   - Click **+ Capability** → Add **HealthKit**

3. **Add Source Files:**
   - All Swift files are in the project root
   - See **[IOS_SETUP_GUIDE.md](IOS_SETUP_GUIDE.md)** for detailed instructions

4. **Build and Run:**
   - Select your development team
   - Press `Cmd + R`

✅ App should launch and show onboarding screen

**Need help?** See [IOS_SETUP_GUIDE.md](IOS_SETUP_GUIDE.md) for step-by-step instructions.

## Step 3: Create Your Training Plan

In the app:
1. **Welcome screen** → Tap "Next"
2. **Current Fitness** → Enter your fitness level and weekly mileage
3. **Your Goals** → Set race date and goals
4. **Experience** → Describe your running background
5. Tap **"Generate Plan"**

⏳ Wait 10-20 seconds while AI creates your personalized plan

✅ You should see your home dashboard with the current week's workouts

## Step 4: Test Core Features

### Log a Workout
1. Tap **"Log Workout Manually"** on Home tab
2. Enter workout details
3. Tap **"Save Workout"**

### Sync with HealthKit (Optional)
1. Tap **"Sync with HealthKit"**
2. Grant permissions
3. Recent runs will be imported

### Chat with AI Coach
1. Go to **Coach** tab
2. Ask a question like "How am I progressing?"
3. Get personalized advice

## Troubleshooting

### "Failed to generate plan"
**Problem**: App can't connect to backend

**Solutions**:
- Ensure backend is running (`npm start` in backend directory)
- Check terminal for error messages
- Verify OpenAI API key in `.env` file

### Testing on Physical Device
**Problem**: App can't reach localhost

**Solution**: Update API URL in `APIService.swift`
1. Find your Mac's IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Open `StrideMind/StrideMind/Services/APIService.swift`
3. Change line 6:
   ```swift
   private let baseURL = "http://YOUR_IP_HERE:3000/api"
   ```
   Example: `http://192.168.1.100:3000/api`

### HealthKit Not Working
**Problem**: No workouts imported

**Solutions**:
- Only works on physical device or simulator with Health data
- Check permissions in Settings → Health → Data Access
- Ensure you have running workouts in Health app

## Next Steps

- 📖 Read [README.md](README.md) for detailed documentation
- 🏗️ Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- 🎨 Customize the UI colors and styling
- 🚀 Deploy backend to cloud for production use

## Common Commands

### Backend
```bash
# Start server
npm start

# Start with auto-reload (development)
npm run dev

# Check if server is running
curl http://localhost:3000/health
```

### iOS
```bash
# Open project
open StrideMind/StrideMind.xcodeproj

# Clean build (if issues)
# In Xcode: Shift + Cmd + K
```

## Getting Help

- Check the [README.md](README.md) for detailed setup
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Ensure backend logs show no errors
- Verify OpenAI API key has credits

---

Happy training! 🏃‍♂️💪
