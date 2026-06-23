import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import type { ExtractedItem } from "@/lib/types";

export type UploadedParseResult = {
  items: ExtractedItem[];
  textForLlm?: string;
};

const UNIT_ALIASES: Record<string, string> = {
  adet: "adet",
  ad: "adet",
  pcs: "adet",
  piece: "adet",
  metre: "metre",
  meter: "metre",
  mt: "metre",
  m: "metre",
  kg: "kg",
  kilogram: "kg",
};

const UNIT_PATTERN = Object.keys(UNIT_ALIASES)
  .sort((a, b) => b.length - a.length)
  .join("|");

export async function parseUploadedFile(file: File): Promise<UploadedParseResult> {
  const extension = getExtension(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "xlsx" || extension === "xls") {
    return { items: parseExcel(buffer) };
  }

  if (extension === "pdf") {
    return { items: [], textForLlm: await extractPdfText(buffer) };
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return { items: [], textForLlm: result.value };
  }

  throw new Error("Desteklenmeyen dosya türü. Excel, PDF veya Word yükleyin.");
}

export function parseManualText(text: string): ExtractedItem[] {
  return splitLines(text).map(parseLine).filter(Boolean) as ExtractedItem[];
}

export function parseDocumentText(text: string): ExtractedItem[] {
  return parseManualText(text);
}

export function parseLocalizedNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  const input = String(value ?? "").trim();
  if (!input) {
    return Number.NaN;
  }

  const compact = input.replace(/\s+/g, "");
  const thousandsWithCommaDecimal = /^\d{1,3}(\.\d{3})+(,\d+)?$/;

  if (thousandsWithCommaDecimal.test(compact)) {
    return Number(compact.replace(/\./g, "").replace(",", "."));
  }

  return Number(compact.replace(",", "."));
}

export function normalizeUnit(value: unknown) {
  const normalized = normalizeText(String(value ?? ""));
  return UNIT_ALIASES[normalized] ?? normalized;
}

function parseExcel(buffer: Buffer): ExtractedItem[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (rows.length === 0) {
    return [];
  }

  const headerInfo = detectHeader(rows[0] ?? []);
  const startIndex = headerInfo.hasHeader ? 1 : 0;
  const items: ExtractedItem[] = [];

  for (const row of rows.slice(startIndex)) {
    const productName = String(row[headerInfo.productIndex] ?? "").trim();
    const quantity = parseLocalizedNumber(row[headerInfo.quantityIndex]);
    const unit = normalizeUnit(row[headerInfo.unitIndex] ?? "adet") || "adet";
    const raw = row
      .map((cell) => String(cell ?? "").trim())
      .filter(Boolean)
      .join(" | ");

    if (!productName || !Number.isFinite(quantity)) {
      continue;
    }

    items.push({
      ham_metin: raw || `${quantity} ${unit} ${productName}`,
      urun_adi: productName,
      miktar: quantity,
      birim: unit,
    });
  }

  return items;
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function detectHeader(row: unknown[]) {
  const normalized = row.map((cell) => normalizeText(String(cell ?? "")));
  const hasHeader = normalized.some((cell) =>
    /(urun|ürün|malzeme|miktar|birim|qty|quantity)/i.test(cell),
  );

  if (!hasHeader) {
    return {
      hasHeader,
      productIndex: 0,
      quantityIndex: 1,
      unitIndex: 2,
    };
  }

  return {
    hasHeader,
    productIndex: findIndex(normalized, /(urun|ürün|malzeme|ad|name)/i, 0),
    quantityIndex: findIndex(normalized, /(miktar|qty|quantity|adet)/i, 1),
    unitIndex: findIndex(normalized, /(birim|unit)/i, 2),
  };
}

function parseLine(line: string): ExtractedItem | null {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const quantityUnit = new RegExp(
    `(^|\\s)(\\d[\\d.,]*)\\s*\\b(${UNIT_PATTERN})\\b`,
    "i",
  );
  const unitQuantity = new RegExp(
    `(^|\\s)\\b(${UNIT_PATTERN})\\b\\s*(\\d[\\d.,]*)`,
    "i",
  );

  const direct = trimmed.match(quantityUnit);
  const reverse = direct ? null : trimmed.match(unitQuantity);
  const quantity = direct
    ? parseLocalizedNumber(direct[2])
    : reverse
      ? parseLocalizedNumber(reverse[3])
      : parseLeadingQuantity(trimmed);
  const unit = direct
    ? normalizeUnit(direct[3])
    : reverse
      ? normalizeUnit(reverse[2])
      : "adet";
  const productText = (direct
    ? trimmed.replace(direct[0], " ")
    : reverse
      ? trimmed.replace(reverse[0], " ")
      : trimmed.replace(/^\s*\d[\d.,]*/, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

  return {
    ham_metin: trimmed,
    urun_adi: productText || trimmed,
    miktar: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    birim: unit || "adet",
  };
}

function parseLeadingQuantity(line: string) {
  const match = line.match(/^\s*(\d[\d.,]*)\b/);
  return match ? parseLocalizedNumber(match[1]) : 1;
}

function splitLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findIndex(values: string[], pattern: RegExp, fallback: number) {
  const index = values.findIndex((value) => pattern.test(value));
  return index >= 0 ? index : fallback;
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLocaleLowerCase("tr-TR") ?? "";
}
