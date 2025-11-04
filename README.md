# StrideMind

A minimalist marathon training companion that automatically logs runs from Apple Health and adapts your plan intelligently using AI.

## Features

- 🏃 **Automatic Workout Sync**: Import runs from Apple Health automatically
- 🤖 **AI Coach**: Get personalized feedback after each workout
- 📊 **Adaptive Training Plans**: Your plan adjusts based on your progress
- 📅 **Calendar View**: Visual overview of your training schedule
- 💬 **Chat with Coach**: Ask questions and get expert advice anytime
- 🎨 **Clean Design**: Minimalist SwiftUI interface with neutral tones

## Tech Stack

### iOS App
- **SwiftUI** for the user interface
- **HealthKit** for workout data integration
- **UserDefaults** for local data persistence
- **URLSession** for API communication

### Backend
- **Node.js** with Express
- **OpenAI GPT-4** for AI coaching and plan generation
- **RESTful API** architecture

## Project Structure

```
strider/
├── backend/                    # Node.js backend API
│   ├── server.js              # Main server file with API endpoints
│   ├── package.json           # Node dependencies
│   ├── .env.example           # Environment variables template
│   └── .gitignore
│
└── StrideMind/                # iOS app
    └── StrideMind/
        ├── StrideMindApp.swift           # App entry point
        ├── ContentView.swift             # Main view coordinator
        ├── Info.plist                    # HealthKit permissions
        │
        ├── Models/
        │   ├── Workout.swift             # Workout data model
        │   └── TrainingPlan.swift        # Training plan models
        │
        ├── Services/
        │   ├── DataManager.swift         # Data persistence & state
        │   ├── HealthKitManager.swift    # HealthKit integration
        │   └── APIService.swift          # Backend API client
        │
        └── Views/
            ├── OnboardingView.swift      # Initial setup flow
            ├── HomeView.swift            # Main dashboard
            ├── CalendarView.swift        # Training calendar
            ├── WorkoutsView.swift        # Workout history
            ├── LogWorkoutView.swift      # Manual workout logging
            ├── SyncHealthKitView.swift   # HealthKit sync UI
            └── CoachView.swift           # AI chat interface
```

## Setup Instructions

### Prerequisites

- **macOS** with Xcode 15+ installed
- **Node.js** 18+ and npm
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **iOS device or simulator** running iOS 16+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=3000
   ```

5. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3000`

### iOS App Setup

1. Open the Xcode project:
   ```bash
   open StrideMind/StrideMind.xcodeproj
   ```

2. In Xcode:
   - Select your development team in **Signing & Capabilities**
   - Ensure **HealthKit** capability is enabled
   - Update the bundle identifier if needed

3. Build and run the app:
   - Select a simulator or connected device
   - Press `Cmd + R` to build and run

4. **Important**: If testing on a physical device, update the API base URL in `APIService.swift`:
   - Find your Mac's local IP address: `ifconfig | grep "inet "`
   - Replace `localhost` with your IP (e.g., `http://192.168.1.100:3000/api`)

### First Run

1. Launch the app and complete the onboarding flow:
   - Describe your current fitness level
   - Set your weekly mileage
   - Choose your race date and goals
   - Share your running experience

2. The AI will generate a personalized training plan (requires backend to be running)

3. Grant HealthKit permissions when prompted to sync existing workouts

4. Start logging workouts and get AI feedback!

## API Endpoints

### `POST /api/plan/generate`
Generate a personalized training plan based on user input.

**Request:**
```json
{
  "currentFitness": "Running 3x per week",
  "weeklyMileage": 20,
  "raceDate": "2024-06-15",
  "goals": "Complete first marathon",
  "experience": "Several half marathons"
}
```

### `POST /api/workout/analyze`
Analyze a completed workout and provide feedback.

**Request:**
```json
{
  "workout": { "distance": 5, "duration": 2400, "effort": 7 },
  "plannedWorkout": { "type": "easy", "distance": 5 },
  "recentWorkouts": [...],
  "currentWeek": 3
}
```

### `POST /api/plan/adjust`
Adjust the training plan based on recent performance.

### `POST /api/coach/chat`
Chat with the AI coach for advice and questions.

## Usage Guide

### Logging Workouts

**Automatic (HealthKit):**
1. Go to Home tab
2. Tap "Sync with HealthKit"
3. Grant permissions
4. Recent runs will be imported

**Manual:**
1. Tap "+" in Workouts tab or "Log Workout Manually" on Home
2. Enter workout details (date, type, distance, duration, effort)
3. Add optional notes
4. Tap "Save Workout"

### Getting AI Feedback

After logging a workout that matches a planned workout:
- The AI automatically analyzes your performance
- Feedback appears on the workout card
- Your plan may adjust for next week based on the analysis

### Chatting with Coach

1. Go to Coach tab
2. Type your question or concern
3. Get personalized advice based on your training context

Example questions:
- "How am I progressing toward my goal?"
- "Should I take an extra rest day?"
- "Tips for my upcoming long run?"

## Development Notes

### Data Persistence

- Training plans and workouts are stored in `UserDefaults` as JSON
- For production, consider migrating to Core Data or CloudKit
- Data persists across app launches

### HealthKit Integration

- Requires physical device or simulator with Health app
- Permissions must be granted by user
- Only running workouts are imported
- Duplicate detection prevents re-importing same workouts

### API Communication

- All API calls are asynchronous using `async/await`
- Error handling shows user-friendly messages
- Backend must be running for AI features to work
- Offline mode: workouts can still be logged locally

## Customization

### Changing the Color Scheme

Edit the accent color in SwiftUI views. The app uses `.primary` for the main accent, which respects system dark/light mode.

### Modifying Training Plan Logic

Edit the prompts in `backend/server.js` to adjust:
- Plan generation philosophy
- Feedback tone and style
- Adjustment sensitivity
- Coach personality

### Adding New Workout Types

1. Add case to `WorkoutType` enum in `Workout.swift`
2. Provide icon and color
3. Update UI pickers to include new type

## Troubleshooting

### "Failed to generate plan" error
- Ensure backend server is running (`npm start` in backend directory)
- Check that `.env` file has valid OpenAI API key
- Verify API key has sufficient credits

### HealthKit sync not working
- Check that HealthKit permissions were granted
- Ensure device/simulator has Health app with workout data
- Try revoking and re-granting permissions in Settings > Health > Data Access

### App can't connect to backend on device
- Update `baseURL` in `APIService.swift` to use your Mac's IP instead of `localhost`
- Ensure Mac and iPhone are on same WiFi network
- Check firewall settings aren't blocking port 3000

## Future Enhancements

- [ ] Push notifications for workout reminders
- [ ] Apple Watch companion app
- [ ] Social features (share progress, compare with friends)
- [ ] Integration with Strava, Garmin, etc.
- [ ] Advanced analytics and charts
- [ ] Export training data
- [ ] Multiple training plan templates
- [ ] Injury prevention tips
- [ ] Nutrition guidance

## License

MIT License - feel free to use and modify for your own projects.

## Contributing

This is a starter template. Feel free to fork and customize for your needs!

---

Built with ❤️ for runners by runners
