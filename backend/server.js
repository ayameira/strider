import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StrideMind API is running' });
});

// Generate initial training plan
app.post('/api/plan/generate', async (req, res) => {
  try {
    const { currentFitness, weeklyMileage, raceDate, goals, experience } = req.body;

    const prompt = `You are an expert marathon coach. Create a personalized marathon training plan based on:
- Current fitness level: ${currentFitness}
- Current weekly mileage: ${weeklyMileage} miles
- Target race date: ${raceDate}
- Goals: ${goals}
- Running experience: ${experience}

Generate a structured 12-16 week training plan with:
1. Weekly mileage progression
2. Key workout types (easy runs, long runs, tempo, intervals)
3. Rest days
4. Taper period

Format the response as JSON with this structure:
{
  "planSummary": "Brief overview of the plan philosophy",
  "weeks": [
    {
      "weekNumber": 1,
      "totalMiles": 25,
      "workouts": [
        {"day": "Monday", "type": "rest", "distance": 0, "notes": ""},
        {"day": "Tuesday", "type": "easy", "distance": 4, "notes": "Easy pace"},
        ...
      ]
    }
  ],
  "keyPrinciples": ["principle1", "principle2"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert marathon coach who creates personalized, safe, and effective training plans.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const plan = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze workout and provide feedback
app.post('/api/workout/analyze', async (req, res) => {
  try {
    const { workout, plannedWorkout, recentWorkouts, currentWeek } = req.body;

    const prompt = `You are an expert marathon coach analyzing a completed workout.

Planned workout: ${plannedWorkout.type} - ${plannedWorkout.distance} miles
Actual workout:
- Distance: ${workout.distance} miles
- Duration: ${workout.duration} minutes
- Effort level: ${workout.effort}/10
- Notes: ${workout.notes || 'None'}

Recent training context:
${recentWorkouts.map(w => `- ${w.date}: ${w.distance} miles, effort ${w.effort}/10`).join('\n')}

Current week: ${currentWeek}

Provide:
1. Brief, motivating feedback (2-3 sentences)
2. Assessment of whether the workout met the goal
3. Any concerns or red flags (fatigue, injury risk)
4. Recommendation: "continue", "adjust_easier", or "adjust_harder"

Format as JSON:
{
  "feedback": "Your feedback here",
  "assessment": "met_goal" | "exceeded" | "fell_short",
  "concerns": ["concern1"] or [],
  "recommendation": "continue" | "adjust_easier" | "adjust_harder",
  "reasoning": "Brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a supportive marathon coach who provides clear, actionable feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing workout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Adjust training plan based on feedback
app.post('/api/plan/adjust', async (req, res) => {
  try {
    const { currentPlan, recentWorkouts, adjustment, weekNumber } = req.body;

    const prompt = `You are an expert marathon coach adjusting a training plan.

Current plan for upcoming week (week ${weekNumber}):
${JSON.stringify(currentPlan.weeks.find(w => w.weekNumber === weekNumber), null, 2)}

Recent workout history:
${recentWorkouts.map(w => `- ${w.date}: ${w.distance} miles, effort ${w.effort}/10, completed: ${w.completed}`).join('\n')}

Adjustment needed: ${adjustment}

Create an adjusted plan for the next week that:
1. Respects the athlete's current state
2. Maintains progression toward marathon goals
3. Prevents injury and overtraining

Return JSON:
{
  "adjustedWeek": {
    "weekNumber": ${weekNumber},
    "totalMiles": number,
    "workouts": [...],
    "adjustmentNote": "Explanation of changes"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert marathon coach who adapts training plans intelligently.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const adjusted = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, adjustedWeek: adjusted.adjustedWeek });
  } catch (error) {
    console.error('Error adjusting plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat with AI coach
app.post('/api/coach/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    const systemPrompt = `You are a supportive marathon coach. The athlete's context:
- Current week: ${context.currentWeek || 'Not started'}
- Recent workouts: ${context.recentWorkouts?.length || 0}
- Training goal: Marathon

Provide helpful, encouraging, and expert advice. Keep responses concise and actionable.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
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
