import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req) {
  try {
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
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    if (!sourceText || sourceText.trim().length < 50) {
      return Response.json(
        { error: "Please paste at least ~50 characters of content." },
        { status: 400 }
      );
    }

    const safeNum = [5, 10, 15, 20].includes(Number(numQuestions))
      ? Number(numQuestions)
      : 10;

    const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty)
      ? difficulty
      : "medium";

    const safeMode = ["mixed", "mcq"].includes(mode) ? mode : "mixed";

    const safeGrade = ["middle", "high", "college"].includes(gradeLevel)
      ? gradeLevel
      : "high";

    const includeExplanations = explanations === true;

    const safeTitle = String(title || "").trim().slice(0, 80) || "Untitled Quiz";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const instructions =
      "You are an expert teacher and assessment designer. " +
      "You must ONLY use facts present in the source text. " +
      "If the source text does not support a question, do not include it. " +
      "Output must follow the exact format requested.";

    const formatRules = `
OUTPUT FORMAT (must follow exactly):
TESTFORGE QUIZ
Title: ${safeTitle}
Grade Level: ${safeGrade}
Difficulty: ${safeDifficulty}
Mode: ${safeMode === "mcq" ? "MCQ only" : "Mixed"}

QUESTIONS:
1) ...
   A) ...
   B) ...
   C) ...
   D) ...

(If mode=mixed, include up to 2 short-answer questions. Mark them clearly as "Short Answer".)

ANSWER KEY:
1) A
2) C
...

${includeExplanations ? `EXPLANATIONS:
1) One sentence that references the source text.
2) ...
...` : ""}
`.trim();

    const input = `
Create a quiz with ${safeNum} questions based ONLY on the source text.

Constraints:
- Grade level: ${safeGrade} (match vocabulary and complexity)
- Difficulty: ${safeDifficulty}
- Mode: ${safeMode === "mcq" ? "Multiple choice only" : "Mostly multiple choice + up to 2 short answer"}
- Do not add any facts not stated in the source text.
- Avoid trick questions.
- Make distractor choices plausible.

${formatRules}

SOURCE TEXT:
"""${sourceText}"""
`.trim();

    const result = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions,
      input,
    });

    return Response.json({ output: result.output_text || "", title: safeTitle });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
