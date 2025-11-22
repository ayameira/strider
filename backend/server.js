import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { getOpenAIClient } from './lib/openaiClient.js';
import prisma from './lib/prismaClient.js';
import {
  getUserData,
  syncUserData,
  getChatHistory,
  recordChatTurns,
} from './services/userService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = getOpenAIClient();

// Middleware
app.use(cors());
app.use(express.json());

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function cloneDate(date) {
  return new Date(date.getTime());
}

function subtractDays(date, days) {
  const newDate = cloneDate(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
}

function formatIsoDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDecimal(value, fractionDigits = 1) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const fixed = value.toFixed(fractionDigits);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function normalizeWorkouts(workouts) {
  if (!Array.isArray(workouts)) {
    return [];
  }

  return workouts
    .filter(Boolean)
    .map(run => {
      const parsedDate = parseDate(run?.date);
      if (!parsedDate) {
        return null;
      }

      const parsedDistance = Number.parseFloat(run?.distance);
      const hasDistance = Number.isFinite(parsedDistance);

      const parsedEffort = Number.parseFloat(run?.effort);
      const hasEffort = Number.isFinite(parsedEffort);

      const type = typeof run?.type === 'string' && run.type.trim()
        ? run.type.trim()
        : 'Run';

      return {
        ...run,
        date: parsedDate,
        type,
        distance: hasDistance ? parsedDistance : 0,
        hasDistance,
        effort: hasEffort ? parsedEffort : 0,
        hasEffort,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date);
}

function calculateBucketStatistics(bucketRuns, startDate, endDate, periodLabel, numWeeksInBucket) {
  let totalMiles = 0;
  let totalEffort = 0;
  let effortCount = 0;
  let longestRun = 0;
  const workoutCounts = {};

  for (const run of bucketRuns) {
    if (Number.isFinite(run.distance)) {
      totalMiles += run.distance;
      if (run.distance > longestRun) {
        longestRun = run.distance;
      }
    }

    if (run.hasEffort && Number.isFinite(run.effort)) {
      totalEffort += run.effort;
      effortCount += 1;
    }

    const type = run.type || 'Run';
    workoutCounts[type] = (workoutCounts[type] || 0) + 1;
  }

  const avgWeeklyMiles = numWeeksInBucket > 0 ? totalMiles / numWeeksInBucket : 0;
  const avgRunsPerWeek = numWeeksInBucket > 0 ? bucketRuns.length / numWeeksInBucket : 0;
  const avgEffort = effortCount > 0 ? totalEffort / effortCount : null;

  return {
    periodLabel,
    periodStartDate: formatIsoDate(startDate),
    periodEndDate: formatIsoDate(endDate),
    runs: bucketRuns.length,
    totalMiles: Number(totalMiles.toFixed(2)),
    avgWeeklyMiles: Number(avgWeeklyMiles.toFixed(2)),
    avgRunsPerWeek: Number(avgRunsPerWeek.toFixed(2)),
    avgEffort: avgEffort !== null ? Number(avgEffort.toFixed(1)) : null,
    longestRun: Number(longestRun.toFixed(2)),
    workoutCounts,
  };
}

function generateHistoricalRunSummaries(allRuns, currentDate) {
  const runs = Array.isArray(allRuns) ? allRuns : [];
  if (runs.length === 0) {
    return [];
  }

  const fourWeeksAgo = subtractDays(currentDate, 28);
  const oneYearAgo = subtractDays(currentDate, 52 * 7);

  const olderRuns = runs
    .filter(run => run.date < fourWeeksAgo)
    .map(run => ({ ...run, date: cloneDate(run.date) }));

  if (olderRuns.length === 0) {
    return [];
  }

  olderRuns.sort((a, b) => b.date - a.date);

  const summaries = [];
  const oldestRunDate = olderRuns[olderRuns.length - 1].date;
  let currentLoopEndDate = cloneDate(fourWeeksAgo);

  let weeklyBucketNum = 1;
  const weeklyBucketSize = 28;

  while (true) {
    const currentLoopStartDate = subtractDays(currentLoopEndDate, weeklyBucketSize);

    if (currentLoopStartDate < oneYearAgo) {
      break;
    }

    if (currentLoopEndDate < oldestRunDate) {
      break;
    }

    const bucketRuns = olderRuns.filter(
      run => run.date >= currentLoopStartDate && run.date < currentLoopEndDate
    );

    if (bucketRuns.length > 0) {
      const startWeek = weeklyBucketNum * 4 + 1;
      const endWeek = (weeklyBucketNum + 1) * 4;
      const periodLabel = `[${startWeek}-${endWeek} weeks ago]`;

      const summary = calculateBucketStatistics(
        bucketRuns,
        currentLoopStartDate,
        currentLoopEndDate,
        periodLabel,
        4
      );
      summaries.push(summary);
    }

    currentLoopEndDate = cloneDate(currentLoopStartDate);
    weeklyBucketNum += 1;
  }

  let yearlyBucketNum = 1;
  const yearlyBucketSize = 52 * 7;

  while (currentLoopEndDate >= oldestRunDate) {
    const currentLoopStartDate = subtractDays(currentLoopEndDate, yearlyBucketSize);

    const bucketRuns = olderRuns.filter(
      run => run.date >= currentLoopStartDate && run.date < currentLoopEndDate
    );

    if (bucketRuns.length > 0) {
      const startYear = yearlyBucketNum;
      const endYear = yearlyBucketNum + 1;
      const periodLabel = `[${startYear}-${endYear} year(s) ago]`;

      const summary = calculateBucketStatistics(
        bucketRuns,
        currentLoopStartDate,
        currentLoopEndDate,
        periodLabel,
        52
      );
      summaries.push(summary);
    }

    currentLoopEndDate = cloneDate(currentLoopStartDate);
    yearlyBucketNum += 1;
  }

  return summaries;
}

function formatRecentRunLine(run) {
  const dateStr = formatIsoDate(run.date);
  const distanceText = run.hasDistance
    ? `${formatDecimal(run.distance, 1)} mi`
    : 'distance N/A';
  const effortText = run.hasEffort
    ? `effort ${formatDecimal(run.effort, 1)}/10`
    : 'effort N/A';

  return `    - ${dateStr}: ${run.type}, ${distanceText}, ${effortText}`;
}

function formatHistoricalSummaryLine(summary) {
  const parts = [
    `${formatDecimal(summary.totalMiles, 1)} mi across ${summary.runs} runs`,
    `avg ${formatDecimal(summary.avgWeeklyMiles, 1)} mi/wk`,
    `${formatDecimal(summary.avgRunsPerWeek, 1)} runs/wk`,
  ];

  if (Number.isFinite(summary.longestRun) && summary.longestRun > 0) {
    parts.push(`longest ${formatDecimal(summary.longestRun, 1)} mi`);
  }

  if (summary.avgEffort !== null && Number.isFinite(summary.avgEffort)) {
    parts.push(`avg effort ${formatDecimal(summary.avgEffort, 1)}/10`);
  }

  const typeEntries = Object.entries(summary.workoutCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const typesText = typeEntries.length
    ? ` Types: ${typeEntries.map(([type, count]) => `${type} x${count}`).join(', ')}`
    : '';

  return `    - ${summary.periodLabel}: ${parts.join(', ')}.${typesText}`;
}

function buildWorkoutsSection(workouts, currentDate = new Date()) {
  const normalizedRuns = normalizeWorkouts(workouts);

  if (normalizedRuns.length === 0) {
    return '  No workouts logged yet.';
  }

  const referenceDate = parseDate(currentDate) || new Date();
  const fourWeeksAgo = subtractDays(referenceDate, 28);
  const recentRuns = normalizedRuns.filter(run => run.date >= fourWeeksAgo);
  const MAX_RECENT_RUNS = 8;

  const recentLines = recentRuns
    .slice(0, MAX_RECENT_RUNS)
    .map(formatRecentRunLine);

  if (recentRuns.length > MAX_RECENT_RUNS) {
    recentLines.push(
      `    - ...and ${recentRuns.length - MAX_RECENT_RUNS} more runs within the last 4 weeks.`
    );
  }

  const historicalSummaries = generateHistoricalRunSummaries(normalizedRuns, referenceDate);
  const historicalLines = historicalSummaries.map(formatHistoricalSummaryLine);

  const recentSectionLines = [
    '  - Last 4 weeks:',
    recentLines.length > 0 ? recentLines.join('\n') : '    - No runs logged in the last 4 weeks.',
  ];

  const historicalSectionLines = [
    '  - Older history:',
    historicalLines.length > 0
      ? historicalLines.join('\n')
      : '    - Not enough older data to summarize yet.',
  ];

  return [...recentSectionLines, ...historicalSectionLines].join('\n');
}

// --- API Endpoints ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'strider API is running' });
});

// Get all data for a user
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await getUserData(userId);
    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync user data
app.post('/api/user/:userId/sync', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const updatedData = await syncUserData(userId, data);
    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error syncing user data:', error);
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

    const userData = await getUserData(userId);

    const profileLine = userData.profile
      ? `- Name: ${userData.profile.name}\n- Preferred Units: ${userData.profile.distanceUnit}`
      : '- Profile: Not provided yet.';

    const planLine = userData.planDocument
      ? `- Weekly Plan (markdown):\n${userData.planDocument.content}`
      : '- Weekly Plan: Not set. Offer to help craft or refresh it if relevant.';

    const workoutsSection = buildWorkoutsSection(userData.workouts, new Date());

    const systemPrompt = `You are strider, a supportive and expert running coach. Your goal is to help the user achieve their running goals.

User's Context:
${profileLine}
- Goal: ${userData.goal}
${planLine}
- Recent Workouts:
${workoutsSection}

You can create multi-week training plans.
When you update or propose edits to the plan, you MUST output the plan as a JSON object within a code block labeled 'json'.
The structure should be:
{
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Base Building",
      "days": [
        { "dayOfWeek": 1, "restDay": true }, // Sunday
        { "dayOfWeek": 2, "workout": { "title": "Easy Run", "type": "Easy Run", "distance": 3.0, "duration": null, "description": "Easy pace" }, "restDay": false }
        // ...
      ]
    }
  ]
}
Valid workout types: "Easy Run", "Long Run", "Tempo", "Intervals", "Recovery", "Rest", "Cross Training".
Be warm, concise, and clear in your text response, but keep the JSON strict.`;

    const previousTurns = await getChatHistory(userId);
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

    // Try to extract JSON plan
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const potentialPlan = JSON.parse(jsonMatch[1]);
        if (potentialPlan.weeks && Array.isArray(potentialPlan.weeks)) {
          const newPlanDocument = {
            id: userData.planDocument?.id,
            title: userData.planDocument?.title || "Training Plan",
            content: "See structured view",
            weeks: potentialPlan.weeks,
            lastUpdated: new Date(),
            context: userData.planDocument?.context
          };
          await syncUserData(userId, { ...userData, planDocument: newPlanDocument });
        }
      } catch (e) {
        console.log("Failed to parse JSON plan from LLM", e);
      }
    }

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

    await recordChatTurns(userId, [userTurn, assistantTurn]);
    const updatedHistory = await getChatHistory(userId);

    res.json({
      success: true,
      response,
      assistantTurn,
      history: updatedHistory,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`🏃 strider API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  prisma.$disconnect()
    .catch(error => {
      console.error('Error disconnecting Prisma:', error);
    })
    .finally(() => {
      process.exit(0);
    });
}

startServer();

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
