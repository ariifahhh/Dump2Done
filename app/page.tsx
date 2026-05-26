"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckSquare,
  Clock,
  Flame,
  GraduationCap,
  Heart,
  Home,
  MessageCircle,
  Moon,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Sun,
  Target,
  Dumbbell,
  Apple
} from "lucide-react";
import { uid } from "@/lib/ai";
import { isoToday, shortDate, weekDays, weekday } from "@/lib/date";
import { useDumpStore } from "@/lib/store";
import type { AIMessage, Mood, PlanJSON, Task } from "@/lib/types";

const pages = [
  { id: "dashboard", label: "Today", icon: Home },
  { id: "planner", label: "Plan", icon: Brain },
  { id: "calendar", label: "Schedule", icon: CalendarDays },
  { id: "habits", label: "Habits", icon: Heart },
  { id: "goals", label: "Goals", icon: Target },
  { id: "chat", label: "Bestie", icon: MessageCircle }
];

const moodOptions: Array<{ id: Mood; label: string; face: string; hint: string }> = [
  { id: "great", label: "Great", face: "happy", hint: "Full plan" },
  { id: "okay", label: "Okay", face: "soft", hint: "Normal load" },
  { id: "tired", label: "Tired", face: "sleepy", hint: "Light load" },
  { id: "sad", label: "Sad", face: "sad", hint: "Gentle load" },
  { id: "overwhelmed", label: "Overwhelmed", face: "dizzy", hint: "Top 1-2" },
  { id: "stressed", label: "Stressed", face: "stress", hint: "Short blocks" },
  { id: "burnout", label: "Burnout", face: "melt", hint: "Reset mode" }
];

type AISpeedMode = "fast" | "balanced" | "quality";

function getSpeedMode(): AISpeedMode {
  if (typeof window === "undefined") return "fast";
  const saved = window.localStorage.getItem("dump2done-ai-speed");
  return saved === "balanced" || saved === "quality" ? saved : "fast";
}

