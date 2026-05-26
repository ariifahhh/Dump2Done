import { crisisDetected, detectEnergyLevel, detectLanguageStyle, detectMood, mapMoodToMascot } from "@/lib/ai";
import { NextResponse } from "next/server";

type BestieContext = {
  message?: string;
  chatHistory?: Array<{ role?: string; content?: string }>;
  todayTasks?: Array<{ title: string; done?: boolean; time?: string; category?: string }>;
  missedTasks?: Array<{ title: string; date?: string; time?: string; category?: string }>;
  habits?: Array<{ title: string; target?: string; streak?: number }>;
  currentMood?: string;
  activePlan?: unknown;
  calendarEvents?: Array<{ title: string; date?: string; time?: string; done?: boolean; category?: string }>;
  model?: string;
};

function tinyActions(body: BestieContext) {
  const missed = body.missedTasks?.[0];
  const next = body.todayTasks?.find((task) => !task.done) ?? body.calendarEvents?.find((task) => !task.done);
  if (missed) {
    return [
      { title: `Open ${missed.title}`, durationMinutes: 5, reason: "Restart without pressure" },
      { title: "Move it to a realistic slot", durationMinutes: 3, reason: "Reduce guilt and make it actionable" }
    ];
  }
  if (next) return [{ title: next.title, durationMinutes: 10, reason: "Small first step from today's plan" }];
  return [{ title: "Brain dump 3 lines", durationMinutes: 5, reason: "Clear the mental noise first" }];
}

function fallback(body: BestieContext) {
  const message = body.message ?? "";
  const detectedLanguage = detectLanguageStyle(message);
  const detectedMood = detectMood(`${message} ${body.currentMood ?? ""}`);
  const energyLevel = detectEnergyLevel(`${message} ${body.currentMood ?? ""}`);
  const suggestedActions = tinyActions(body);
  const missed = body.missedTasks?.[0];
  const next = suggestedActions[0];
  const rescheduleNeeded = Boolean(missed || /miss|missed|tak buat|procrastinat|tertangguh|lambat/i.test(message));
  const rescheduleSuggestion = missed
    ? `Move "${missed.title}" to tomorrow at 4:00 PM or do a 10 minute reset tonight.`
    : "Reduce today's workload to one tiny action and move the rest to tomorrow.";

  let reply: string;
  if (crisisDetected(message)) {
    reply = "I'm really sorry it feels this heavy. I'm not a therapist, but this sounds urgent. Please contact emergency support or someone you trust now, and stay near a safe person while you get help.";
  } else if (detectedLanguage === "malay") {
    reply = `Mas, rasa ${detectedMood} tu valid. Kita tak payah paksa diri jadi productive sangat. Buat kecil je: ${next.title} selama ${next.durationMinutes} minit. ${rescheduleNeeded ? "Kalau tak larat, kita shift task yang missed ke esok tanpa marah diri." : "Lepas tu rehat sekejap."} You are not failing.`;
  } else if (detectedLanguage === "manglish") {
    reply = `Takpe bestie, rasa ${detectedMood} tu valid. Kita repair plan, bukan marah diri. Start dengan "${next.title}" ${next.durationMinutes} minit je. ${rescheduleNeeded ? rescheduleSuggestion : "Small win pun still win."}`;
  } else {
    reply = `That ${detectedMood} feeling is valid. Let's make this smaller: do "${next.title}" for ${next.durationMinutes} minutes. ${rescheduleNeeded ? rescheduleSuggestion : "After that, pause and decide the next tiny step."}`;
  }

  return {
    mode: "bestie",
    reply,
    detectedLanguage,
    detectedMood,
    energyLevel,
    mascotMood: mapMoodToMascot(detectedMood),
    suggestedActions,
    rescheduleNeeded,
    rescheduleSuggestion
  };
}

function prompt(body: BestieContext) {
  return `You are Dump2Done BESTIE MODE, a gentle best friend, accountability buddy, and soft productivity coach.
Return ONLY strict JSON:
{"mode":"bestie","reply":"string","detectedLanguage":"english|malay|manglish","detectedMood":"great|okay|tired|sad|overwhelmed|stressed|burnout","energyLevel":"low|medium|high","mascotMood":"happy|neutral|sleepy|sad|anxious|frustrated|burnout","suggestedActions":[{"title":"string","durationMinutes":5,"reason":"string"}],"rescheduleNeeded":true,"rescheduleSuggestion":"string"}
Rules: reply in the same language style as the user; use real tasks, missed tasks, habits, mood, active plan, and calendar; validate feeling; mention context; suggest 1-3 tiny next steps; offer reschedule/reduce workload; avoid generic replies; do not pretend to be a therapist; handle self-harm with immediate support and safety.
Context: ${JSON.stringify(body)}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as BestieContext;
  if (!body.message?.trim() || crisisDetected(body.message)) return NextResponse.json(fallback(body));
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: body.model ?? "qwen3:4b",
        stream: false,
        format: "json",
        prompt: prompt(body),
        options: { temperature: 0.65 }
      })
    });
    if (!response.ok) return NextResponse.json(fallback(body));
    const data = (await response.json()) as { response?: string };
    const parsed = JSON.parse((data.response ?? "").replace(/```json|```/g, "").trim());
    return NextResponse.json({ ...fallback(body), ...parsed });
  } catch {
    return NextResponse.json(fallback(body));
  }
}
