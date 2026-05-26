"use client";

import { create } from "zustand";
import { uid } from "@/lib/ai";
import { loadLocalState, saveLocalState } from "@/lib/idb";
import { isoToday } from "@/lib/date";
import type { AIMessage, BrainDump, Goal, Habit, Mode, Mood, PlanJSON, Task } from "@/lib/types";

type Dump2DoneState = {
  hydrated: boolean;
  activeView: string;
  mode: Mode;
  mood: Mood;
  goals: Goal[];
  tasks: Task[];
  habits: Habit[];
  dumps: BrainDump[];
  messages: AIMessage[];
  bestieMessage: string;
  setView: (view: string) => void;
  setMode: (mode: Mode) => void;
  setMood: (mood: Mood) => void;
  toggleTask: (id: string) => void;
  moveTask: (id: string, date: string, time?: string) => void;
  toggleHabit: (id: string) => void;
  applyPlan: (text: string, plan: PlanJSON) => void;
  addMessage: (message: AIMessage) => void;
  hydrate: () => Promise<void>;
};

function snapshot(state: Dump2DoneState) {
  return {
    activeView: state.activeView,
    mode: state.mode,
    mood: state.mood,
    goals: state.goals,
    tasks: state.tasks,
    habits: state.habits,
    dumps: state.dumps,
    messages: state.messages,
    bestieMessage: state.bestieMessage
  };
}

export const useDumpStore = create<Dump2DoneState>((set, get) => ({
  hydrated: false,
  activeView: "dashboard",
  mode: "focus",
  mood: "okay",
  goals: [],
  tasks: [],
  habits: [],
  dumps: [],
  messages: [],
  bestieMessage: "",
  setView: (activeView) => {
    set({ activeView });
    void saveLocalState(snapshot(get()));
  },
  setMode: (mode) => {
    set({ mode });
    void saveLocalState(snapshot(get()));
  },
  setMood: (mood) => {
    set({ mood });
    void saveLocalState(snapshot(get()));
  },
  toggleTask: (id) => {
    set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)) }));
    void saveLocalState(snapshot(get()));
  },
  moveTask: (id, date, time) => {
    set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? { ...task, date, time: time ?? task.time } : task)) }));
    void saveLocalState(snapshot(get()));
  },
  toggleHabit: (id) => {
    const today = isoToday();
    set((state) => ({
      habits: state.habits.map((habit) => {
        if (habit.id !== id) return habit;
        const nextValue = !habit.logs[today];
        return {
          ...habit,
          streak: Math.max(0, habit.streak + (nextValue ? 1 : -1)),
          logs: { ...habit.logs, [today]: nextValue }
        };
      })
    }));
    void saveLocalState(snapshot(get()));
  },
  applyPlan: (text, plan) => {
    set((state) => ({
      mood: plan.mood,
      goals: plan.goals,
      tasks: plan.calendarEvents?.length ? plan.calendarEvents : plan.tasks,
      habits: plan.habits,
      bestieMessage: plan.bestieMessage,
      dumps: [{ id: uid("dump"), text, createdAt: new Date().toISOString(), mood: plan.mood }, ...state.dumps].slice(0, 12),
      messages: [
        ...state.messages,
        { id: uid("msg"), role: "assistant" as const, content: plan.bestieMessage, createdAt: new Date().toISOString() }
      ].slice(-24)
    }));
    void saveLocalState(snapshot(get()));
  },
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message].slice(-40) }));
    void saveLocalState(snapshot(get()));
  },
  hydrate: async () => {
    const local = await loadLocalState<Partial<Dump2DoneState>>();
    if (local) set({ ...local, hydrated: true } as Dump2DoneState);
    else set({ hydrated: true });
  }
}));
