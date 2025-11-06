#!/bin/bash

# strider API Test Script
# Usage: ./test-api.sh

BASE_URL="http://localhost:3000"
USER_ID="test-user-from-script"

echo "🏃 Testing strider API..."
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Initialize coach session
echo "2️⃣ Initializing coach session for user: $USER_ID..."
session_response=$(curl -s -X POST "$BASE_URL/api/user/$USER_ID/coach/init" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Run a 5k in under 25 minutes",
    "raceDate": "2026-05-15"
  }')
echo "$session_response" | jq '.success'
session_id=$(echo "$session_response" | jq -r '.sessionId')
echo "Session ID: $session_id"
echo "Session resumed: $(echo "$session_response" | jq -r '.resumed')"
echo ""

# Test 3: Sync workouts
echo "3️⃣ Syncing workouts..."
sync_response=$(curl -s -X POST "$BASE_URL/api/user/$USER_ID/workouts/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "workouts": [
      {"id": "'$(uuidgen)'", "date": "2025-10-20T10:00:00Z", "type": "easy", "activityType": "running", "distance": 5, "duration": 2700, "effort": 5, "completed": true},
      {"id": "'$(uuidgen)'", "date": "2025-10-18T09:30:00Z", "type": "long", "activityType": "running", "distance": 12, "duration": 6300, "effort": 7, "completed": true}
    ]
  }')
echo $sync_response | jq '.'
echo ""

# Test 4: Chat with coach
if [ -n "$session_id" ] && [ "$session_id" != "null" ]; then
  echo "4️⃣ Messaging coach for user $USER_ID..."
  chat_response=$(curl -s -X POST "$BASE_URL/api/user/$USER_ID/coach/chat" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Coach, what should I focus on this week?"
    }')
  echo "$chat_response" | jq '.success'
  echo "Response preview:" $(echo "$chat_response" | jq -r '.response' | cut -c1-120)
  echo ""
else
  echo "⚠️  Skipping chat test because session initialization failed."
  echo ""
fi

echo "✅ API tests complete!"
echo ""
echo "Note: Install jq for formatted output: brew install jq"
