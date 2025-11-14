# strider 🏃

An AI-powered marathon training app for iOS that combines personalized coaching with HealthKit integration. strider helps runners achieve their goals through intelligent training plans, workout tracking, and conversational AI guidance.

## Overview

strider is a full-stack running coach application featuring:
- **AI Coach**: Chat with an intelligent coach powered by OpenAI GPT-4 that understands your training context
- **HealthKit Integration**: Automatically sync workouts from Apple Health
- **Training Plans**: Create and manage weekly training plans with your AI coach
- **Workout Tracking**: Log runs manually or sync from HealthKit with detailed metrics
- **Progress Monitoring**: View your training calendar and analyze performance trends

## Architecture

### iOS App (SwiftUI)
- **Location**: `/strider/strider/`
- **Language**: Swift
- **Framework**: SwiftUI
- **Minimum iOS**: 17.0+ (uses HKWorkoutBuilder API)
- **Features**:
  - HealthKit integration for workout syncing
  - Real-time chat with AI coach
  - Training plan management
  - Workout calendar view
  - Statistics and progress tracking

### Backend API (Node.js)
- **Location**: `/backend/`
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **AI**: OpenAI GPT-4o-mini
- **Storage**: PostgreSQL (via Prisma ORM)

## Features

### 🤖 AI Coach
- Conversational interface for training guidance
- Context-aware responses based on your profile, workouts, and training plan
- Ability to generate and update training plans
- Save coach responses directly to your weekly plan

### 📊 Workout Management
- Sync workouts from HealthKit (running, cycling, swimming, etc.)
- Manual workout logging with detailed metrics:
  - Distance (miles/kilometers)
  - Duration
  - Pace
  - Effort level (1-10 scale)
  - Notes and feedback
- Support for different workout types:
  - Easy runs
  - Long runs
  - Tempo runs
  - Intervals
  - Recovery runs
  - Cross-training

### 📅 Calendar View
- Visual overview of your training schedule
- See completed workouts and planned sessions
- Track consistency over time

### 📈 Stats & Progress
- Performance metrics and trends
- Distance and duration tracking
- Pace analysis
- Training volume insights

## Getting Started

### Prerequisites
- **For iOS Development**:
  - macOS with Xcode 15+
  - iOS device or simulator running iOS 17+
  - Apple Developer account (for HealthKit on device)

- **For Backend**:
  - Node.js 16+ and npm
  - OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```bash
# Render-managed Postgres instances require sslmode=require
DATABASE_URL="postgresql://username:password@hostname:5432/database?sslmode=require"
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

4. Apply Prisma migrations (requires a reachable Postgres database):
```bash
npx prisma migrate dev --name init
```

5. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

#### Render deployment

1. Provision a Render PostgreSQL instance and copy its `External Database URL` (already configured with `sslmode=require`).
2. Create a new Web Service targeting the `/backend` directory. Set the following environment variables:
   - `DATABASE_URL` (use the Render-provided URL)
   - `OPENAI_API_KEY`
   - `PORT` (optional — Render assigns one automatically)
3. Set the build command to `npm install` (Render runs this by default) and the start command to:
   ```bash
   npm run prisma:deploy && npm start
   ```
   This applies migrations before booting the API.

### iOS App Setup

1. Open the Xcode project:
```bash
cd strider
open strider.xcodeproj
```

2. Update the backend API URL in `Services/APIService.swift` if needed (defaults to `http://localhost:3000`)

3. Build and run the app in Xcode (⌘R)

4. On first launch:
   - Complete the onboarding flow
   - Grant HealthKit permissions when prompted
   - Start chatting with your AI coach!

## API Endpoints

### Health Check
```
GET /health
```

### User Data
```
GET /api/user/:userId
POST /api/user/:userId/sync
```

### AI Coach Chat
```
POST /api/coach/chat
Body: { userId: string, message: string }
```

## Project Structure

```
strider/
├── backend/
│   ├── lib/
│   │   ├── openaiClient.js      # OpenAI client configuration
│   │   └── prismaClient.js      # Shared Prisma client instance
│   ├── prisma/
│   │   └── schema.prisma        # Prisma data model
│   ├── prisma.config.ts         # Prisma CLI configuration
│   ├── services/
│   │   └── userService.js       # Data access layer for user records
│   ├── agent/                    # Agent logic (future expansion)
│   ├── server.js                 # Express server and API routes
│   └── package.json
│
└── strider/
    └── strider/
        ├── Models/
        │   ├── ChatTurn.swift        # Chat message model
        │   ├── TrainingPlan.swift    # Training plan and profile models
        │   └── Workout.swift         # Workout and activity models
        ├── Services/
        │   ├── APIService.swift      # Backend API client
        │   ├── DataManager.swift     # App state management
        │   └── HealthKitManager.swift # HealthKit integration
        ├── Views/
        │   ├── CalendarView.swift    # Training calendar
        │   ├── CoachView.swift       # AI chat interface
        │   ├── HomeView.swift        # Dashboard and overview
        │   ├── LogWorkoutView.swift  # Manual workout entry
        │   ├── OnboardingView.swift  # First-time setup
        │   ├── StatsView.swift       # Performance analytics
        │   ├── SyncHealthKitView.swift # HealthKit sync interface
        │   └── WorkoutsView.swift    # Workout history
        ├── Assets.xcassets/
        ├── ContentView.swift         # Main app container
        └── StrideMindApp.swift       # App entry point
```

## Data Models

### Workout
- Date, type, activity type
- Distance, duration, pace
- Effort level (1-10)
- Notes and feedback
- Tempo sets (for interval training)

### Training Plan
- Title and content (markdown)
- Context (focus, timeframe, source)
- Last updated timestamp

### User Profile
- Name
- Distance unit preference (miles/km)
- Creation and update timestamps

### Chat History
- Role (user/assistant)
- Message content
- Timestamp
- Stored per user with 40-message limit

## Configuration

### Distance Units
Users can choose between miles and kilometers for all distance and pace calculations.

### HealthKit Permissions
The app requests:
- **Read**: Workouts, running/walking distance
- **Write**: Workouts

### OpenAI Configuration
- Model: `gpt-4o-mini`
- Temperature: 1.0
- System prompt includes user context, training plan, and recent workouts

## Development Notes

### Database Migrations
The backend persists data in PostgreSQL via Prisma. Run `npx prisma migrate dev` during local development and `npx prisma migrate deploy` during deployments (e.g., on Render) to keep the schema up to date.

### User Authentication
Currently uses a simple userId system. Implement proper authentication (OAuth, JWT) for production.

### HealthKit Testing
HealthKit features require:
- Real iOS device for full functionality
- Simulator can be used but with limited HealthKit data
- Appropriate entitlements configured in Xcode

## Future Enhancements

Potential improvements:
- [x] Persistent database storage
- [ ] User authentication and authorization
- [ ] Social features (share workouts, compare with friends)
- [ ] Advanced analytics and visualizations
- [ ] Training plan templates
- [ ] Race day countdown and preparation
- [ ] Weather integration
- [ ] Injury prevention insights
- [ ] Integration with other fitness platforms (Strava, Garmin, etc.)

## Technologies Used

**Frontend**:
- SwiftUI
- HealthKit
- Combine
- iOS 17+ SDK

**Backend**:
- Node.js / Express
- Prisma ORM
- PostgreSQL
- OpenAI API
- CORS
- ES Modules

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Support

[Add support/contact information here]

---

Built with ❤️ for runners who want a smarter training experience.

