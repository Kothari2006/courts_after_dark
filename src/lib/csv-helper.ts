import { NextResponse } from "next/server";

/**
 * Sanitizes a single cell value for CSV output:
 * - Prevents CSV Formula Injection (DDE) by prefixing dangerous leading characters (=, +, -, @, \t, \r) with a single quote.
 * - Handles null and undefined values safely.
 * - Converts Dates to consistent UTC/ISO strings.
 * - Escapes quotes and wraps strings with commas, quotes, or newlines in double quotes.
 */
export function sanitizeForCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str: string;
  if (value instanceof Date) {
    str = isNaN(value.getTime())
      ? ""
      : value.toISOString().replace("T", " ").substring(0, 19);
  } else if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // Prevent CSV Formula Injection
  // If the cell begins with =, +, -, @, tab, or carriage return, prepend a single quote
  const trimmed = str.trimStart();
  if (
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("\t") ||
    trimmed.startsWith("\r")
  ) {
    str = `'${str}`;
  }

  // If the string contains comma, double quote, or newlines, quote the entire field
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    // Escape existing double quotes as two double quotes
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Builds an RFC 4180 compliant CSV string with UTF-8 BOM prefix.
 */
export function generateCsvString(
  headers: string[],
  rows: (unknown)[][]
): string {
  const headerLine = headers.map((h) => sanitizeForCsv(h)).join(",");
  const dataLines = rows.map((row) =>
    row.map((val) => sanitizeForCsv(val)).join(",")
  );

  // UTF-8 Byte Order Mark (BOM) ensures Excel, Numbers, and Google Sheets correctly recognize UTF-8 characters
  const bom = "\uFEFF";
  return bom + [headerLine, ...dataLines].join("\r\n");
}

/**
 * Creates an HTTP response configured for direct CSV file download.
 */
export function createCsvResponse(
  csvContent: string,
  filename: string
): NextResponse {
  // Safe ASCII filename fallback for Content-Disposition
  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(
        filename
      )}`,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

