import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { randomUUID } from 'crypto';
import { getOpenAIClient } from './lib/openaiClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = getOpenAIClient();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- In-memory Data Store ---
// For simplicity, we'll keep data in memory.
// In a real app, you'd use a database.
class DataStore {
  constructor() {
    this.users = new Map();
  }

  getUserData(userId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        userId,
        workouts: [],
        planDocument: null,
        goal: 'Run a marathon', // Default goal
        profile: null,
        chatHistory: [],
      });
    }
    return this.users.get(userId);
  }

  updateUserData(userId, data) {
    const userData = this.getUserData(userId);
    Object.assign(userData, data);
    if (!Array.isArray(userData.chatHistory)) {
      userData.chatHistory = [];
    }
    return userData;
  }

  getChatHistory(userId) {
    const userData = this.getUserData(userId);
    if (!Array.isArray(userData.chatHistory)) {
      userData.chatHistory = [];
    }
    return userData.chatHistory;
  }

  appendChatTurn(userId, turn) {
    const userData = this.getUserData(userId);
    if (!Array.isArray(userData.chatHistory)) {
      userData.chatHistory = [];
    }
    userData.chatHistory.push(turn);
    const maxTurns = 40;
    if (userData.chatHistory.length > maxTurns) {
      userData.chatHistory = userData.chatHistory.slice(-maxTurns);
    }
  }
}

const dataStore = new DataStore();

// --- API Endpoints ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'strider API is running' });
});

// Get all data for a user
app.get('/api/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userData = dataStore.getUserData(userId);
    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync user data
app.post('/api/user/:userId/sync', (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const updatedData = dataStore.updateUserData(userId, data);
    res.json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat with AI coach
app.post('/api/coach/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId and message are required' });
    }

    const userData = dataStore.getUserData(userId);

    const profileLine = userData.profile
      ? `- Name: ${userData.profile.name}\n- Preferred Units: ${userData.profile.distanceUnit}`
      : '- Profile: Not provided yet.';

    const planLine = userData.planDocument
      ? `- Weekly Plan (markdown):\n${userData.planDocument.content}`
      : '- Weekly Plan: Not set. Offer to help craft or refresh it if relevant.';

    const workoutsSection = userData.workouts.length > 0
      ? userData.workouts
          .slice(0, 10)
          .map(w => `  - ${w.date}: ${w.type}, ${w.distance} miles, effort ${w.effort}/10`)
          .join('\n')
      : '  No recent workouts logged.';

    const systemPrompt = `You are strider, a supportive and expert running coach. Your goal is to help the user achieve their running goals.

User's Context:
${profileLine}
- Goal: ${userData.goal}
${planLine}
- Recent Workouts:
${workoutsSection}

When you update or propose edits to the weekly plan, output the revised markdown so it can be stored. Be warm, concise, and clear.`;

    const previousTurns = dataStore.getChatHistory(userId);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...previousTurns.map(turn => ({
          role: turn.role,
          content: turn.content,
        })),
        { role: 'user', content: message }
      ],
      temperature: 1,
      //max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    const timestamp = new Date().toISOString();

    const userTurn = {
      id: randomUUID(),
      role: 'user',
      content: message,
      timestamp,
    };

    const assistantTurn = {
      id: randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };

    dataStore.appendChatTurn(userId, userTurn);
    dataStore.appendChatTurn(userId, assistantTurn);

    res.json({
      success: true,
      response,
      assistantTurn,
      //history: dataStore.getChatHistory(userId),
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`🏃 strider API running on port ${PORT}`);
});
