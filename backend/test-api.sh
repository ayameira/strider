#!/bin/bash

# StrideMind API Test Script
# Usage: ./test-api.sh

BASE_URL="http://localhost:3000"

echo "🏃 Testing StrideMind API..."
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Generate training plan
echo "2️⃣ Testing plan generation..."
curl -s -X POST "$BASE_URL/api/plan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "currentFitness": "Running 3 times per week, comfortable with 5K",
    "weeklyMileage": 20,
    "raceDate": "2024-10-15",
    "goals": "Complete first marathon under 4 hours",
    "experience": "Completed several half marathons, new to marathon distance"
  }' | jq '.success'
echo ""

# Test 3: Analyze workout
echo "3️⃣ Testing workout analysis..."
curl -s -X POST "$BASE_URL/api/workout/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "workout": {
      "distance": 5,
      "duration": 2400,
      "effort": 7,
      "notes": "Felt good, slight fatigue at end"
    },
    "plannedWorkout": {
      "type": "easy",
      "distance": 5,
      "notes": "Easy pace"
    },
    "recentWorkouts": [
      {"date": "2024-01-10", "distance": 4, "effort": 6},
      {"date": "2024-01-08", "distance": 6, "effort": 7}
    ],
    "currentWeek": 3
  }' | jq '.success'
echo ""

# Test 4: Chat with coach
echo "4️⃣ Testing coach chat..."
curl -s -X POST "$BASE_URL/api/coach/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How am I progressing?",
    "context": {
      "currentWeek": 3,
      "recentWorkouts": 5
    }
  }' | jq '.success'
echo ""

echo "✅ API tests complete!"
echo ""
echo "Note: Install jq for formatted output: brew install jq"
