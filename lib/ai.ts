import { isoToday } from "@/lib/date";
import type { Goal, Habit, Mood, PlanJSON, SmartBreakdown, Task } from "@/lib/types";

const pastel = ["#ffd9e8", "#dcf5dc", "#e6d7f0", "#ffe5cc", "#d4f1d4", "#fffacd", "#c8e6c9"];

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function moodFromText(text: string): Mood {
  const lower = text.toLowerCase();
  if (/(burnout|hangus|kosong|numb|tak rasa apa)/.test(lower)) return "burnout";
  if (/(stress|stressed|tertekan|serabut|pressure)/.test(lower)) return "stressed";
  if (/(overwhelm|overwhelmed|too much|banyak sangat|tak tahu start|blur)/.test(lower)) return "overwhelmed";
  if (/(penat|tired|exhausted|tak larat|low energy|mengantuk)/.test(lower)) return "tired";
  if (/(sad|down|anxious|risau|takut|sedih)/.test(lower)) return "sad";
  if (/(happy|great|excited|semangat)/.test(lower)) return "great";
  return "okay";
}

function languageFromText(text: string): PlanJSON["detectedLanguage"] {
  const lower = text.toLowerCase();
  const malay = /(nak|tak|kena|sejam|tidur|bangun|kurang|baca|buat|dah|lagi|sikit|jadual|tolong|susun)/.test(lower);
  const english = /(need|want|study|read|sleep|wake|exercise|course|project|today|tomorrow|schedule|practice)/.test(lower);
  if (malay && english) return "Manglish";
  if (malay) return "Malay";
  return "English";
}

function energyFromMood(mood: Mood): PlanJSON["energyLevel"] {
  if (mood === "great") return "high";
  if (["tired", "sad", "overwhelmed", "stressed", "burnout"].includes(mood)) return "low";
  return "medium";
}

export function detectLanguageStyle(text: string) {
  return languageFromText(text).toLowerCase() as "english" | "malay" | "manglish";
}

export function detectMood(text: string) {
  return moodFromText(text);
}

export function detectEnergyLevel(text: string) {
  return energyFromMood(moodFromText(text));
}

export function mapMoodToMascot(mood: Mood) {
  return {
    great: "happy",
    okay: "neutral",
    tired: "sleepy",
    sad: "sad",
    overwhelmed: "anxious",
    stressed: "frustrated",
    burnout: "burnout"
  }[mood];
}

function workloadFactor(mood: Mood) {
  if (mood === "burnout") return 0.45;
  if (["overwhelmed", "stressed", "tired", "sad"].includes(mood)) return 0.65;
  if (mood === "great") return 1;
  return 0.8;
}

function makeTask(title: string, goalId: string, category: string, date: string, time: string, durationMinutes: number, priority: Task["priority"], colorIndex: number): Task {
  return {
    id: uid("task"),
    title,
    goalId,
    category,
    date,
    time,
    durationMinutes,
    priority,
    done: false,
    pastel: pastel[colorIndex % pastel.length]
  };
}

function bestieLine(language: PlanJSON["detectedLanguage"], mood: Mood) {
  const low = ["tired", "sad", "overwhelmed", "stressed", "burnout"].includes(mood);
  if (language === "Malay") return low ? "Takpe, kita susun versi ringan dulu. Buat satu langkah kecil, lepas tu baru tambah." : "Okay, saya dah susun jadi plan yang jelas dan boleh buat.";
  if (language === "Manglish") return low ? "Takpe bestie, today bukan gagal. Kita reset kecil je: satu task dulu, then tick. Small win pun still win." : "Okay bestie, I susun chaos tu jadi plan SMART. Kita jalan slow but steady.";
  return low ? "No guilt today. I made this lighter and realistic: one small win first, then the next." : "I turned the dump into a SMART plan with clear next actions.";
}

