import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function GET() {
  try {
    const total = (await kv.get("tf:generate_quiz_total")) || 0;

    const now = new Date();
    const keys = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      keys.push(`tf:generate_quiz_hour:${d.toISOString().slice(0, 13)}`);
    }

    const values = await kv.mget(...keys);

    const last_24_hours = keys.map((k, idx) => ({
      hour: k.split("tf:generate_quiz_hour:")[1],
      count: values[idx] || 0,
    }));

    return Response.json({ total_generations: total, last_24_hours });
  } catch (err) {
    return Response.json({ error: err?.message || "Stats error" }, { status: 500 });
  }
}
