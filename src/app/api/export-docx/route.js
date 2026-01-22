import { Document, Packer, Paragraph, TextRun } from "docx";

export const runtime = "nodejs";

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .slice(0, 80)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req) {
  try {
    const { outputText, filename } = await req.json();

    if (!outputText || outputText.trim().length === 0) {
      return Response.json({ error: "Nothing to export." }, { status: 400 });
    }

    const lines = outputText.replace(/\r\n/g, "\n").split("\n");

    const paragraphs = [];
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "TestForge Quiz Export",
            bold: true,
            size: 32,
          }),
        ],
        spacing: { after: 240 },
      })
    );

    for (const line of lines) {
      paragraphs.push(new Paragraph({ text: line }));
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(doc);

    const base = slugify(filename) || "testforge-quiz";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${base}.docx"`,
      },
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Export failed" },
      { status: 500 }
    );
  }
}
