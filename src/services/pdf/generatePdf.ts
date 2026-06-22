type PdfPage = {
  title: string;
  lines: string[];
};

type GeneratePdfInput = {
  title: string;
  pages: PdfPage[];
};

function sanitizePdfText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value: string, maxChars: number): string[] {
  const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine.length > 0 ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars) {
      currentLine = candidate;
      continue;
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    if (word.length > maxChars) {
      let slice = word;
      while (slice.length > maxChars) {
        lines.push(slice.slice(0, maxChars));
        slice = slice.slice(maxChars);
      }
      currentLine = slice;
    } else {
      currentLine = word;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function escapePdfString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPageContent(title: string, lines: string[]): string {
  const sanitizedTitle = escapePdfString(sanitizePdfText(title));
  const commands: string[] = [];

  commands.push("BT");
  commands.push("/F1 18 Tf");
  commands.push("72 760 Td");
  commands.push(`(${sanitizedTitle}) Tj`);
  commands.push("/F1 10 Tf");
  commands.push("0 -22 Td");

  for (const line of lines) {
    if (line === "") {
      commands.push("0 -12 Td");
      continue;
    }

    const wrapped = wrapText(line, 88);
    for (const wrappedLine of wrapped) {
      commands.push(`(${escapePdfString(wrappedLine)}) Tj`);
      commands.push("0 -14 Td");
    }
  }

  commands.push("ET");

  return commands.join("\n");
}

export function generatePdfBuffer(input: GeneratePdfInput): Buffer {
  const pageContents = input.pages.map((page) =>
    buildPageContent(page.title, page.lines),
  );

  const objectBodies: string[] = [];
  const pageObjectNumbers = pageContents.map((_, index) => 4 + index * 2);
  const contentObjectNumbers = pageContents.map((_, index) => 5 + index * 2);

  objectBodies.push("<< /Type /Catalog /Pages 2 0 R >>");
  objectBodies.push(
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageContents.length} >>`,
  );
  objectBodies.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (let index = 0; index < pageContents.length; index += 1) {
    const pageObjectNumber = pageObjectNumbers[index]!;
    const contentObjectNumber = contentObjectNumbers[index]!;
    objectBodies.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    const contentStream = pageContents[index]!;
    objectBodies.push(
      `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`,
    );

    // Keep object numbering aligned with the page/content pairs.
    if (pageObjectNumber !== 4 + index * 2 || contentObjectNumber !== 5 + index * 2) {
      throw new Error("Unexpected PDF object numbering");
    }
  }

  const header = "%PDF-1.4\n";
  const bodyChunks: Buffer[] = [Buffer.from(header, "utf8")];
  const offsets: number[] = [0];
  let currentOffset = Buffer.byteLength(header, "utf8");

  for (let index = 0; index < objectBodies.length; index += 1) {
    const objectNumber = index + 1;
    const objectText = `${objectNumber} 0 obj\n${objectBodies[index]!}\nendobj\n`;
    offsets.push(currentOffset);
    const objectBuffer = Buffer.from(objectText, "utf8");
    bodyChunks.push(objectBuffer);
    currentOffset += objectBuffer.byteLength;
  }

  const xrefOffset = currentOffset;
  const xrefLines = [
    "xref",
    `0 ${objectBodies.length + 1}`,
    "0000000000 65535 f ",
    ...offsets
      .slice(1)
      .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objectBodies.length + 1} /Root 1 0 R >>`,
    "startxref",
    `${xrefOffset}`,
    "%%EOF",
  ];

  bodyChunks.push(Buffer.from(`${xrefLines.join("\n")}\n`, "utf8"));
  return Buffer.concat(bodyChunks);
}
