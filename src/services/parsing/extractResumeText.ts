import { PDFParse } from "pdf-parse";

import { HttpError } from "../../utils/httpError";

const MIN_TEXT_LENGTH = 100;

export async function extractResumeText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    const text = parsed.text.replace(/\s+/g, " ").trim();

    if (text.length < MIN_TEXT_LENGTH) {
      throw new HttpError(
        400,
        "Could not extract enough text from this PDF. Please upload a text-based resume PDF.",
      );
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