export function fallbackPlan(text: string): PlanJSON {
  const mood = moodFromText(text);
  const detectedLanguage = languageFromText(text);
  const energyLevel = energyFromMood(mood);
  const factor = workloadFactor(mood);
  const today = isoToday();

  const goals: Goal[] = [
    {
      id: uid("goal"),
      title: "Build calm daily routine",
      category: "Wellness",
      priority: "high",
      progress: 0,
      milestones: ["Reduce screen time", "Sleep and wake earlier", "Track diet gently"]
    },
    {
      id: uid("goal"),
      title: "Grow learning stack",
      category: "Learning",
      priority: "high",
      progress: 0,
      milestones: ["Read 2 articles daily", "Practice English", "Complete Coursera lessons"]
    },
    {
      id: uid("goal"),
      title: "Finish big project or certification",
      category: "Projects",
      priority: "medium",
      progress: 0,
      milestones: ["Define deliverable", "Break into 30 minute tasks", "Review weekly"]
    }
  ];

  const habits: Habit[] = [
    ["Read 2 articles", "book", "2 Medium/articles", "Learning"],
    ["Practice English", "chat", `${Math.round(60 * factor)} minutes`, "Learning"],
    ["Coursera", "laptop", `${Math.round(60 * factor)} minutes`, "Learning"],
    ["Sleep early", "moon", "wind down before 10:30 PM", "Wellness"],
    ["Wake up early", "sun", "consistent wake time", "Wellness"],
    ["Exercise", "dumbbell", `${Math.round(60 * factor)} minutes flexible`, "Health"],
    ["Diet tracking", "apple", "1 simple food log", "Health"],
    ["Brain dump", "brain", "1 dump", "Planning"]
  ].map(([title, icon, target, category]) => ({
    id: uid("habit"),
    title,
    icon,
    target,
    frequency: "daily",
    category,
    streak: 0,
    logs: { [today]: false }
  }));

  const tasks: Task[] = [
    makeTask("Brain dump + choose top 3 priorities", goals[0].id, "Planning", today, "08:30", 15, "high", 0),
    makeTask("Read 2 articles and write 2 bullet notes each", goals[1].id, "Learning", today, "09:00", 35, "medium", 1),
    makeTask(`Practice English: ${Math.round(60 * factor)} min speaking or writing`, goals[1].id, "Learning", today, "11:00", Math.round(60 * factor), "high", 2),
    makeTask("Complete Coursera Module 1, Lesson 1-2 + 3 notes", goals[1].id, "Learning", today, "16:00", Math.round(60 * factor), "high", 3),
    makeTask(`Exercise flexible: ${Math.round(45 * factor)} min walk/stretch/workout`, goals[0].id, "Health", isoToday(1), "17:30", Math.round(45 * factor), "medium", 4),
    makeTask("Diet log: meals + water + one tiny improvement", goals[0].id, "Health", isoToday(1), "19:00", 10, "low", 5),
    makeTask("Wind down: phone away and sleep prep", goals[0].id, "Wellness", today, "22:00", 30, "high", 6),
    makeTask("Weekly review: move missed tasks gently", goals[2].id, "Planning", isoToday(6), "10:00", 30, "medium", 0),
    makeTask("Monthly milestone review: pick one project deliverable", goals[2].id, "Projects", isoToday(21), "10:00", 45, "medium", 2),
    makeTask("Year milestone: complete one course/cert checkpoint", goals[2].id, "Projects", isoToday(90), "10:00", 60, "medium", 3)
  ];

  for (let day = 2; day <= 6; day += 1) {
    tasks.push(
      makeTask("Read 2 articles + save 2 notes", goals[1].id, "Learning", isoToday(day), "09:00", 35, "medium", 1),
      makeTask(`English practice ${Math.round(45 * factor)} min`, goals[1].id, "Learning", isoToday(day), "11:00", Math.round(45 * factor), "medium", 2),
      makeTask(`Coursera focused block ${Math.round(45 * factor)} min`, goals[1].id, "Learning", isoToday(day), "16:00", Math.round(45 * factor), "high", 3),
      makeTask("Sleep prep and phone-away routine", goals[0].id, "Wellness", isoToday(day), "22:00", 25, "medium", 6)
    );
  }

  const smartBreakdown: SmartBreakdown[] = [
    {
      goalId: goals[0].id,
      goalTitle: goals[0].title,
      specificAction: "Use a 10 minute night reset, phone-away wind down, and simple food log.",
      measurableTarget: "Complete sleep prep, wake time, diet log, and movement checklist at least 5 days this week.",
      achievableScope: energyLevel === "low" ? "Minimum version: 10 minute walk, 1 line diet log, 15 minute wind down." : "Standard version: 30-60 minute movement, diet log, and full wind down.",
      relevantReason: "A calmer routine makes learning goals easier and reduces doom scrolling.",
      timeBoundDeadline: `Review progress on ${isoToday(6)}.`
    },
    {
      goalId: goals[1].id,
      goalTitle: goals[1].title,
      specificAction: "Read, practice English, and finish Coursera lessons in separate time blocks.",
      measurableTarget: "2 articles, one English output, and one Coursera lesson block per day.",
      achievableScope: energyLevel === "low" ? "Do 15-30 minute minimum blocks if tired." : "Do 45-60 minute focused blocks.",
      relevantReason: "Daily learning compounds into course progress and better communication.",
      timeBoundDeadline: `Complete this week's planned learning blocks by ${isoToday(6)}.`
    }
  ];

  return {
    normalizedInput: text.trim(),
    detectedLanguage,
    mood,
    energyLevel,
    goals,
    smartBreakdown,
    tasks,
    habits,
    calendarEvents: tasks,
    top3: tasks.slice(1, 4).map((task) => task.title),
    dailyPlan: ["Morning: brain dump, 2 articles, English output", "Afternoon: Coursera Lesson 1-2 + 3 bullet notes", "Evening: flexible exercise, diet log, phone-away wind down"],
    weeklyPlan: ["Repeat learning habits 5 days", "Use one low-energy minimum day if needed", "Review missed tasks and reschedule without guilt"],
    monthlyPlan: ["Finish one Coursera module", "Create reading notes archive", "Lower screen time using app limits and bedtime routine"],
    yearlyMilestones: ["Complete major course/certification", "Build a stable study routine", "Prepare a portfolio of finished work"],
    bestieMessage: bestieLine(detectedLanguage, mood)
  };
}

