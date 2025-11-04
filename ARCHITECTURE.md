# StrideMind Architecture

## Overview

StrideMind follows a client-server architecture with a native iOS app communicating with a Node.js backend that interfaces with OpenAI's GPT-4 API.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         iOS App                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    SwiftUI Views                      │  │
│  │  Home │ Calendar │ Workouts │ Coach │ Onboarding    │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │                 DataManager                           │  │
│  │  • State management                                   │  │
│  │  • Data persistence (UserDefaults)                    │  │
│  │  • Workout & plan CRUD operations                     │  │
│  └────────┬──────────────────────────────┬───────────────┘  │
│           │                              │                   │
│  ┌────────▼──────────┐        ┌─────────▼──────────┐       │
│  │  HealthKitManager │        │    APIService      │       │
│  │  • Auth requests  │        │  • HTTP client     │       │
│  │  • Fetch workouts │        │  • API endpoints   │       │
│  │  • Save workouts  │        │  • JSON encoding   │       │
│  └───────────────────┘        └─────────┬──────────┘       │
└────────────────────────────────────────┼──────────────────┘
                                          │ HTTPS/JSON
                                          │
┌─────────────────────────────────────────▼──────────────────┐
│                    Backend API (Node.js)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Express Server                       │  │
│  │  • /api/plan/generate                                 │  │
│  │  • /api/workout/analyze                               │  │
│  │  • /api/plan/adjust                                   │  │
│  │  • /api/coach/chat                                    │  │
│  └────────────────────────┬─────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────┘
                            │ OpenAI API
                            │
┌───────────────────────────▼────────────────────────────────┐
│                      OpenAI GPT-4                           │
│  • Training plan generation                                 │
│  • Workout analysis & feedback                              │
│  • Plan adjustments                                         │
│  • Conversational coaching                                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Onboarding & Plan Generation

```
User Input → OnboardingView → APIService.generatePlan()
    ↓
Backend receives request → Constructs GPT-4 prompt
    ↓
GPT-4 generates structured plan → Returns JSON
    ↓
APIService parses response → DataManager stores plan
    ↓
UI updates to show training plan
```

### 2. Workout Logging & Analysis

```
User logs workout → LogWorkoutView → DataManager.addWorkout()
    ↓
If planned workout exists → APIService.analyzeWorkout()
    ↓
Backend sends workout + context to GPT-4
    ↓
GPT-4 analyzes performance → Returns feedback + recommendation
    ↓
Feedback stored with workout → UI shows feedback
    ↓
If adjustment needed → APIService.adjustPlan()
    ↓
Backend generates adjusted week → DataManager updates plan
```

### 3. HealthKit Sync

```
User taps sync → SyncHealthKitView → HealthKitManager.requestAuthorization()
    ↓
User grants permission → HealthKitManager.fetchRecentWorkouts()
    ↓
HKWorkout objects retrieved → Converted to Workout models
    ↓
DataManager merges with existing workouts (deduplication)
    ↓
UI refreshes to show imported workouts
```

### 4. AI Chat

```
User sends message → CoachView → APIService.chatWithCoach()
    ↓
Backend receives message + context (week, workout count)
    ↓
GPT-4 generates contextual response
    ↓
Response displayed in chat bubble
```

## Data Models

### Core Models

**Workout**
- Represents a completed or planned workout
- Fields: id, date, type, distance, duration, effort, notes, completed, feedback
- Computed: pace, formattedPace, formattedDuration

**TrainingPlan**
- Container for the entire training program
- Fields: id, planSummary, weeks[], keyPrinciples[], createdDate, raceDate
- Methods: currentWeek(), currentWeekNumber()

**TrainingWeek**
- One week of training
- Fields: id, weekNumber, totalMiles, workouts[], adjustmentNote

**PlannedWorkout**
- A scheduled workout in the plan
- Fields: id, day, type, distance, notes, date

**WorkoutType** (enum)
- easy, long, tempo, intervals, recovery, rest
- Each has associated icon and color

## State Management

### DataManager (ObservableObject)

Central state manager using the singleton pattern:

```swift
class DataManager: ObservableObject {
    @Published var trainingPlan: TrainingPlan?
    @Published var workouts: [Workout]
    @Published var isLoading: Bool
    
    // Persistence
    func loadData()
    func savePlan()
    func saveWorkouts()
    
    // CRUD operations
    func addWorkout()
    func updateWorkout()
    func deleteWorkout()
    func updatePlan()
    func updateWeek()
}
```

Injected into SwiftUI view hierarchy via `.environmentObject()`.

## API Design

### RESTful Endpoints

All endpoints return JSON with structure:
```json
{
  "success": true,
  "data": { ... }
}
```

**POST /api/plan/generate**
- Input: User fitness profile
- Output: Complete TrainingPlan
- GPT-4: Generates 12-16 week structured plan

**POST /api/workout/analyze**
- Input: Completed workout + planned workout + recent history
- Output: WorkoutAnalysis (feedback, assessment, concerns, recommendation)
- GPT-4: Analyzes performance vs. plan

**POST /api/plan/adjust**
- Input: Current plan + recent workouts + adjustment type
- Output: Adjusted TrainingWeek
- GPT-4: Modifies upcoming week based on performance

