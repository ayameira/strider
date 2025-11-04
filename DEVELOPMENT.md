# Development Guide

This guide covers development workflows, best practices, and tips for extending StrideMind.

## Development Environment Setup

### Required Tools

- **Xcode 15+**: iOS development
- **Node.js 18+**: Backend development
- **npm**: Package management
- **Git**: Version control
- **jq** (optional): JSON formatting for API testing

### Recommended Tools

- **Postman**: API testing
- **Charles Proxy**: Network debugging
- **SF Symbols**: Icon browsing
- **Xcode Instruments**: Performance profiling

## Project Structure

```
strider/
├── backend/                    # Node.js API
│   ├── server.js              # Main server (all endpoints)
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables (not committed)
│
└── StrideMind/                # iOS app
    └── StrideMind/
        ├── Models/            # Data models
        ├── Services/          # Business logic & API
        ├── Views/             # SwiftUI views
        └── Assets.xcassets/   # Images & colors
```

## Development Workflow

### Backend Development

1. **Start dev server with auto-reload:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test API endpoints:**
   ```bash
   chmod +x test-api.sh
   ./test-api.sh
   ```

3. **Check logs:**
   - Server logs appear in terminal
   - Look for OpenAI API errors
   - Monitor response times

4. **Make changes:**
   - Edit `server.js`
   - Server auto-reloads with nodemon
   - Test endpoint with curl or Postman

### iOS Development

1. **Open project:**
   ```bash
   open StrideMind/StrideMind.xcodeproj
   ```

2. **Run in simulator:**
   - Select simulator (iPhone 15 Pro recommended)
   - Press `Cmd + R` to build and run
   - Use `Cmd + Shift + K` to clean build if needed

3. **Debug:**
   - Set breakpoints in Xcode
   - Use `print()` statements
   - Check console for errors
   - Use Xcode's View Hierarchy debugger

4. **Test on device:**
   - Connect iPhone via USB
   - Select device in Xcode
   - Update API URL to use Mac's local IP
   - Trust developer certificate on device

## Common Development Tasks

### Adding a New View

1. Create new Swift file in `Views/` directory
2. Import SwiftUI and define struct conforming to `View`
3. Add `@EnvironmentObject var dataManager: DataManager` if needed
4. Implement `body` property with UI
5. Add `#Preview` for live preview
6. Link from existing view with `NavigationLink`

Example:
```swift
import SwiftUI

struct MyNewView: View {
    @EnvironmentObject var dataManager: DataManager
    
    var body: some View {
        Text("Hello, World!")
    }
}

#Preview {
    MyNewView()
        .environmentObject(DataManager.shared)
}
```

### Adding a New API Endpoint

1. **Backend** (`server.js`):
   ```javascript
   app.post('/api/my-endpoint', async (req, res) => {
     try {
       const { param } = req.body;
       
       // Your logic here
       const result = await someFunction(param);
       
       res.json({ success: true, data: result });
     } catch (error) {
       console.error('Error:', error);
       res.status(500).json({ success: false, error: error.message });
     }
   });
   ```

2. **iOS** (`APIService.swift`):
   ```swift
   func myEndpoint(param: String) async throws -> MyResult {
       let url = URL(string: "\(baseURL)/my-endpoint")!
       var request = URLRequest(url: url)
       request.httpMethod = "POST"
       request.setValue("application/json", forHTTPHeaderField: "Content-Type")
       
       let body = ["param": param]
       request.httpBody = try JSONSerialization.data(withJSONObject: body)
       
       let (data, _) = try await URLSession.shared.data(for: request)
       let response = try JSONDecoder().decode(MyResponse.self, from: data)
       
       guard response.success else {
           throw APIError.serverError
       }
       
       return response.data
   }
   ```

### Modifying AI Prompts

Edit prompts in `backend/server.js`:

```javascript
const prompt = `You are an expert marathon coach...
[Your instructions here]

Format as JSON:
{
  "field": "value"
}`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'System prompt' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.7,  // Adjust for creativity (0.0-1.0)
  response_format: { type: 'json_object' }  // For structured output
});
```

**Tips:**
- Lower temperature (0.3-0.5) for consistent, factual responses
- Higher temperature (0.7-0.9) for creative, varied responses
- Use `response_format: json_object` for structured data
- Test prompts in OpenAI Playground first

### Adding a New Workout Type

