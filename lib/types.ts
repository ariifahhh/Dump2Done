export type Mode = "reset" | "busy" | "lowEnergy" | "focus";

export type Mood = "great" | "okay" | "tired" | "sad" | "overwhelmed" | "stressed" | "burnout";

export type Goal = {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  progress: number;
  milestones: string[];
};

export type Task = {
  id: string;
  title: string;
  goalId?: string;
  category: string;
  date: string;
  time: string;
  durationMinutes: number;
  priority: "high" | "medium" | "low";
  done: boolean;
  pastel: string;
};

export type Habit = {
  id: string;
  title: string;
  icon: string;
  target: string;
  frequency: "daily" | "weekly" | "custom";
  category: string;
  streak: number;
  logs: Record<string, boolean>;
};

export type SmartBreakdown = {
  goalId: string;
  goalTitle: string;
  specificAction: string;
  measurableTarget: string;
  achievableScope: string;
  relevantReason: string;
  timeBoundDeadline: string;
};

export type BrainDump = {
  id: string;
  text: string;
  createdAt: string;
  mood: Mood;
};

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type PlanJSON = {
  normalizedInput: string;
  detectedLanguage: "English" | "Malay" | "Manglish";
  mood: Mood;
  energyLevel: "high" | "medium" | "low";
  goals: Goal[];
  smartBreakdown: SmartBreakdown[];
  tasks: Task[];
  habits: Habit[];
  calendarEvents: Task[];
  top3: string[];
  dailyPlan: string[];
  weeklyPlan: string[];
  monthlyPlan: string[];
  yearlyMilestones: string[];
  bestieMessage: string;
};
