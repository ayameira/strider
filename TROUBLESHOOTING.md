# StrideMind Troubleshooting Guide

Common issues and their solutions.

## Backend Issues

### ❌ "Cannot find module 'express'"

**Problem**: Node modules not installed

**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ "Error: OPENAI_API_KEY is not set"

**Problem**: Missing or invalid API key

**Solution**:
1. Check `.env` file exists in `backend/` directory
2. Verify it contains: `OPENAI_API_KEY=sk-...`
3. Get API key from https://platform.openai.com/api-keys
4. Restart server after adding key

**Verify**:
```bash
cat backend/.env
# Should show: OPENAI_API_KEY=sk-...
```

---

### ❌ "Port 3000 already in use"

**Problem**: Another process using port 3000

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
# Edit backend/.env: PORT=3001
# Update APIService.swift baseURL to :3001
```

---

### ❌ "OpenAI API error: Insufficient quota"

**Problem**: No credits on OpenAI account

**Solution**:
1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Add credits ($5-10 minimum)
4. Wait a few minutes for activation

---

### ❌ Backend starts but API calls fail

**Problem**: Server running but endpoints not responding

**Check**:
```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok","message":"StrideMind API is running"}
```

**If fails**:
- Check terminal for error messages
- Verify server.js has no syntax errors
- Restart server: `npm start`

---

## iOS App Issues

### ❌ "Build Failed" in Xcode

**Problem**: Compilation errors

**Solution**:
1. Clean build folder: `Cmd + Shift + K`
2. Close and reopen Xcode
3. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
4. Rebuild: `Cmd + B`

---

### ❌ "Signing for 'StrideMind' requires a development team"

**Problem**: No development team selected

**Solution**:
1. Open project in Xcode
2. Select project in navigator (top item)
3. Select "StrideMind" target
4. Go to "Signing & Capabilities" tab
5. Select your team from dropdown
6. If no team, sign in with Apple ID in Xcode preferences

---

### ❌ "Failed to generate plan" error in app

**Problem**: App can't connect to backend

**Solutions**:

**1. Check backend is running**:
```bash
# In terminal, should see:
🏃 StrideMind API running on port 3000
```

**2. Test backend manually**:
```bash
curl http://localhost:3000/health
```

**3. Check API URL in app**:
- Open `StrideMind/StrideMind/Services/APIService.swift`
- Line 6 should be: `private let baseURL = "http://localhost:3000/api"`

**4. If testing on physical device**:
- Find Mac's IP address: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Update APIService.swift: `private let baseURL = "http://192.168.1.XXX:3000/api"`
- Ensure iPhone and Mac on same WiFi

---

### ❌ HealthKit sync not working

**Problem**: No workouts imported

**Solutions**:

**1. Check permissions**:
- Settings → Health → Data Access & Devices → StrideMind
- Ensure "Workouts" is enabled

**2. Verify Health data exists**:
- Open Health app
- Browse → Activity → Workouts
- Confirm running workouts exist

**3. Simulator limitations**:
- HealthKit has limited functionality in simulator
- Test on physical device for full experience

**4. Re-request authorization**:
- Delete app and reinstall
- Grant permissions again

---

### ❌ App crashes on launch

**Problem**: Runtime error

**Solution**:
1. Check Xcode console for error message
2. Common causes:
   - Missing required files
   - Data decoding errors
   - Force unwrapping nil values

3. Reset app data:
   ```bash
   # Delete app from simulator/device
   # Reinstall
   ```

4. Check for syntax errors in recently modified files

---

### ❌ "The operation couldn't be completed" when syncing

**Problem**: HealthKit authorization or data access issue

**Solution**:
1. Ensure Info.plist has required keys:
   - `NSHealthShareUsageDescription`
   - `NSHealthUpdateUsageDescription`

2. Check HealthKit capability is enabled:
   - Xcode → Target → Signing & Capabilities
   - Should see "HealthKit" capability

3. Try on physical device (better HealthKit support)

---

## Network Issues

### ❌ "Network request failed" on device

**Problem**: Device can't reach localhost

**Solution**:
1. Get Mac's local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example output: inet 192.168.1.100
   ```

2. Update `APIService.swift`:
   ```swift
   private let baseURL = "http://192.168.1.100:3000/api"
   ```

3. Ensure both devices on same WiFi network

4. Check Mac firewall settings:
   - System Preferences → Security & Privacy → Firewall
   - Allow incoming connections for Node

---

### ❌ API calls timeout

**Problem**: Slow OpenAI API responses

**Solution**:
- OpenAI API can take 10-20 seconds for plan generation
- This is normal for complex AI tasks
- Show loading indicator to user
- Consider implementing timeout handling:
  ```swift
  request.timeoutInterval = 30 // seconds
  ```

---

## Data Issues

### ❌ Training plan disappeared

**Problem**: Data not persisting

**Solution**:
1. Check UserDefaults:
   ```swift
   // In Xcode debug console
   po UserDefaults.standard.dictionaryRepresentation()
   ```

2. Data is stored locally per device/simulator
3. Switching simulators = new data
4. Deleting app = data lost

**Prevention**:
- Export plan before deleting app
- Consider implementing backup feature

---

