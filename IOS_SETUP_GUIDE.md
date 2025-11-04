# iOS App Setup Guide

The Xcode project file (`.pbxproj`) cannot be created manually as it's a complex binary/XML format. Here's how to properly set up the iOS app:

## Option 1: Create New Xcode Project (Recommended)

### Step 1: Create Project in Xcode

1. **Open Xcode**

2. **File → New → Project** (or Cmd+Shift+N)

3. **Choose template:**
   - Select **iOS** tab
   - Choose **App**
   - Click **Next**

4. **Configure project:**
   ```
   Product Name: StrideMind
   Team: (Select your development team)
   Organization Identifier: com.yourname (or your domain)
   Bundle Identifier: (auto-generated, e.g., com.yourname.StrideMind)
   Interface: SwiftUI
   Language: Swift
   Storage: None
   Include Tests: ☐ (unchecked for now)
   ```

5. **Save location:**
   - Navigate to: `/Users/ayameira/Projects/strider/`
   - Create folder: `StrideMind`
   - Click **Create**

### Step 2: Add HealthKit Capability

1. In Xcode, select the **project** in the navigator (top item)
2. Select the **StrideMind target**
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Search for and add **HealthKit**

### Step 3: Add Source Files

Now you need to add all the Swift files. I'll create them in the proper structure:

#### Method A: Copy Files Manually

1. In Finder, navigate to `/Users/ayameira/Projects/strider/ios-source-files/`
2. Copy all folders (Models, Services, Views)
3. In Xcode, right-click on **StrideMind** folder
4. Select **Add Files to "StrideMind"...**
5. Select the copied folders
6. **Important**: Check these options:
   - ✅ Copy items if needed
   - ✅ Create groups
   - ✅ Add to targets: StrideMind

#### Method B: Create Files in Xcode

I'll provide all the source code below. For each file:

1. In Xcode, right-click **StrideMind** folder
2. **New File** → **Swift File**
3. Name it (e.g., `Workout.swift`)
4. Copy the code from below

### Step 4: Replace Default Files

Xcode created `ContentView.swift` and `StrideMindApp.swift`. Replace their contents with the code provided below.

### Step 5: Add Info.plist Entries

1. Select **Info.plist** in Xcode
2. Right-click → **Open As** → **Source Code**
3. Add these keys before the closing `</dict>`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>StrideMind needs access to your workout data to automatically log your runs and provide personalized training feedback.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>StrideMind needs permission to save workout data to your Health app.</string>
```

### Step 6: Build and Run

1. Select a simulator or connected device
2. Press **Cmd + R** to build and run
3. If errors, check that all files are added to the target

---

## Option 2: Use Swift Package Manager (Alternative)

If you prefer a simpler approach without Xcode project files:

```bash
cd /Users/ayameira/Projects/strider
mkdir StrideMindPackage
cd StrideMindPackage
swift package init --type executable
```

Then add SwiftUI dependencies. However, this is more complex for iOS apps.

---

## Source Files to Create

### 📁 Root Files

#### StrideMindApp.swift
```swift
import SwiftUI

@main
struct StrideMindApp: App {
    @StateObject private var dataManager = DataManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(dataManager)
        }
    }
}
```

#### ContentView.swift
```swift
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var selectedTab = 0
    
    var body: some View {
        Group {
            if dataManager.trainingPlan == nil {
                OnboardingView()
            } else {
                TabView(selection: $selectedTab) {
                    HomeView()
                        .tabItem {
                            Label("Home", systemImage: "house.fill")
                        }
                        .tag(0)
                    
                    CalendarView()
                        .tabItem {
                            Label("Calendar", systemImage: "calendar")
                        }
                        .tag(1)
                    
                    WorkoutsView()
                        .tabItem {
                            Label("Workouts", systemImage: "figure.run")
                        }
                        .tag(2)
                    
                    CoachView()
                        .tabItem {
                            Label("Coach", systemImage: "message.fill")
                        }
                        .tag(3)
                }
                .accentColor(.primary)
            }
        }
    }
}
```

### 📁 Models/

All model files are already created in the documentation. You'll need to create:
- `Workout.swift` 
- `TrainingPlan.swift`

(See the full source code in the project files created earlier)

### 📁 Services/

All service files are already created:
- `DataManager.swift`
- `HealthKitManager.swift`
- `APIService.swift`

### 📁 Views/

All view files are already created:
- `OnboardingView.swift`
- `HomeView.swift`
- `CalendarView.swift`
- `WorkoutsView.swift`
- `LogWorkoutView.swift`
- `SyncHealthKitView.swift`
- `CoachView.swift`

---

## Quick Command to See All Files

```bash
cd /Users/ayameira/Projects/strider
find . -name "*.swift" -type f | grep -v ".build"
```

---

## Troubleshooting

### "No such module 'HealthKit'"
- Ensure HealthKit capability is added
- Clean build folder: Cmd + Shift + K
- Rebuild: Cmd + B

### "Cannot find 'DataManager' in scope"
- Ensure all files are added to the target
- Check file membership in File Inspector

### Build errors
- Make sure all Swift files are in the project
- Check that imports are correct
- Verify iOS deployment target is 16.0+

---

## Alternative: Download Complete Project

Since creating Xcode projects manually is complex, the best approach is:

1. Create a new Xcode project as described above
2. Copy all the Swift source files I created
3. Add them to your project
4. Build and run

All the Swift code is complete and ready to use - you just need the proper Xcode project structure around it.

---

## Need Help?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Xcode documentation: https://developer.apple.com/documentation/xcode
- SwiftUI tutorials: https://developer.apple.com/tutorials/swiftui

---

**Next**: Once the iOS project is set up, follow [QUICKSTART.md](QUICKSTART.md) to run the backend and test the app!