function SpeedModeControl({ value, onChange }: { value: AISpeedMode; onChange: (mode: AISpeedMode) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border-3 border-[var(--pixel-black)] bg-white/70 p-2">
      <span className="mr-1 font-mono text-sm">AI Speed:</span>
      {(["fast", "balanced", "quality"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`rounded-lg border-2 border-[var(--pixel-black)] px-2 py-1 font-mono text-sm ${value === mode ? "bg-[var(--sage-green)]" : "bg-white"}`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { activeView, setView, hydrate } = useDumpStore();

  useEffect(() => {
    void hydrate();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--pixel-black)]">
      <div className="hidden min-h-screen lg:flex">
        <DesktopShell active={activeView} setView={setView} />
      </div>
      <div className="min-h-screen pb-24 lg:hidden">
        <MobileShell active={activeView} setView={setView} />
      </div>
    </main>
  );
}

function DesktopShell({ active, setView }: { active: string; setView: (view: string) => void }) {
  return (
    <>
      <aside className="flex h-screen w-72 flex-col border-r-4 border-[var(--pixel-black)] bg-white">
        <div className="border-b-4 border-[var(--pixel-black)] bg-[var(--sage-green)] p-6">
          <div className="flex items-center gap-3">
            <Mascot size="sm" />
            <div>
              <h1 className="font-pixel text-lg">Dump2Done</h1>
              <p className="font-mono text-xs">Dump it. Plan it. Done.</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {pages.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl border-3 border-[var(--pixel-black)] px-4 py-3 text-left transition-all ${
                  active === item.id
                    ? "bg-[var(--sage-green)] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]"
                    : "bg-[var(--cream)] hover:bg-[var(--soft-mint)]"
                }`}
              >
                <Icon size={18} strokeWidth={2.8} />
                <span className="font-mono text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t-4 border-[var(--pixel-black)] bg-[var(--lavender)] p-4">
          <div className="rounded-xl border-3 border-[var(--pixel-black)] bg-white p-4 text-center shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]">
            <Mascot />
            <p className="mt-2 font-pixel text-[10px]">Your AI Bestie</p>
            <p className="font-mono text-xs text-[var(--muted-foreground)]">Always here to help.</p>
          </div>
        </div>
      </aside>
      <section className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          <DesktopHeader active={active} />
          <PageContent active={active} />
        </div>
      </section>
    </>
  );
}

function MobileShell({ active, setView }: { active: string; setView: (view: string) => void }) {
  return (
    <>
      <PageContent active={active} mobile />
      <nav className="fixed bottom-2 left-2 right-2 z-20 grid grid-cols-5 gap-1 rounded-2xl border-4 border-[var(--pixel-black)] bg-white p-2 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]">
        {pages.filter((page) => page.id !== "goals").map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setView(item.id)} className={`rounded-xl p-2 ${active === item.id ? "bg-[var(--sage-green)]" : ""}`}>
              <Icon className="mx-auto" size={20} strokeWidth={2.8} />
              <span className="block truncate font-mono text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function DesktopHeader({ active }: { active: string }) {
  const title = pages.find((page) => page.id === active)?.label ?? "Overview";
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <h2 className="font-pixel text-3xl">{title === "Today" ? "Overview" : title}</h2>
        <Sparkles size={24} className="text-[var(--sage-green)]" fill="var(--sage-green)" />
      </div>
      <p className="mt-1 font-mono text-lg text-[var(--muted-foreground)]">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
    </header>
  );
}

function MobileHeader({ icon: Icon, title, subtitle, color }: { icon: typeof Brain; title: string; subtitle: string; color: string }) {
  return (
    <header className="px-4 pb-6 pt-8">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-3 border-[var(--pixel-black)] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]" style={{ background: color }}>
          <Icon size={22} strokeWidth={2.8} />
        </div>
        <h1 className="font-pixel text-2xl">{title}</h1>
      </div>
      <p className="font-mono text-sm text-[var(--muted-foreground)]">{subtitle}</p>
    </header>
  );
}

function PageContent({ active, mobile = false }: { active: string; mobile?: boolean }) {
  if (active === "planner") return <Planner mobile={mobile} />;
  if (active === "calendar") return <Schedule mobile={mobile} />;
  if (active === "habits") return <Habits mobile={mobile} />;
  if (active === "goals") return <Goals mobile={mobile} />;
  if (active === "chat") return <Chat mobile={mobile} />;
  return <Dashboard mobile={mobile} />;
}

function Dashboard({ mobile }: { mobile?: boolean }) {
  const { tasks, habits, mood, setMood, bestieMessage, dumps, toggleTask, toggleHabit, setView } = useDumpStore();
  const todayTasks = tasks.filter((task) => task.date === isoToday()).slice(0, 3);
  const done = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className={mobile ? "px-4" : ""}>
      {mobile && (
        <header className="px-0 pb-6 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-pixel text-2xl">Dump2Done</h1>
              <p className="font-mono text-sm text-[var(--muted-foreground)]">Dump it. Plan it. Done.</p>
            </div>
            <Mascot size="sm" />
          </div>
        </header>
      )}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <PixelCard title="Top 3 Tasks" icon={CheckSquare} color="var(--card-pink)">
          {todayTasks.length ? <TaskRows tasks={todayTasks} onToggle={toggleTask} /> : <Empty label="0 tasks yet. Brain dump first." />}
        </PixelCard>
        <PixelCard title="Weekly Progress" icon={BarChart3} color="var(--card-green)">
          <div className="font-pixel text-3xl">{done} / {tasks.length}</div>
          <ProgressBar value={progress} />
          <p className="font-mono text-base">{progress}% done</p>
        </PixelCard>
        <PixelCard title="Mood Check-in" icon={Sparkles} color="var(--card-yellow)">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {moodOptions.map((item) => (
              <button key={item.id} onClick={() => setMood(item.id)} className={`rounded-xl border-3 border-[var(--pixel-black)] bg-white p-2 text-left shadow-[2px_2px_0px_0px_rgba(45,45,45,1)] ${mood === item.id ? "ring-4 ring-[var(--sage-green)]" : ""}`}>
                <span className={`pixel-face ${item.face}`} />
                <span className="block font-mono text-base">{item.label}</span>
                <span className="block font-mono text-xs text-[var(--muted-foreground)]">{item.hint}</span>
              </button>
            ))}
          </div>
        </PixelCard>
        <PixelCard title="Habit Streaks" icon={Flame} color="var(--card-green)">
          {habits.length ? (
            <div className="space-y-2">
              {habits.slice(0, 4).map((habit) => (
                <button key={habit.id} onClick={() => toggleHabit(habit.id)} className="flex w-full items-center justify-between rounded-lg border-2 border-[var(--pixel-black)] bg-white/70 p-2 font-mono text-base">
                  <span>{habit.title}</span>
                  <span>{habit.streak}</span>
                </button>
              ))}
            </div>
          ) : <Empty label="0 habits tracked." />}
        </PixelCard>
        <PixelCard title="Recent Dumps" icon={Brain} color="var(--lavender)">
          {dumps.length ? (
            <div className="space-y-2">
              {dumps.slice(0, 3).map((dump) => <div key={dump.id} className="rounded-lg border-2 border-[var(--pixel-black)] bg-white/70 p-2 font-mono text-sm">{dump.text.slice(0, 90)}</div>)}
            </div>
          ) : <Empty label="0 brain dumps saved." />}
        </PixelCard>
        <PixelCard title="AI Bestie Says" icon={MessageCircle} color="var(--lavender)">
          <div className="flex gap-3">
            <Mascot size="sm" />
            <p className="rounded-xl border-2 border-[var(--pixel-black)] bg-white p-3 font-mono text-base">{bestieMessage || "No AI note yet. Dump something and I'll help susun."}</p>
          </div>
          <button onClick={() => setView("chat")} className="mt-3 pixel-button px-4 py-2 font-pixel text-[10px]">Open Chat</button>
        </PixelCard>
        <PixelCard title="Quick Dump" icon={Brain} color="white">
          <button onClick={() => setView("planner")} className="w-full rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--cream)] p-4 text-left font-mono text-lg">
            Type messy thoughts and let AI organize goals, habits, and schedule.
          </button>
        </PixelCard>
        <PixelCard title="Focus Timer" icon={Clock} color="white">
          <FocusTimer />
        </PixelCard>
      </div>
    </div>
  );
}

function Planner({ mobile }: { mobile?: boolean }) {
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<PlanJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [speedMode, setSpeedMode] = useState<AISpeedMode>("fast");
  const applyPlan = useDumpStore((state) => state.applyPlan);

  useEffect(() => {
    setSpeedMode(getSpeedMode());
  }, []);

  function updateSpeedMode(mode: AISpeedMode) {
    setSpeedMode(mode);
    window.localStorage.setItem("dump2done-ai-speed", mode);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/ai/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, speedMode })
    });
    const data = (await response.json()) as PlanJSON;
    setPlan(data);
    setLoading(false);
  }

  function updatePreviewTask(id: string, patch: Partial<Task>) {
    setPlan((current) => {
      if (!current) return current;
      const update = (task: Task) => (task.id === id ? { ...task, ...patch } : task);
      return {
        ...current,
        tasks: current.tasks.map(update),
        calendarEvents: current.calendarEvents.map(update)
      };
    });
  }

  return (
    <div className={mobile ? "px-4" : ""}>
      {mobile && <MobileHeader icon={Brain} title="Brain Dump" subtitle="Mix BM, English, Manglish, typos ok." color="var(--lavender)" />}
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border-4 border-[var(--pixel-black)] bg-[var(--card-yellow)] p-5 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]">
          <h3 className="mb-3 flex items-center gap-2 font-pixel text-sm">Type Everything <Sparkles size={14} /></h3>
          <div className="mb-3">
            <SpeedModeControl value={speedMode} onChange={updateSpeedMode} />
          </div>
          <form onSubmit={submit} className="space-y-4">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="i nak diet, kurang screen time, baca medium 2 sehari, practice english sejam..."
              className="h-56 w-full resize-none rounded-xl border-3 border-[var(--pixel-black)] bg-white p-4 font-mono text-lg outline-none"
            />
            <button disabled={!input.trim() || loading} className="w-full rounded-xl border-4 border-[var(--pixel-black)] bg-[var(--sage-green)] py-4 font-pixel text-xs shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] disabled:opacity-60">
              {loading ? "AI is planning..." : "Let AI Plan This"}
            </button>
          </form>
        </section>
        <section className="rounded-2xl border-4 border-[var(--pixel-black)] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]">
          <h3 className="mb-4 font-pixel text-sm">Your Plan</h3>
          {loading && <PlanningBubble />}
          {!loading && !plan && <Empty label="0 plan yet. Generate one from a brain dump." />}
          {plan && (
            <div className="space-y-4">
              <p className="rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--lavender)] p-3 font-mono text-lg">{plan.bestieMessage}</p>
              <PlanList title="Goals" items={plan.goals.map((goal) => goal.title)} />
              <PlanList title="Today Plan" items={plan.dailyPlan} />
              <PlanList title="This Week" items={plan.weeklyPlan} />
              <PlanList title="This Month" items={plan.monthlyPlan} />
              <PlanList title="This Year Milestones" items={plan.yearlyMilestones} />
              <EditableTasks tasks={plan.calendarEvents.slice(0, 10)} onChange={updatePreviewTask} />
              <button onClick={() => applyPlan(input, plan)} className="w-full rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--blush-pink)] py-3 font-pixel text-xs shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]">Save To Plan</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Schedule({ mobile }: { mobile?: boolean }) {
  const { tasks, toggleTask, moveTask } = useDumpStore();
  const [dragged, setDragged] = useState<string | null>(null);
  const days = weekDays();

  return (
    <div className={mobile ? "px-4" : ""}>
      {mobile && <MobileHeader icon={CalendarDays} title="Schedule" subtitle="Your smart weekly plan." color="var(--blush-pink)" />}
      <div className="rounded-2xl border-4 border-[var(--pixel-black)] bg-white p-4 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]">
        <div className="mb-4 grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div key={day} className={`rounded-lg border-3 border-[var(--pixel-black)] p-2 text-center ${index === 0 ? "bg-[var(--sage-green)] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]" : "bg-[var(--cream)]"}`}>
              <div className="font-pixel text-[9px]">{weekday(day)}</div>
              <div className="font-mono text-xs">{shortDate(day).replace(/[A-Za-z]+ /, "")}</div>
            </div>
          ))}
        </div>
        <div className="mb-4 flex gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--sage-green)] py-3 font-pixel text-[10px] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]"><Plus size={16} /> Add</button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--blush-pink)] py-3 font-pixel text-[10px] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]"><RefreshCw size={16} /> Reschedule</button>
        </div>
        <div className="grid gap-3 lg:grid-cols-7">
          {days.map((day) => (
            <div key={day} onDragOver={(event) => event.preventDefault()} onDrop={() => dragged && moveTask(dragged, day)} className="min-h-32 rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--cream)] p-2">
              <div className="mb-2 font-pixel text-[9px]">{weekday(day)}</div>
              <div className="space-y-2">
                {tasks.filter((task) => task.date === day).map((task) => (
                  <TaskBlock key={task.id} task={task} onToggle={toggleTask} onDrag={() => setDragged(task.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {!tasks.length && <div className="mt-4"><Empty label="0 scheduled tasks." /></div>}
      </div>
    </div>
  );
}

function Habits({ mobile }: { mobile?: boolean }) {
  const { habits, toggleHabit } = useDumpStore();
  const iconMap = [BookOpen, MessageCircle, GraduationCap, Moon, Sun, Dumbbell, Apple, Brain];

  return (
    <div className={mobile ? "px-4" : ""}>
      {mobile && <MobileHeader icon={Heart} title="Habits" subtitle="Build your daily streaks." color="var(--blush-pink)" />}
      <div className="space-y-3">
        {!habits.length && <PixelCard title="Habit Tracker" icon={Heart} color="var(--card-green)"><Empty label="0 habits. Generate a plan to create habits." /></PixelCard>}
        {habits.map((habit, index) => {
          const Icon = iconMap[index % iconMap.length];
          const done = habit.logs[isoToday()];
          return (
            <button key={habit.id} onClick={() => toggleHabit(habit.id)} className="flex w-full items-center justify-between rounded-xl border-4 border-[var(--pixel-black)] bg-white p-3 text-left shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border-3 border-[var(--pixel-black)] bg-[var(--soft-mint)] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]"><Icon size={20} /></div>
                <div>
                  <h4 className="font-mono text-lg">{habit.title}</h4>
                  <p className="font-mono text-xs text-[var(--muted-foreground)]">{habit.target}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded border-2 border-[var(--pixel-black)] bg-[var(--peach)] px-2 font-mono text-sm">{habit.streak}</span>
                <span className={`grid h-8 w-8 place-items-center rounded-lg border-3 border-[var(--pixel-black)] ${done ? "bg-[var(--sage-green)]" : "bg-white"}`}>{done ? "ok" : ""}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Goals({ mobile }: { mobile?: boolean }) {
  const goals = useDumpStore((state) => state.goals);
  return (
    <div className={mobile ? "px-4" : ""}>
      {mobile && <MobileHeader icon={Target} title="Goals" subtitle="Milestones and linked progress." color="var(--lavender)" />}
      <div className="grid gap-4 lg:grid-cols-2">
        {!goals.length && <PixelCard title="Goals" icon={Target} color="var(--lavender)"><Empty label="0 goals. Save your first AI plan." /></PixelCard>}
        {goals.map((goal) => (
          <PixelCard key={goal.id} title={goal.category} icon={Target} color={goal.priority === "high" ? "var(--card-pink)" : "var(--lavender)"}>
            <h3 className="font-mono text-2xl">{goal.title}</h3>
            <ProgressBar value={goal.progress} />
            <ul className="mt-3 space-y-2 font-mono text-base">
              {goal.milestones.map((milestone) => <li key={milestone}>- {milestone}</li>)}
            </ul>
          </PixelCard>
        ))}
      </div>
    </div>
  );
}

function Chat({ mobile }: { mobile?: boolean }) {
  const { messages, addMessage, tasks, habits, mood } = useDumpStore();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [speedMode, setSpeedMode] = useState<AISpeedMode>("fast");

  useEffect(() => {
    setSpeedMode(getSpeedMode());
  }, []);

  function updateSpeedMode(mode: AISpeedMode) {
    setSpeedMode(mode);
    window.localStorage.setItem("dump2done-ai-speed", mode);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    const userMessage: AIMessage = { id: uid("msg"), role: "user", content: message, createdAt: new Date().toISOString() };
    addMessage(userMessage);
    setMessage("");
    setLoading(true);
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage.content,
        speedMode,
        context: {
          mood,
          tasks: tasks.slice(0, 5).map((task) => ({ title: task.title, date: task.date, time: task.time, done: task.done, category: task.category })),
          missedTasks: tasks.filter((task) => task.date < isoToday() && !task.done).slice(0, 3).map((task) => ({ title: task.title, date: task.date, time: task.time, category: task.category })),
          habits: habits.slice(0, 7).map((habit) => ({ title: habit.title, target: habit.target, streak: habit.streak })),
          chatHistory: messages.slice(-6).map((item) => ({ role: item.role, content: item.content }))
        }
      })
    });
    const data = (await response.json()) as { reply: string };
    addMessage({ id: uid("msg"), role: "assistant", content: data.reply, createdAt: new Date().toISOString() });
    setLoading(false);
  }

  return (
    <div className={mobile ? "flex min-h-screen flex-col" : ""}>
      {mobile && (
        <div className="border-b-4 border-[var(--pixel-black)] bg-[var(--sage-green)] px-4 pb-6 pt-8">
          <div className="flex items-center gap-3"><Mascot size="sm" /><div><h1 className="font-pixel text-xl">AI Bestie</h1><p className="font-mono text-sm">Always here for you</p></div></div>
        </div>
      )}
      <section className={`${mobile ? "flex-1 px-4 py-6" : ""} rounded-2xl border-4 border-[var(--pixel-black)] bg-[var(--cream)] p-4 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]`}>
        <div className="mb-3">
          <SpeedModeControl value={speedMode} onChange={updateSpeedMode} />
        </div>
        <div className="max-h-[58vh] space-y-4 overflow-auto">
          {!messages.length && <Empty label="0 chat messages. Say hi to AI Bestie." />}
          {messages.map((item) => (
            <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[80%] rounded-2xl border-3 border-[var(--pixel-black)] p-4 font-mono text-lg shadow-[2px_2px_0px_0px_rgba(45,45,45,1)] ${item.role === "user" ? "bg-[var(--lavender)]" : "bg-white"}`}>{item.content}</p>
            </div>
          ))}
          {loading && <p className="font-mono text-lg">Bestie is typing...</p>}
        </div>
        <form onSubmit={send} className="mt-4 flex gap-3 rounded-2xl border-4 border-[var(--pixel-black)] bg-white p-3 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]">
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." className="min-w-0 flex-1 bg-transparent font-mono text-lg outline-none" />
          <button className="grid h-10 w-10 place-items-center rounded-lg border-3 border-[var(--pixel-black)] bg-[var(--sage-green)] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]"><Send size={16} /></button>
        </form>
      </section>
    </div>
  );
}

