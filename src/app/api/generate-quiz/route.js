import OpenAI from "openai";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    // Persistent counters
    const total = await kv.incr("tf:generate_quiz_total");

    const hourKey = `tf:generate_quiz_hour:${new Date()
      .toISOString()
      .slice(0, 13)}`; // YYYY-MM-DDTHH

    const hour = await kv.incr(hourKey);
    await kv.expire(hourKey, 60 * 60 * 24 * 7); // keep hourly buckets 7 days

    console.log(`[TestForge] generate-quiz total=${total} hour=${hour}`);

    const {
      sourceText,
      numQuestions,
      difficulty,
      mode,
      gradeLevel,
      explanations,
      title,
    } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    if (!sourceText || sourceText.trim().length < 50) {
      return Response.json(
        { error: "Please paste at least ~50 characters of content." },
        { status: 400 }
      );
    }

    const safeTitle =
      String(title || "").trim().slice(0, 80) || "Untitled Quiz";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const instructions =
      "You are an expert teacher and assessment designer. " +
      "You must ONLY use facts present in the source text. " +
      "Output must follow the requested format.";

    const input = `
Create a quiz based ONLY on the source text.

Title: ${safeTitle}
Grade level: ${gradeLevel}
Difficulty: ${difficulty}
Mode: ${mode}
Include explanations: ${explanations ? "yes" : "no"}

SOURCE TEXT:
"""${sourceText}"""
`.trim();

    const result = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions,
      input,
    });

    return Response.json({
      output: result.output_text || "",
      stats: { total_generations: total },
    });
  } catch (err) {
    console.error("[TestForge] generate-quiz error:", err);
    return Response.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