**POST /api/coach/chat**
- Input: User message + training context
- Output: Coach response text
- GPT-4: Conversational coaching advice

## Persistence Strategy

### Current: UserDefaults (JSON)

**Pros:**
- Simple implementation
- No external dependencies
- Fast for small datasets

**Cons:**
- Limited to ~1MB data
- No relational queries
- No sync across devices

**Storage:**
```swift
// Encode to JSON
let encoder = JSONEncoder()
encoder.dateEncodingStrategy = .iso8601
let data = try encoder.encode(trainingPlan)
UserDefaults.standard.set(data, forKey: "trainingPlan")

// Decode from JSON
let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601
let plan = try decoder.decode(TrainingPlan.self, from: data)
```

### Future: Core Data or CloudKit

For production, consider:
- **Core Data**: Local relational database, better for complex queries
- **CloudKit**: Apple's cloud sync, enables multi-device support

## HealthKit Integration

### Authorization Flow

1. Request authorization for specific types:
   - Read: `HKWorkoutType`, `distanceWalkingRunning`
   - Write: `HKWorkoutType`

2. User grants/denies in system dialog

3. Query workouts with `HKSampleQuery`:
   ```swift
   let workoutType = HKObjectType.workoutType()
   let query = HKSampleQuery(
       sampleType: workoutType,
       predicate: nil,
       limit: 30,
       sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
   )
   ```

4. Filter for running workouts only

5. Convert `HKWorkout` → `Workout` model

### Deduplication

Prevents importing same workout twice:
```swift
if !workouts.contains(where: { 
    abs($0.date.timeIntervalSince(healthWorkout.date)) < 60 && 
    abs($0.distance - healthWorkout.distance) < 0.1 
}) {
    workouts.append(healthWorkout)
}
```

## AI Integration

### Prompt Engineering

Each endpoint uses carefully crafted prompts:

**Plan Generation:**
- Provides user context (fitness, mileage, goals)
- Requests structured JSON output
- Specifies plan philosophy (progressive overload, rest, taper)

**Workout Analysis:**
- Compares planned vs. actual
- Considers recent training load
- Identifies concerns (overtraining, injury risk)
- Recommends adjustments

**Plan Adjustment:**
- Receives recommendation from analysis
- Modifies upcoming week intelligently
- Maintains marathon goal trajectory

**Chat:**
- Conversational tone
- Context-aware (current week, workout count)
- Concise, actionable advice

### Response Format

Using `response_format: { type: 'json_object' }` for structured endpoints ensures valid JSON output.

## Security Considerations

### Current Implementation

- OpenAI API key stored in backend `.env` (not committed)
- No user authentication
- Local-only data storage
- HTTP communication (localhost)

### Production Recommendations

1. **Authentication**: Implement user accounts (Firebase Auth, Auth0)
2. **HTTPS**: Use SSL/TLS for API communication
3. **API Security**: Rate limiting, API key rotation
4. **Data Privacy**: Encrypt sensitive health data
5. **Backend Hosting**: Deploy to secure cloud (Heroku, AWS, Railway)

## Performance Optimization

### Current

- Lazy loading in lists
- Async/await for non-blocking API calls
- Minimal data in UserDefaults

### Future Improvements

1. **Caching**: Cache API responses to reduce OpenAI costs
2. **Pagination**: Load workouts in chunks for large histories
3. **Background Sync**: Periodic HealthKit sync in background
4. **Image Assets**: Optimize any images/icons
5. **Debouncing**: Debounce chat input to reduce API calls

## Testing Strategy

### Unit Tests (Future)

- Model encoding/decoding
- Date calculations (currentWeek, pace)
- Deduplication logic

### Integration Tests

- API endpoint responses
- HealthKit authorization flow
- Data persistence

### UI Tests

- Onboarding flow completion
- Workout logging
- Calendar navigation

## Deployment

### Backend

**Development:**
```bash
npm run dev  # Runs with nodemon
```

**Production:**
1. Deploy to cloud platform (Heroku, Railway, Render)
2. Set environment variables (OPENAI_API_KEY)
3. Use process manager (PM2)
4. Enable logging and monitoring

### iOS App

**Development:**
- Run in Xcode simulator or connected device
- Update API URL for device testing (use local IP)

**Production:**
1. Update bundle identifier
2. Configure App Store Connect
3. Add app icons and screenshots
4. Submit for App Store review
5. Consider TestFlight beta testing

## Monitoring & Analytics

### Recommended Additions

1. **Error Tracking**: Sentry, Bugsnag
2. **Analytics**: Mixpanel, Amplitude (track feature usage)
3. **API Monitoring**: Track OpenAI API costs and latency
4. **Crash Reporting**: Firebase Crashlytics

## Scalability

### Current Limitations

- Single user (no accounts)
- Local storage only
- No data backup
- Limited to one device

### Scaling Path

1. **Multi-user**: Add authentication and user database
2. **Cloud Storage**: Migrate to CloudKit or Firebase
3. **Caching Layer**: Redis for API response caching
4. **CDN**: Serve static assets from CDN
5. **Microservices**: Split backend into specialized services

---

This architecture provides a solid foundation for a marathon training app while remaining simple enough for rapid development and iteration.