function PixelCard({ title, icon: Icon, color, children }: { title: string; icon: typeof Brain; color: string; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border-4 border-[var(--pixel-black)] p-5 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]" style={{ background: color }}>
      <Star className="absolute right-3 top-3 opacity-25" size={20} fill="currentColor" />
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} strokeWidth={3} />
        <h3 className="font-pixel text-sm">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TaskRows({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <button key={task.id} onClick={() => onToggle(task.id)} className="flex w-full items-center gap-3 rounded-lg border-2 border-[var(--pixel-black)] bg-white/70 p-2 text-left">
          <span className={`h-5 w-5 rounded border-3 border-[var(--pixel-black)] ${task.done ? "bg-[var(--sage-green)]" : "bg-white"}`} />
          <span className={`flex-1 font-mono text-lg ${task.done ? "line-through" : ""}`}>{task.title}</span>
          <span className="font-mono text-sm">{task.time}</span>
        </button>
      ))}
    </div>
  );
}

function TaskBlock({ task, onToggle, onDrag }: { task: Task; onToggle: (id: string) => void; onDrag: () => void }) {
  return (
    <div draggable onDragStart={onDrag} onDoubleClick={() => onToggle(task.id)} className="cursor-move rounded-lg border-3 border-[var(--pixel-black)] p-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]" style={{ backgroundColor: task.pastel }}>
      <div className={task.done ? "line-through" : ""}>{task.title}</div>
      <div className="text-xs">{task.time} - {task.durationMinutes}m</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border-3 border-dashed border-[var(--pixel-black)] bg-white/60 p-4 text-center">
      <div className="font-pixel text-2xl">0</div>
      <p className="font-mono text-lg">{label}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="my-3 h-5 rounded-full border-3 border-[var(--pixel-black)] bg-white">
      <div className="h-full rounded-full bg-[var(--sage-green)]" style={{ width: `${value}%` }} />
    </div>
  );
}

