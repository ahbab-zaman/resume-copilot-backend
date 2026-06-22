import type { CoverLetter } from "../../models/CoverLetter";
import type { OptimizedResume } from "../../models/OptimizedResume";

type CoverLetterPdfInput = {
  coverLetter: CoverLetter;
};

type OptimizedResumePdfInput = {
  optimizedResume: OptimizedResume;
};

export function buildCoverLetterPdfLines(
  input: CoverLetterPdfInput,
): { title: string; lines: string[] }[] {
  const paragraphs = input.coverLetter.content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return [
    {
      title: `Cover letter - ${input.coverLetter.tone}`,
      lines: [
        `Tone: ${input.coverLetter.tone}`,
        "",
        ...paragraphs.flatMap((paragraph) => [paragraph, ""]),
      ],
    },
  ];
}

export function buildOptimizedResumePdfLines(
  input: OptimizedResumePdfInput,
): { title: string; lines: string[] }[] {
  const content = input.optimizedResume.optimizedContent;
  const lines: string[] = [
    `Headline: ${content.headline}`,
    "",
    "Summary",
    content.summary,
    "",
  ];

  for (const pair of content.sectionPairs) {
    lines.push(
      `Section: ${pair.section}`,
      `Reason: ${pair.reason}`,
      "Original",
      pair.original,
      "Optimized",
      pair.optimized,
      "",
    );
  }

  if (content.keywordIntegrations.length > 0) {
    lines.push("Keyword integrations");
    lines.push(content.keywordIntegrations.join(", "));
    lines.push("");
  }

  if (content.nextSteps.length > 0) {
    lines.push("Next steps");
    for (const step of content.nextSteps) {
      lines.push(`- ${step}`);
    }
    lines.push("");
  }

  return [
    {
      title: `Optimized resume - ${content.headline}`,
      lines,
    },
  ];
}