### ❌ Workouts showing wrong dates

**Problem**: Date encoding/decoding issues

**Solution**:
- Ensure consistent date strategy:
  ```swift
  encoder.dateEncodingStrategy = .iso8601
  decoder.dateDecodingStrategy = .iso8601
  ```
- Check timezone handling
- Verify date formatting in UI

---

### ❌ Duplicate workouts after sync

**Problem**: Deduplication not working

**Solution**:
- Check deduplication logic in `DataManager.syncWithHealthKit()`
- Compares date (within 60s) and distance (within 0.1 miles)
- May need to adjust tolerance values

---

## AI/OpenAI Issues

### ❌ AI responses are generic or unhelpful

**Problem**: Prompts need improvement

**Solution**:
1. Edit prompts in `backend/server.js`
2. Add more context to prompts
3. Adjust temperature (0.7 = balanced)
4. Test prompts in OpenAI Playground first

---

### ❌ "Invalid JSON response" from AI

**Problem**: GPT-4 returned non-JSON text

**Solution**:
- Using `response_format: { type: 'json_object' }` should prevent this
- Add error handling to parse response
- Log raw response for debugging:
  ```javascript
  console.log('Raw response:', completion.choices[0].message.content);
  ```

---

### ❌ AI feedback is too long/short

**Problem**: Response length not optimal

**Solution**:
- Adjust `max_tokens` parameter
- Modify prompt to request specific length
- Example: "Provide 2-3 sentences of feedback"

---

## Performance Issues

### ❌ App feels slow or laggy

**Problem**: Performance bottleneck

**Solutions**:
1. Use `LazyVStack` for long lists
2. Minimize API calls
3. Cache responses when possible
4. Profile with Instruments (Xcode)

---

### ❌ High memory usage

**Problem**: Memory leak or large data

**Solutions**:
1. Profile with Instruments → Leaks
2. Check for retain cycles in closures
3. Limit workout history loaded at once
4. Implement pagination for large lists

---

## Development Issues

### ❌ Xcode preview not working

**Problem**: SwiftUI preview crashes or won't load

**Solution**:
1. Ensure preview code is valid:
   ```swift
   #Preview {
       MyView()
           .environmentObject(DataManager.shared)
   }
   ```

2. Clean build folder: `Cmd + Shift + K`
3. Restart Xcode
4. Check for compilation errors

---

### ❌ Git issues with Xcode project

**Problem**: Merge conflicts in .pbxproj

**Solution**:
```bash
# Accept their version
git checkout --theirs StrideMind/StrideMind.xcodeproj/project.pbxproj

# Or accept your version
git checkout --ours StrideMind/StrideMind.xcodeproj/project.pbxproj

# Then
git add .
git commit
```

---

## Testing & Debugging

### How to test without OpenAI API

**Solution**: Mock responses in `APIService.swift`
```swift
func generatePlan(...) async throws -> TrainingPlan {
    // Return mock data for testing
    return TrainingPlan(
        planSummary: "Test plan",
        weeks: [...],
        keyPrinciples: [...]
    )
}
```

---

### How to debug API calls

**Solution**: Add logging
```swift
// In APIService.swift
print("📤 Request URL:", url)
print("📤 Request Body:", String(data: request.httpBody!, encoding: .utf8)!)

let (data, response) = try await URLSession.shared.data(for: request)

print("📥 Response Status:", (response as? HTTPURLResponse)?.statusCode ?? 0)
print("📥 Response Body:", String(data: data, encoding: .utf8)!)
```

---

### How to reset app completely

**Solution**:
```bash
# Delete app from simulator/device
# Clear UserDefaults (if needed)
# In Xcode debug console:
UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)
```

---

## Still Having Issues?

### Checklist

- [ ] Backend server is running
- [ ] OpenAI API key is valid and has credits
- [ ] iOS app builds without errors
- [ ] Correct API URL (localhost or IP)
- [ ] HealthKit permissions granted
- [ ] Same WiFi network (for device testing)
- [ ] Latest Xcode version
- [ ] Node.js 18+ installed

### Getting Help

1. **Check logs**: Terminal (backend) and Xcode console (iOS)
2. **Test API**: Use `curl` or Postman
3. **Isolate issue**: Backend vs iOS vs OpenAI
4. **Search error**: Google the exact error message
5. **Check documentation**: README.md, ARCHITECTURE.md

### Debug Commands

```bash
# Check Node version
node --version  # Should be 18+

# Check npm version
npm --version

# Test backend health
curl http://localhost:3000/health

# Check what's using port 3000
lsof -i :3000

# View backend logs
cd backend
npm start  # Watch for errors

# Check Xcode version
xcodebuild -version

# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
```

---

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `ECONNREFUSED` | Backend not running | Start backend: `npm start` |
| `401 Unauthorized` | Invalid API key | Check OpenAI API key in .env |
| `429 Too Many Requests` | Rate limit hit | Wait or upgrade OpenAI plan |
| `Module not found` | Missing dependencies | Run `npm install` |
| `Code signing error` | No dev team | Select team in Xcode |
| `HealthKit not available` | Simulator limitation | Test on device |

---

**Last Updated**: November 2024

If you encounter an issue not listed here, please document it and consider contributing to this guide!
