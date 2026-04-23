import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Worker is copied to public/ so it's served as a static file
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

/**
 * Returns { parsePDF, isParsing, parseError }.
 * parsePDF(file: File) → Promise<string> — resolves with extracted plain text.
 */
export function usePDFParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  async function parsePDF(file) {
    setIsParsing(true);
    setParseError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const pageTexts = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        pageTexts.push(pageText);
      }

      return pageTexts.join("\n\n");
    } catch (err) {
      console.error("[usePDFParser] raw error:", err);
      const message = "Failed to parse PDF. Make sure the file is a valid, non-scanned PDF.";
      setParseError(message);
      throw new Error(message);
    } finally {
      setIsParsing(false);
    }
  }

  return { parsePDF, isParsing, parseError };
}