export function buildPlannerPrompt(input: string) {
  return `You are Dump2Done, a local-first SMART planner for Bahasa Melayu, English, and Manglish with typos.
Return ONLY strict JSON. No markdown. No explanation.
Use this exact JSON schema:
{
 "mode": "plan",
 "languageStyle": "english"|"malay"|"manglish",
 "normalizedInput": string,
 "detectedMood": "great"|"okay"|"tired"|"sad"|"overwhelmed"|"stressed"|"burnout",
 "energyLevel": "high"|"medium"|"low",
 "bestieSummary": string,
 "goals": [{"id": string, "title": string, "category": "study"|"health"|"fitness"|"diet"|"sleep"|"reading"|"career"|"project"|"wellness"|"general", "priority": "low"|"medium"|"high", "deadline": "YYYY-MM-DD or empty", "reason": string, "smartBreakdown": {"specific": string, "measurable": string, "achievable": string, "relevant": string, "timeBound": string}}],
 "todayPlan": [{"title": string, "time": "HH:mm", "durationMinutes": number, "priority": "low"|"medium"|"high", "category": string, "lowEnergyAlternative": string}],
 "tomorrowPlan": [{"title": string, "time": "HH:mm", "durationMinutes": number, "priority": "low"|"medium"|"high", "category": string, "lowEnergyAlternative": string}],
 "weeklyPlan": [{"goal": string, "target": string, "frequency": string, "notes": string}],
 "monthlyPlan": [{"milestone": string, "targetDate": "YYYY-MM-DD", "successMeasure": string}],
 "yearlyMilestones": [{"milestone": string, "targetMonth": string, "successMeasure": string}],
 "habitRoutines": [{"id": string, "title": string, "frequency": "daily"|"weekly"|"custom", "target": string, "durationMinutes": number, "category": string, "lowEnergyAlternative": string}],
 "editableCalendarSchedule": [{"id": string, "title": string, "date": "YYYY-MM-DD", "startTime": "HH:mm", "durationMinutes": number, "priority": "low"|"medium"|"high", "category": string, "type": "task"|"habit"|"milestone"|"review", "recurrence": "none"|"daily"|"weekly"|"monthly", "editable": true}],
 "rescheduleSuggestions": [{"condition": string, "suggestion": string}]
}
Rules:
- Use today's date ${isoToday()}.
- If user says "sejam", use 60 minutes.
- Do not use weird durations like 48 minutes unless clearly a reduced low-energy version.
- For low energy, include full target and low-energy version.
- Distribute tasks across today, tomorrow, this week, this month, and future milestone dates.
- Daily habits must create repeated calendarEvents across at least 7 days.
- Use concrete task wording with time, target, and output. Example: "Complete Coursera Module 1, Lesson 1-2 today from 4:00 PM-5:00 PM. Target: finish 2 videos and write 3 bullet notes."
- bestieSummary must match the user's language style.
Input: ${input}`;
}

