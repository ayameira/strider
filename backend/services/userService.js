import prisma from '../lib/prismaClient.js';

const DEFAULT_GOAL = 'Run a marathon';
const MAX_CHAT_TURNS = 40;

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toISOString(value) {
  const date = value instanceof Date ? value : toDate(value);
  return date ? date.toISOString() : null;
}

function sanitizeGoal(goal) {
  if (typeof goal !== 'string') {
    return DEFAULT_GOAL;
  }
  const trimmed = goal.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_GOAL;
}

function sanitizeWorkout(workout) {
  if (!workout || typeof workout !== 'object') {
    return null;
  }

  const id = typeof workout.id === 'string' ? workout.id : null;
  if (!id) {
    return null;
  }

  const date = toDate(workout.date);
  if (!date) {
    return null;
  }

  const type = typeof workout.type === 'string' ? workout.type : 'Run';
  const activityType = typeof workout.activityType === 'string' ? workout.activityType : 'running';
  const distance = Number.parseFloat(workout.distance);
  const duration = Number.parseFloat(workout.duration);
  const effort = Number.isInteger(workout.effort)
    ? workout.effort
    : Number.isFinite(Number.parseInt(workout.effort, 10))
      ? Number.parseInt(workout.effort, 10)
      : 0;

  return {
    id,
    date,
    type,
    activityType,
    distance: Number.isFinite(distance) ? distance : 0,
    duration: Number.isFinite(duration) ? duration : 0,
    effort: Number.isFinite(effort) ? effort : 0,
    notes: typeof workout.notes === 'string' ? workout.notes : '',
    completed: typeof workout.completed === 'boolean' ? workout.completed : Boolean(workout.completed),
    feedback: typeof workout.feedback === 'string' ? workout.feedback : null,
    tempoSets: workout.tempoSets ?? null,
  };
}

function sanitizeChatTurn(turn) {
  if (!turn || typeof turn !== 'object') {
    return null;
  }

  const id = typeof turn.id === 'string' ? turn.id : null;
  const role = typeof turn.role === 'string' ? turn.role : null;
  const content = typeof turn.content === 'string' ? turn.content : null;
  const timestamp = toDate(turn.timestamp);

  if (!id || !role || !content || !timestamp) {
    return null;
  }

  return { id, role, content, timestamp };
}

function mapWorkoutRecord(record) {
  return {
    id: record.id,
    date: toISOString(record.date),
    type: record.type,
    activityType: record.activityType,
    distance: record.distance,
    duration: record.duration,
    effort: record.effort,
    notes: record.notes ?? '',
    completed: record.completed,
    feedback: record.feedback ?? null,
    tempoSets: record.tempoSets ?? null,
  };
}

function mapChatTurnRecord(record) {
  return {
    id: record.id,
    role: record.role,
    content: record.content,
    timestamp: toISOString(record.timestamp),
  };
}

function mapUserProfileRecord(record) {
  if (!record) {
    return null;
  }

  return {
    name: record.name,
    distanceUnit: record.distanceUnit,
    dateOfBirth: toISOString(record.dateOfBirth),
    medicalConditions: record.medicalConditions ?? null,
    currentInjuries: record.currentInjuries ?? null,
    
    goalType: record.goalType ?? null,
    raceDistance: record.raceDistance ?? null,
    raceDate: toISOString(record.raceDate),
    goalDetail: record.goalDetail ?? null,
    
    trainingsPerWeek: record.trainingsPerWeek ?? null,
    trainingDays: record.trainingDays ?? [],
    longRunDay: record.longRunDay ?? null,
    
    otherActivities: record.otherActivities ?? [],
    otherActivityDuration: record.otherActivityDuration ?? null,
    otherActivityIntensity: record.otherActivityIntensity ?? null,
    physicallyDemandingJob: record.physicallyDemandingJob ?? null,
    jobDetail: record.jobDetail ?? null,
    
    createdAt: toISOString(record.createdAt),
    lastUpdated: toISOString(record.lastUpdated) ?? toISOString(record.createdAt),
  };
}

function mapPlanDocumentRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    title: record.title,
    content: record.content,
    lastUpdated: toISOString(record.lastUpdated),
    context: record.context ?? null,
  };
}