1. **Update enum** in `Workout.swift`:
   ```swift
   enum WorkoutType: String, Codable, CaseIterable {
       case easy = "Easy Run"
       case myNewType = "My New Type"
       // ...
       
       var icon: String {
           switch self {
           case .myNewType: return "bolt.fill"
           // ...
           }
       }
       
       var color: String {
           switch self {
           case .myNewType: return "yellow"
           // ...
           }
       }
   }
   ```

2. **Update UI pickers** in `LogWorkoutView.swift` (already uses `.allCases`)

3. **Update AI prompts** in `server.js` to recognize new type

### Customizing UI Theme

**Colors:**
- Edit `AccentColor` in `Assets.xcassets`
- Or use inline: `.foregroundColor(.blue)`

**Typography:**
- Modify `.font()` modifiers
- System fonts: `.title`, `.headline`, `.body`, `.caption`
- Custom: `.font(.system(size: 18, weight: .semibold))`

**Spacing:**
- Adjust `.padding()` values
- Modify `spacing` in `VStack`/`HStack`

## Testing

### Manual Testing Checklist

**Onboarding:**
- [ ] All steps navigate correctly
- [ ] Plan generates successfully
- [ ] Error handling works (stop backend)

**Home View:**
- [ ] Current week displays correctly
- [ ] Progress circle updates
- [ ] Recent workouts show

**Calendar:**
- [ ] Month navigation works
- [ ] Days highlight correctly
- [ ] Planned vs completed workouts differentiated

**Workouts:**
- [ ] List shows all workouts
- [ ] Detail view displays correctly
- [ ] Delete works

**Logging:**
- [ ] Manual entry saves
- [ ] AI feedback appears (for planned workouts)
- [ ] Duration picker works

**HealthKit:**
- [ ] Authorization prompt appears
- [ ] Workouts import
- [ ] No duplicates created

**Coach:**
- [ ] Messages send and receive
- [ ] Context is relevant
- [ ] Error handling works

### API Testing

Use the provided test script:
```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

Or test individual endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Generate plan
curl -X POST http://localhost:3000/api/plan/generate \
  -H "Content-Type: application/json" \
  -d '{"currentFitness":"Beginner","weeklyMileage":15,...}'
```

### Debugging Tips

**Backend:**
- Check terminal for error logs
- Verify OpenAI API key is valid
- Test prompts in OpenAI Playground
- Use `console.log()` liberally

**iOS:**
- Use breakpoints in Xcode
- Check console for print statements
- Use View Hierarchy debugger for UI issues
- Test on different simulators (iPhone SE, Pro Max)

**Network:**
- Use Charles Proxy to inspect HTTP traffic
- Check request/response bodies
- Verify API URL is correct (localhost vs IP)

## Performance Optimization

### Backend

**Caching:**
```javascript
const cache = new Map();

app.post('/api/endpoint', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const result = await expensiveOperation();
  cache.set(cacheKey, result);
  
  res.json(result);
});
```

**Rate Limiting:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### iOS

**Lazy Loading:**
```swift
LazyVStack {
    ForEach(workouts) { workout in
        WorkoutRow(workout: workout)
    }
}
```

**Image Optimization:**
- Use SF Symbols instead of custom images
- Compress any custom images
- Use `.resizable()` and `.scaledToFit()`

**Async Operations:**
```swift
Task {
    await dataManager.syncWithHealthKit()
}
```

## Code Style Guidelines

### Swift

- Use `camelCase` for variables and functions
- Use `PascalCase` for types
- Prefer `let` over `var`
- Use meaningful names: `workout` not `w`
- Group related code with `// MARK: -`

### JavaScript

- Use `const` by default, `let` when needed
- Use async/await over callbacks
- Handle errors with try/catch
- Use descriptive variable names

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/my-feature

# Merge to main (after review)
git checkout main
git merge feature/my-feature
```

## Deployment

### Backend

**Heroku:**
```bash
heroku create stridemind-api
heroku config:set OPENAI_API_KEY=sk-...
git push heroku main
```

**Railway:**
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically on push

### iOS

1. Archive in Xcode: Product → Archive
2. Upload to App Store Connect
3. Submit for review
4. Wait for approval (1-3 days typically)

## Troubleshooting

### "Module not found" (Backend)
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Build failed" (iOS)
- Clean build folder: `Cmd + Shift + K`
- Restart Xcode
- Delete derived data: `~/Library/Developer/Xcode/DerivedData`

### "API not responding"
- Check backend is running
- Verify URL in `APIService.swift`
- Check firewall settings
- Test with curl

## Resources

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

Happy coding! 🚀
