import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/constants";
import { parseDocumentText } from "@/lib/parsers";
import type { ExtractedItem, MatchResult, ProductForClient } from "@/lib/types";

export async function extractItemsWithClaude(text: string): Promise<ExtractedItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return parseDocumentText(text);
  }

  const responseText = await callClaude({
    system:
      "Bu metinden malzeme listesini çıkar. Her kalem için ürün adı, miktar ve birim belirle. SADECE geçerli JSON dizi döndür.",
    user: JSON.stringify({
      beklenen_format: [
        {
          ham_metin: "20000 metre NYY 3x2.5 kablo",
          urun_adi: "NYY 3x2.5 kablo",
          miktar: 20000,
          birim: "metre",
        },
      ],
      metin: text,
    }),
  });

  try {
    return sanitizeExtractedItems(parseJsonArray<ExtractedItem>(responseText));
  } catch {
    return parseDocumentText(text);
  }
}

export async function matchItemsWithClaude(
  items: ExtractedItem[],
  catalog: ProductForClient[],
): Promise<MatchResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return localMatch(items, catalog);
  }

  const responseText = await callClaude({
    system:
      "Sana bir malzeme listesi ve bir ürün kataloğu vereceğim. Listedeki her kalemi kataloğa en iyi eşleştir. Kısaltmaları, teknik senonimleri ve birim farklarını dikkate al. Her kalem için: eşleşen ürün kodu (yoksa null), 0-1 arası güven skoru, kısa gerekçe ver. Fiyat hesabı yapma. SADECE geçerli JSON döndür, başka hiçbir açıklama ekleme.",
    user: JSON.stringify({
      beklenen_format: [
        {
          ham_metin: "...",
          miktar: 20000,
          birim: "metre",
          eslesen_urun_kodu: "KBL-001",
          guven_skoru: 0.93,
          aciklama: "...",
        },
      ],
      malzeme_listesi: items,
      katalog: catalog.map((product) => ({
        kod: product.kod,
        ad: product.ad,
        kategori: product.kategori,
        birim: product.birim,
      })),
    }),
  });

  try {
    return mergeWithOriginalItems(
      items,
      sanitizeMatches(parseJsonArray<MatchResult>(responseText)),
    );
  } catch {
    return localMatch(items, catalog);
  }
}

async function callClaude({ system, user }: { system: string; user: string }) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    temperature: 0,
    system,
    messages: [
      {
        role: "user",
        content: user,
      },
    ],
  });

  return response.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function sanitizeExtractedItems(items: ExtractedItem[]) {
  return items
    .map((item) => ({
      ham_metin: String(item.ham_metin ?? item.urun_adi ?? "").trim(),
      urun_adi: String(item.urun_adi ?? item.ham_metin ?? "").trim(),
      miktar: Number(item.miktar),
      birim: String(item.birim ?? "adet").trim() || "adet",
    }))
    .filter((item) => item.ham_metin && Number.isFinite(item.miktar));
}

function sanitizeMatches(matches: MatchResult[]) {
  return matches.map((match) => ({
    ham_metin: String(match.ham_metin ?? "").trim(),
    urun_adi: String(match.urun_adi ?? match.ham_metin ?? "").trim(),
    miktar: Number(match.miktar),
    birim: String(match.birim ?? "adet").trim() || "adet",
    eslesen_urun_kodu: match.eslesen_urun_kodu
      ? String(match.eslesen_urun_kodu).trim()
      : null,
    guven_skoru: Number(match.guven_skoru),
    aciklama: String(match.aciklama ?? "").trim(),
  }));
}

function mergeWithOriginalItems(items: ExtractedItem[], matches: MatchResult[]) {
  const matchByText = new Map(matches.map((match) => [match.ham_metin, match]));

  return items.map((item, index) => {
    const match = matchByText.get(item.ham_metin) ?? matches[index];

    if (!match) {
      return {
        ...item,
        eslesen_urun_kodu: null,
        guven_skoru: 0,
        aciklama: "Claude yanıtında bu kalem için eşleşme dönmedi.",
      };
    }

    return {
      ham_metin: item.ham_metin,
      urun_adi: item.urun_adi,
      miktar: Number.isFinite(match.miktar) ? match.miktar : item.miktar,
      birim: match.birim || item.birim,
      eslesen_urun_kodu: match.eslesen_urun_kodu,
      guven_skoru: Number.isFinite(match.guven_skoru) ? match.guven_skoru : 0,
      aciklama: match.aciklama,
    };
  });
}

function localMatch(
  items: ExtractedItem[],
  catalog: ProductForClient[],
): MatchResult[] {
  return items.map((item) => {
    const ranked = catalog
      .map((product) => ({
        product,
        score: scoreProduct(item, product),
      }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];

    if (!best || best.score < 0.28) {
      return {
        ...item,
        eslesen_urun_kodu: null,
        guven_skoru: 0.18,
        aciklama: "Yerel demo eşleştirici net katalog karşılığı bulamadı.",
      };
    }

    return {
      ...item,
      eslesen_urun_kodu: best.product.kod,
      guven_skoru: best.score,
      aciklama: process.env.ANTHROPIC_API_KEY
        ? "Claude yanıtı işlenemedi; yerel eşleştirici kullanıldı."
        : "ANTHROPIC_API_KEY yok; yerel demo eşleştirici kullanıldı.",
    };
  });
}

function scoreProduct(item: ExtractedItem, product: ProductForClient) {
  const itemText = normalize(`${item.ham_metin} ${item.urun_adi ?? ""}`);
  const productText = normalize(`${product.kod} ${product.ad} ${product.birim}`);

  if (itemText.includes(normalize(product.kod))) {
    return 0.99;
  }

  if (itemText.includes(normalize(product.ad)) || productText.includes(itemText)) {
    return 0.95;
  }

  const productTokens = tokenize(productText);
  const itemTokens = new Set(tokenize(itemText));
  const overlap = productTokens.filter((token) => itemTokens.has(token)).length;
  let score = productTokens.length > 0 ? overlap / productTokens.length : 0;

  for (const group of [
    ["kablo", "cable", "nyy", "nek"],
    ["junction", "box", "buat"],
    ["armatur", "aydınlatma", "aydinlatma", "atex"],
    ["pano", "dagitim", "dağıtım"],
    ["konnektor", "konnektör", "connector"],
    ["kanal", "galvaniz"],
    ["klemens", "klemensi"],
  ]) {
    if (
      group.some((token) => itemText.includes(normalize(token))) &&
      group.some((token) => productText.includes(normalize(token)))
    ) {
      score += 0.18;
    }
  }

  return Math.min(0.96, Math.max(0, score));
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/i)
    .filter((token) => token.length > 1);
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/²/g, "2")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonArray<T>(value: string): T[] {
  const withoutFence = value
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(withoutFence);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const start = withoutFence.indexOf("[");
    const end = withoutFence.lastIndexOf("]");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Claude geçerli JSON dizi döndürmedi.");
    }

    const parsed = JSON.parse(withoutFence.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  }
}