function sanitizePlanDocument(plan) {
  if (!plan || typeof plan !== 'object') {
    return null;
  }

  const content = typeof plan.content === 'string' ? plan.content : '';
  const title =
    typeof plan.title === 'string' && plan.title.trim().length > 0
      ? plan.title.trim()
      : 'Weekly Training Plan';

  return {
    id: typeof plan.id === 'string' ? plan.id : null,
    title,
    content,
    lastUpdated: toDate(plan.lastUpdated) ?? new Date(),
    context: plan.context ?? null,
  };
}

async function ensureUser(userId, goal) {
  return prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      goal: sanitizeGoal(goal),
    },
    update: {
      goal: goal ? sanitizeGoal(goal) : undefined,
    },
  });
}

export async function getUserData(userId) {
  await ensureUser(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workouts: {
        orderBy: {
          date: 'desc',
        },
      },
      planDocument: true,
      profile: true,
      chatTurns: {
        orderBy: {
          timestamp: 'asc',
        },
        take: MAX_CHAT_TURNS,
      },
    },
  });

  if (!user) {
    return {
      userId,
      goal: DEFAULT_GOAL,
      workouts: [],
      planDocument: null,
      chatHistory: [],
      profile: null,
    };
  }

  return {
    userId,
    goal: sanitizeGoal(user.goal),
    workouts: user.workouts.map(mapWorkoutRecord),
    planDocument: mapPlanDocumentRecord(user.planDocument),
    chatHistory: user.chatTurns.map(mapChatTurnRecord),
    profile: mapUserProfileRecord(user.profile),
  };
}

