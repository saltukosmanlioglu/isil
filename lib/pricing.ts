import { DURUM, GUVEN_ESIGI } from "@/lib/constants";
import type { MatchResult, ProductForClient, QuoteLineStatus } from "@/lib/types";

type PricedLine = {
  hamMetin: string;
  miktar: number;
  birim: string;
  eslesenUrunKodu: string | null;
  kategori: string | null;
  guvenSkoru: number | null;
  durum: QuoteLineStatus;
  birimFiyat: number | null;
  toplam: number | null;
  sebep: string | null;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateUnitPrice(product: Pick<ProductForClient, "maliyet" | "marjYuzdesi">) {
  return roundMoney(product.maliyet * (1 + product.marjYuzdesi / 100));
}

export function priceMatch(
  match: MatchResult,
  product: ProductForClient | null | undefined,
): PricedLine {
  const confidence = clampScore(match.guven_skoru);
  const quantity = Number.isFinite(match.miktar) ? match.miktar : 0;
  const base = {
    hamMetin: match.ham_metin,
    miktar: quantity,
    birim: match.birim || product?.birim || "adet",
    eslesenUrunKodu: product?.kod ?? null,
    kategori: product?.kategori ?? null,
    guvenSkoru: confidence,
  };

  if (!product || !match.eslesen_urun_kodu) {
    return {
      ...base,
      durum: DURUM.MANUEL_INCELEME,
      birimFiyat: null,
      toplam: null,
      sebep: "eşleşme bulunamadı",
    };
  }

  if (confidence < GUVEN_ESIGI) {
    return {
      ...base,
      durum: DURUM.MANUEL_INCELEME,
      birimFiyat: null,
      toplam: null,
      sebep: "güven skoru düşük",
    };
  }

  if (quantity > product.esikMiktar) {
    return {
      ...base,
      durum: DURUM.MANUEL_INCELEME,
      birimFiyat: null,
      toplam: null,
      sebep: "miktar eşiği aşıldı",
    };
  }

  const unitPrice = calculateUnitPrice(product);

  return {
    ...base,
    durum: DURUM.OTOMATIK,
    birimFiyat: unitPrice,
    toplam: roundMoney(unitPrice * quantity),
    sebep: null,
  };
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(1, Math.max(0, score));
}