export function safeParsePlan(raw: string, input: string): PlanJSON {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<PlanJSON> & Record<string, unknown>;
    if (parsed.mode === "plan" && Array.isArray(parsed.editableCalendarSchedule)) {
      return convertPlanModeSchema(parsed, input);
    }
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.habits) || !Array.isArray(parsed.goals)) {
      return fallbackPlan(input);
    }
    const fallback = fallbackPlan(input);
    return {
      ...fallback,
      ...parsed,
      detectedLanguage: parsed.detectedLanguage ?? fallback.detectedLanguage,
      mood: parsed.mood ?? fallback.mood,
      energyLevel: parsed.energyLevel ?? fallback.energyLevel,
      smartBreakdown: parsed.smartBreakdown ?? fallback.smartBreakdown,
      calendarEvents: parsed.calendarEvents?.length ? parsed.calendarEvents : parsed.tasks
    } as PlanJSON;
  } catch {
    return fallbackPlan(input);
  }
}

function titleCaseLanguage(value: unknown): PlanJSON["detectedLanguage"] {
  if (value === "malay") return "Malay";
  if (value === "manglish") return "Manglish";
  return "English";
}

function convertPlanModeSchema(parsed: Record<string, unknown>, input: string): PlanJSON {
  const fallback = fallbackPlan(input);
  const language = titleCaseLanguage(parsed.languageStyle);
  const mood = (parsed.detectedMood as Mood) || fallback.mood;
  const rawGoals = Array.isArray(parsed.goals) ? parsed.goals as Array<Record<string, unknown>> : [];
  const goals: Goal[] = rawGoals.map((goal, index) => ({
    id: String(goal.id || uid("goal")),
    title: String(goal.title || `Goal ${index + 1}`),
    category: String(goal.category || "general"),
    priority: (goal.priority as Goal["priority"]) || "medium",
    progress: 0,
    milestones: [String(goal.reason || "Keep this goal visible")]
  }));

  const smartBreakdown: SmartBreakdown[] = rawGoals.map((goal, index) => {
    const smart = (goal.smartBreakdown || {}) as Record<string, unknown>;
    return {
      goalId: String(goal.id || goals[index]?.id || uid("goal")),
      goalTitle: String(goal.title || goals[index]?.title || "Goal"),
      specificAction: String(smart.specific || "Define the next concrete action."),
      measurableTarget: String(smart.measurable || "Track completion clearly."),
      achievableScope: String(smart.achievable || "Keep the task realistic."),
      relevantReason: String(smart.relevant || goal.reason || "Supports the user's goal."),
      timeBoundDeadline: String(smart.timeBound || goal.deadline || "Review this week.")
    };
  });

  const rawEvents = Array.isArray(parsed.editableCalendarSchedule) ? parsed.editableCalendarSchedule as Array<Record<string, unknown>> : [];
  const tasks: Task[] = rawEvents.map((event, index) => ({
    id: String(event.id || uid("event")),
    title: String(event.title || `Scheduled task ${index + 1}`),
    goalId: goals[0]?.id,
    category: String(event.category || "general"),
    date: String(event.date || isoToday(index > 0 ? index : 0)),
    time: String(event.startTime || "09:00"),
    durationMinutes: Number(event.durationMinutes || 30),
    priority: (event.priority as Task["priority"]) || "medium",
    done: false,
    pastel: pastel[index % pastel.length]
  }));

  const rawHabits = Array.isArray(parsed.habitRoutines) ? parsed.habitRoutines as Array<Record<string, unknown>> : [];
  const habits: Habit[] = rawHabits.map((habit) => ({
    id: String(habit.id || uid("habit")),
    title: String(habit.title || "Habit"),
    icon: "sparkle",
    target: String(habit.target || `${habit.durationMinutes || 10} minutes`),
    frequency: (habit.frequency as Habit["frequency"]) || "daily",
    category: String(habit.category || "general"),
    streak: 0,
    logs: { [isoToday()]: false }
  }));

  const weeklyPlan = Array.isArray(parsed.weeklyPlan)
    ? (parsed.weeklyPlan as Array<Record<string, unknown>>).map((item) => `${item.goal || "Goal"}: ${item.target || ""} ${item.frequency ? `(${item.frequency})` : ""}`.trim())
    : fallback.weeklyPlan;
  const monthlyPlan = Array.isArray(parsed.monthlyPlan)
    ? (parsed.monthlyPlan as Array<Record<string, unknown>>).map((item) => `${item.milestone || "Milestone"} by ${item.targetDate || "this month"}: ${item.successMeasure || ""}`.trim())
    : fallback.monthlyPlan;
  const yearlyMilestones = Array.isArray(parsed.yearlyMilestones)
    ? (parsed.yearlyMilestones as Array<Record<string, unknown>>).map((item) => `${item.targetMonth || "Future"}: ${item.milestone || "Milestone"} - ${item.successMeasure || ""}`.trim())
    : fallback.yearlyMilestones;

  return {
    normalizedInput: String(parsed.normalizedInput || input),
    detectedLanguage: language,
    mood,
    energyLevel: (parsed.energyLevel as PlanJSON["energyLevel"]) || fallback.energyLevel,
    goals: goals.length ? goals : fallback.goals,
    smartBreakdown: smartBreakdown.length ? smartBreakdown : fallback.smartBreakdown,
    tasks: tasks.length ? tasks : fallback.tasks,
    habits: habits.length ? habits : fallback.habits,
    calendarEvents: tasks.length ? tasks : fallback.calendarEvents,
    top3: tasks.slice(0, 3).map((task) => task.title),
    dailyPlan: Array.isArray(parsed.todayPlan) ? (parsed.todayPlan as Array<Record<string, unknown>>).map((item) => `${item.time || ""} ${item.title || ""}`.trim()) : fallback.dailyPlan,
    weeklyPlan,
    monthlyPlan,
    yearlyMilestones,
    bestieMessage: String(parsed.bestieSummary || fallback.bestieMessage)
  };
}

export function crisisDetected(text: string) {
  return /(kill myself|suicide|bunuh diri|mati je|harm myself|cederakan diri|self harm|nak mati)/i.test(text);
}