export async function syncUserData(userId, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  const goal = sanitizeGoal(payload.goal);
  const workouts = Array.isArray(payload.workouts)
    ? payload.workouts
        .map(sanitizeWorkout)
        .filter(Boolean)
    : [];
  const chatHistory = Array.isArray(payload.chatHistory)
    ? payload.chatHistory
        .map(sanitizeChatTurn)
        .filter(Boolean)
    : [];
  const trimmedChatHistory = chatHistory.slice(-MAX_CHAT_TURNS);
  const planDocument = sanitizePlanDocument(payload.planDocument);
  const profile = payload.profile;

  await prisma.$transaction(async tx => {
    await tx.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        goal,
      },
      update: {
        goal,
      },
    });

    if (profile) {
      const profileData = {
        name: typeof profile.name === 'string' ? profile.name : 'Athlete',
        distanceUnit: typeof profile.distanceUnit === 'string' ? profile.distanceUnit : 'miles',
        
        dateOfBirth: toDate(profile.dateOfBirth),
        medicalConditions: typeof profile.medicalConditions === 'string' ? profile.medicalConditions : null,
        currentInjuries: typeof profile.currentInjuries === 'string' ? profile.currentInjuries : null,
        
        goalType: typeof profile.goalType === 'string' ? profile.goalType : null,
        raceDistance: typeof profile.raceDistance === 'string' ? profile.raceDistance : null,
        raceDate: toDate(profile.raceDate),
        goalDetail: typeof profile.goalDetail === 'string' ? profile.goalDetail : null,
        
        trainingsPerWeek: typeof profile.trainingsPerWeek === 'number' ? profile.trainingsPerWeek : null,
        trainingDays: Array.isArray(profile.trainingDays) ? profile.trainingDays : [],
        longRunDay: typeof profile.longRunDay === 'string' ? profile.longRunDay : null,
        
        otherActivities: Array.isArray(profile.otherActivities) ? profile.otherActivities : [],
        otherActivityDuration: typeof profile.otherActivityDuration === 'number' ? profile.otherActivityDuration : null,
        otherActivityIntensity: typeof profile.otherActivityIntensity === 'string' ? profile.otherActivityIntensity : null,
        physicallyDemandingJob: typeof profile.physicallyDemandingJob === 'boolean' ? profile.physicallyDemandingJob : null,
        jobDetail: typeof profile.jobDetail === 'string' ? profile.jobDetail : null,
        
        createdAt: toDate(profile.createdAt) ?? new Date(),
        lastUpdated: toDate(profile.lastUpdated) ?? new Date(),
      };

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...profileData,
        },
        update: {
          name: profileData.name,
          distanceUnit: profileData.distanceUnit,
          dateOfBirth: profileData.dateOfBirth,
          medicalConditions: profileData.medicalConditions,
          currentInjuries: profileData.currentInjuries,
          
          goalType: profileData.goalType,
          raceDistance: profileData.raceDistance,
          raceDate: profileData.raceDate,
          goalDetail: profileData.goalDetail,
          
          trainingsPerWeek: profileData.trainingsPerWeek,
          trainingDays: profileData.trainingDays,
          longRunDay: profileData.longRunDay,
          
          otherActivities: profileData.otherActivities,
          otherActivityDuration: profileData.otherActivityDuration,
          otherActivityIntensity: profileData.otherActivityIntensity,
          physicallyDemandingJob: profileData.physicallyDemandingJob,
          jobDetail: profileData.jobDetail,
          
          lastUpdated: profileData.lastUpdated,
        },
      });
    } else {
      await tx.userProfile.deleteMany({ where: { userId } });
    }

    if (planDocument) {
      await tx.planDocument.upsert({
        where: { userId },
        create: {
          id: planDocument.id ?? undefined,
          userId,
          title: planDocument.title,
          content: planDocument.content,
          lastUpdated: planDocument.lastUpdated,
          context: planDocument.context,
        },
        update: {
          title: planDocument.title,
          content: planDocument.content,
          lastUpdated: planDocument.lastUpdated,
          context: planDocument.context,
        },
      });
    } else {
      await tx.planDocument.deleteMany({ where: { userId } });
    }

    const incomingWorkoutIds = workouts.map(workout => workout.id);
    if (incomingWorkoutIds.length > 0) {
      await tx.workout.deleteMany({
        where: {
          userId,
          id: { notIn: incomingWorkoutIds },
        },
      });
    } else {
      await tx.workout.deleteMany({
        where: { userId },
      });
    }

    for (const workout of workouts) {
      await tx.workout.upsert({
        where: { id: workout.id },
        create: {
          id: workout.id,
          userId,
          date: workout.date,
          type: workout.type,
          activityType: workout.activityType,
          distance: workout.distance,
          duration: workout.duration,
          effort: workout.effort,
          notes: workout.notes,
          completed: workout.completed,
          feedback: workout.feedback,
          tempoSets: workout.tempoSets,
        },
        update: {
          date: workout.date,
          type: workout.type,
          activityType: workout.activityType,
          distance: workout.distance,
          duration: workout.duration,
          effort: workout.effort,
          notes: workout.notes,
          completed: workout.completed,
          feedback: workout.feedback,
          tempoSets: workout.tempoSets,
          updatedAt: new Date(),
        },
      });
    }

    const incomingChatIds = trimmedChatHistory.map(turn => turn.id);
    if (incomingChatIds.length > 0) {
      await tx.chatTurn.deleteMany({
        where: {
          userId,
          id: { notIn: incomingChatIds },
        },
      });
    } else {
      await tx.chatTurn.deleteMany({ where: { userId } });
    }

    for (const turn of trimmedChatHistory) {
      await tx.chatTurn.upsert({
        where: { id: turn.id },
        create: {
          id: turn.id,
          userId,
          role: turn.role,
          content: turn.content,
          timestamp: turn.timestamp,
        },
        update: {
          role: turn.role,
          content: turn.content,
          timestamp: turn.timestamp,
        },
      });
    }
  });

  return getUserData(userId);
}

export async function recordChatTurns(userId, turns) {
  if (!Array.isArray(turns) || turns.length === 0) {
    return;
  }

  await prisma.$transaction(async tx => {
    await ensureUser(userId);

    for (const turn of turns) {
      const sanitized = sanitizeChatTurn(turn);
      if (!sanitized) {
        continue;
      }

      await tx.chatTurn.upsert({
        where: { id: sanitized.id },
        create: {
          id: sanitized.id,
          userId,
          role: sanitized.role,
          content: sanitized.content,
          timestamp: sanitized.timestamp,
        },
        update: {
          role: sanitized.role,
          content: sanitized.content,
          timestamp: sanitized.timestamp,
        },
      });
    }

    const excessTurns = await tx.chatTurn.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      skip: MAX_CHAT_TURNS,
      select: { id: true },
    });

    if (excessTurns.length > 0) {
      await tx.chatTurn.deleteMany({
        where: {
          id: {
            in: excessTurns.map(turn => turn.id),
          },
        },
      });
    }
  });
}

export async function getChatHistory(userId) {
  await ensureUser(userId);

  const turns = await prisma.chatTurn.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
    take: MAX_CHAT_TURNS,
  });

  return turns.map(mapChatTurnRecord);
}

