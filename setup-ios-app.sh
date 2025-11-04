#!/bin/bash

# StrideMind iOS App Setup Script
# This script guides you through creating the Xcode project

echo "🏃 StrideMind iOS App Setup"
echo "=============================="
echo ""
echo "Since Xcode project files are complex, we'll create the project properly."
echo ""
echo "📋 Steps to create the iOS app:"
echo ""
echo "1. Open Xcode"
echo "2. File → New → Project"
echo "3. Choose 'iOS' → 'App'"
echo "4. Fill in:"
echo "   - Product Name: StrideMind"
echo "   - Team: (Your team)"
echo "   - Organization Identifier: com.yourname"
echo "   - Interface: SwiftUI"
echo "   - Language: Swift"
echo "   - Storage: None (we'll use UserDefaults)"
echo "5. Save to: $(pwd)/StrideMind"
echo ""
echo "6. After creating, add HealthKit capability:"
echo "   - Select project in navigator"
echo "   - Select 'StrideMind' target"
echo "   - Go to 'Signing & Capabilities'"
echo "   - Click '+' and add 'HealthKit'"
echo ""
echo "7. Then run this script again to copy the source files"
echo ""

# Check if Xcode project exists
if [ -d "StrideMind/StrideMind.xcodeproj" ]; then
    echo "✅ Xcode project found!"
    echo ""
    echo "Now copying source files..."
    echo ""
    
    # Create directories
    mkdir -p StrideMind/StrideMind/Models
    mkdir -p StrideMind/StrideMind/Services
    mkdir -p StrideMind/StrideMind/Views
    
    # Copy files from templates
    if [ -d "ios-templates" ]; then
        echo "📁 Copying Swift files..."
        cp -r ios-templates/* StrideMind/StrideMind/
        echo "✅ Files copied!"
        echo ""
        echo "Next steps:"
        echo "1. Open StrideMind.xcodeproj in Xcode"
        echo "2. Add all the Swift files to the project:"
        echo "   - Right-click 'StrideMind' folder"
        echo "   - 'Add Files to StrideMind'"
        echo "   - Select Models/, Services/, Views/ folders"
        echo "   - Check 'Copy items if needed'"
        echo "   - Check 'Create groups'"
        echo "   - Add to target: StrideMind"
        echo "3. Replace ContentView.swift and StrideMindApp.swift"
        echo "4. Build and run!"
    else
        echo "⚠️  Template files not found. Creating them now..."
    fi
else
    echo "⚠️  Xcode project not found yet."
    echo ""
    echo "Please follow steps 1-6 above to create the project first."
    echo "Then run this script again."
fi

echo ""
echo "Need help? Check QUICKSTART.md or TROUBLESHOOTING.md"
