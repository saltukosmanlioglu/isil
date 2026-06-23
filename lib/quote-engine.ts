import { prisma } from "@/lib/prisma";
import { extractItemsWithClaude, matchItemsWithClaude } from "@/lib/llm";
import { parseManualText, parseUploadedFile } from "@/lib/parsers";
import { priceMatch } from "@/lib/pricing";
import { ensureSeedData } from "@/lib/seed";
import type { ExtractedItem, ProductForClient } from "@/lib/types";

export async function createQuote({
  file,
  manualText,
}: {
  file?: File | null;
  manualText?: string;
}) {
  await ensureSeedData();

  const products = await prisma.urun.findMany({
    orderBy: { kod: "asc" },
  });
  const catalog = products.map(toProductForClient);
  const items = await extractItems({ file, manualText });

  if (items.length === 0) {
    throw new Error("Teklif oluşturmak için en az bir geçerli kalem girin.");
  }

  const matches = await matchItemsWithClaude(items, catalog);
  const productMap = new Map(catalog.map((product) => [product.kod, product]));
  const pricedLines = matches.map((match) =>
    priceMatch(
      match,
      match.eslesen_urun_kodu ? productMap.get(match.eslesen_urun_kodu) : null,
    ),
  );
  const quote = await prisma.teklif.create({
    data: {
      kalemler: {
        create: pricedLines,
      },
    },
    select: {
      id: true,
    },
  });

  return quote.id;
}

async function extractItems({
  file,
  manualText,
}: {
  file?: File | null;
  manualText?: string;
}): Promise<ExtractedItem[]> {
  if (file && file.size > 0) {
    const parsed = await parseUploadedFile(file);

    if (parsed.textForLlm) {
      return extractItemsWithClaude(parsed.textForLlm);
    }

    return parsed.items;
  }

  return parseManualText(manualText ?? "");
}

function toProductForClient(product: ProductForClient): ProductForClient {
  return {
    id: product.id,
    kod: product.kod,
    ad: product.ad,
    kategori: product.kategori,
    birim: product.birim,
    maliyet: product.maliyet,
    marjYuzdesi: product.marjYuzdesi,
    esikMiktar: product.esikMiktar,
  };
}