function PlanList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-2 font-pixel text-[10px] uppercase text-[var(--muted-foreground)]">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => <div key={item} className="rounded-lg border-2 border-[var(--pixel-black)] bg-[var(--card-green)] px-3 py-2 font-mono text-base">- {item}</div>)}
      </div>
    </div>
  );
}

function EditableTasks({ tasks, onChange }: { tasks: Task[]; onChange: (id: string, patch: Partial<Task>) => void }) {
  return (
    <div>
      <h4 className="mb-2 font-pixel text-[10px] uppercase text-[var(--muted-foreground)]">Editable Calendar Schedule</h4>
      <div className="max-h-80 space-y-2 overflow-auto pr-1">
        {tasks.map((task) => (
          <div key={task.id} className="grid gap-2 rounded-xl border-2 border-[var(--pixel-black)] bg-white p-2 font-mono text-sm md:grid-cols-[1fr_120px_90px_80px]">
            <input value={task.title} onChange={(event) => onChange(task.id, { title: event.target.value })} className="rounded border-2 border-[var(--pixel-black)] px-2" />
            <input type="date" value={task.date} onChange={(event) => onChange(task.id, { date: event.target.value })} className="rounded border-2 border-[var(--pixel-black)] px-2" />
            <input type="time" value={task.time} onChange={(event) => onChange(task.id, { time: event.target.value })} className="rounded border-2 border-[var(--pixel-black)] px-2" />
            <input type="number" min={5} step={5} value={task.durationMinutes} onChange={(event) => onChange(task.id, { durationMinutes: Number(event.target.value) })} className="rounded border-2 border-[var(--pixel-black)] px-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanningBubble() {
  return (
    <div className="rounded-2xl border-4 border-[var(--pixel-black)] bg-[var(--lavender)] p-6 text-center shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]">
      <div className="mx-auto mb-4"><Mascot /></div>
      <h3 className="font-pixel text-sm">AI is planning...</h3>
      <p className="mt-2 font-mono text-base">Organizing goals, tasks, habits, and schedule.</p>
    </div>
  );
}

function Mascot({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className={`${size === "sm" ? "h-12 w-12" : "mx-auto h-16 w-16"} mascot-buddy rounded-2xl border-3 border-[var(--pixel-black)] bg-[var(--sage-green)] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]`} aria-label="Dump2Done pixel mascot">
      <span className="mascot-sprout left" />
      <span className="mascot-sprout right" />
      <span className="mascot-ear left" />
      <span className="mascot-ear right" />
      <span className="mascot-eye left" />
      <span className="mascot-eye right" />
      <span className="mascot-cheek left" />
      <span className="mascot-cheek right" />
      <span className="mascot-mouth" />
    </div>
  );
}

function FocusTimer() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  const label = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);
  return (
    <div className="text-center">
      <div className="mb-4 font-pixel text-4xl">{label}</div>
      <button onClick={() => setRunning((value) => !value)} className="w-full rounded-xl border-3 border-[var(--pixel-black)] bg-[var(--sage-green)] py-3 font-pixel text-xs shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]">{running ? "Pause" : "Start"}</button>
    </div>
  );
}
