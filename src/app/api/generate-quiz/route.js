import OpenAI from "openai";

// --- SIMPLE SERVER-SIDE COUNTER ---
let generateQuizCount = 0;
// ---------------------------------

export const runtime = "nodejs";

export async function POST(req) {
  try {
    // Increment counter on every call
    generateQuizCount += 1;

    console.log(
      `[TestForge] generate-quiz called ${generateQuizCount} time(s)`
    );

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
      return Response.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    if (!sourceText || sourceText.trim().length < 50) {
      return Response.json(
        { error: "Please paste at least ~50 characters of content." },
        { status: 400 }
      );
    }

    const safeTitle = String(title || "Untitled Quiz").slice(0, 80);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const instructions =
      "You are an expert teacher and assessment designer. " +
      "You must ONLY use facts present in the source text. " +
      "Output must follow the requested format.";

    const input = `
Create a ${difficulty} quiz with ${numQuestions} questions.

Title: ${safeTitle}
Grade level: ${gradeLevel}
Mode: ${mode}

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
      debug_generateQuizCount: generateQuizCount, // optional
    });
  } catch (err) {
    console.error("[TestForge] generate-quiz error:", err);

    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
