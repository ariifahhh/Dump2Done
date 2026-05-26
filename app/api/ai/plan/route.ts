import { buildPlannerPrompt, safeParsePlan } from "@/lib/ai";
import { NextResponse } from "next/server";

const OLLAMA_ERROR =
  "Ollama is not running or qwen3:4b is not pulled. Please run: ollama pull qwen3:4b, then ollama serve.";
const MODEL_SMART = "qwen3:4b";
const MODEL_QUALITY = "qwen3:8b";

function choosePlanModel(input: string, speedMode?: string, requestedModel?: string) {
  if (speedMode === "quality") return MODEL_QUALITY;
  if (requestedModel && requestedModel !== "qwen3:1.7b" && requestedModel !== "qwen3:0.6b") return requestedModel;
  return MODEL_SMART;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function validatePlanJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const hasOldShape = Array.isArray(parsed.tasks) && Array.isArray(parsed.habits) && Array.isArray(parsed.goals);
  const hasPlanModeShape = parsed.mode === "plan" && Array.isArray(parsed.editableCalendarSchedule) && Array.isArray(parsed.habitRoutines);
  if (!hasOldShape && !hasPlanModeShape) {
    throw new Error("Response did not match Dump2Done plan JSON schema");
  }
}

export async function POST(request: Request) {
  const { input, model, speedMode = "fast" } = (await request.json()) as { input?: string; model?: string; speedMode?: "fast" | "balanced" | "quality" };
  if (!input?.trim()) {
    return NextResponse.json({ error: true, source: "input_empty", reply: "Please type a brain dump first." }, { status: 400 });
  }

  const selectedModel = choosePlanModel(input, speedMode, model);

  try {
    const response = await fetchWithTimeout("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        prompt: buildPlannerPrompt(input),
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
          num_ctx: 4096,
          num_predict: 1200
        }
      })
    }, 60000);

    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = (await response.json()) as { response?: string };
    if (!data.response?.trim()) throw new Error("Ollama returned an empty response");

    try {
      validatePlanJson(data.response);
      const plan = safeParsePlan(data.response, input);
      return NextResponse.json({ ...plan, source: "ollama", model: selectedModel });
    } catch (error) {
      return NextResponse.json(
        {
          error: true,
          source: "ollama_parse_failed",
          reply: "Ollama replied, but the plan JSON could not be parsed. Please try again with a clearer brain dump.",
          details: error instanceof Error ? error.message : "Unknown parse error"
        },
        { status: 502 }
      );
    }
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: true,
        source: "ollama_failed",
        reply: timedOut ? "Local AI took too long. Try Fast Mode or use qwen3:1.7b." : OLLAMA_ERROR,
        model: selectedModel,
        details: error instanceof Error ? error.message : "Unknown Ollama error"
      },
      { status: 503 }
    );
  }
}
