"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [quizTitle, setQuizTitle] = useState("Photosynthesis Quiz");
  const [sourceText, setSourceText] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");

  const [mode, setMode] = useState("mixed"); // "mixed" | "mcq"
  const [gradeLevel, setGradeLevel] = useState("high"); // "middle" | "high" | "college"
  const [explanations, setExplanations] = useState(true);

  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canGenerate = useMemo(
    () => sourceText.trim().length >= 50,
    [sourceText]
  );

  async function handleGenerate() {
    if (!canGenerate || isLoading) return;

    setIsLoading(true);
    setOutput("Generating quiz...");

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          sourceText,
          numQuestions,
          difficulty,
          mode,
          gradeLevel,
          explanations,
        }),
      });

      const rawText = await res.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        setOutput(
          `Error: Server returned non-JSON (status ${res.status}).\n\n` +
            rawText.slice(0, 800)
        );
        return;
      }

      if (!res.ok) {
        setOutput(`Error: ${data.error || "Unknown server error"}`);
        return;
      }

      setOutput(data.output || "No output returned.");
    } catch (err) {
      setOutput(`Error: ${err?.message || "Request failed"}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setSourceText("");
    setOutput("");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // Clipboard permissions can fail silently
    }
  }

  async function handleDownloadDocx() {
    if (!output || isExporting) return;

    setIsExporting(true);

    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputText: output,
          filename: quizTitle || "testforge-quiz",
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Export failed:\n${msg.slice(0, 600)}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      // Use the quizTitle for the download name (safe fallback)
      const safeName = (quizTitle || "testforge-quiz")
        .toLowerCase()
        .trim()
        .slice(0, 80)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "testforge-quiz";

      a.download = `${safeName}.docx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">TestForge</h1>
          <p className="text-gray-600">
            Paste lesson content and generate a quiz + answer key in minutes.
          </p>
        </header>

        <section className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium">Quiz title</label>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-300 p-3 focus:outline-none focus:ring-2"
              placeholder="e.g., Photosynthesis – Chapter 5"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
          </div>

          <label className="block text-sm font-medium">Lesson content</label>

          <textarea
            className="h-56 w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2"
            placeholder="Paste lesson notes, slide text, or reading material (at least ~50 characters)…"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Questions</span>
                <select
                  className="rounded-2xl border border-gray-300 px-3 py-2"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Difficulty</span>
                <select
                  className="rounded-2xl border border-gray-300 px-3 py-2"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Mode</span>
                <select
                  className="rounded-2xl border border-gray-300 px-3 py-2"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="mixed">Mixed</option>
                  <option value="mcq">MCQ only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Grade level</span>
                <select
                  className="rounded-2xl border border-gray-300 px-3 py-2"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="middle">Middle school</option>
                  <option value="high">High school</option>
                  <option value="college">Intro college</option>
                </select>
              </div>

              <label className="flex items-end gap-2 rounded-2xl border border-gray-300 px-3 py-2">
                <input
                  type="checkbox"
                  checked={explanations}
                  onChange={(e) => setExplanations(e.target.checked)}
                />
                <span className="text-sm">Include explanations</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </button>

              <button
                className={`rounded-2xl px-4 py-2 text-sm font-medium text-white ${
                  canGenerate && !isLoading
                    ? "bg-black hover:opacity-90"
                    : "bg-gray-400"
                }`}
                onClick={handleGenerate}
                disabled={!canGenerate || isLoading}
              >
                {isLoading ? "Generating..." : "Generate quiz"}
              </button>

              {output ? (
                <>
                  <button
                    className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    onClick={handleCopy}
                  >
                    Copy
                  </button>

                  <button
                    className={`rounded-2xl px-4 py-2 text-sm font-medium text-white ${
                      !isExporting
                        ? "bg-black hover:opacity-90"
                        : "bg-gray-400"
                    }`}
                    onClick={handleDownloadDocx}
                    disabled={isExporting}
                  >
                    {isExporting ? "Exporting..." : "Download .docx"}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Tip: Paste one topic at a time for best results.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Output</h2>

          <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-gray-300 bg-gray-50 p-4 text-sm">
            {output || "Your generated quiz will appear here."}
          </pre>
        </section>
      </div>
    </main>
  );
}
