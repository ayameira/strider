import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
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
        trainingPlan: null,
        goal: 'Run a marathon', // Default goal
      });
    }
    return this.users.get(userId);
  }

  updateUserData(userId, data) {
    const userData = this.getUserData(userId);
    Object.assign(userData, data);
    return userData;
  }
}

const dataStore = new DataStore();

// --- API Endpoints ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StrideMind API is running' });
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

    const systemPrompt = `You are StrideMind, a supportive and expert running coach. Your goal is to help the user achieve their running goals.

User's Context:
- Goal: ${userData.goal}
- Training Plan: ${userData.trainingPlan ? JSON.stringify(userData.trainingPlan, null, 2) : 'No training plan set.'}
- Recent Workouts:
${userData.workouts.length > 0 ? userData.workouts.slice(0, 10).map(w => `  - ${w.date}: ${w.type}, ${w.distance} miles, effort ${w.effort}/10`).join('\n') : '  No recent workouts logged.'}

Based on this context, provide a helpful, encouraging, and expert response to the user's message. Keep your answers conversational and not too long.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const response = completion.choices[0].message.content;
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`🏃 StrideMind API running on port ${PORT}`);
});
