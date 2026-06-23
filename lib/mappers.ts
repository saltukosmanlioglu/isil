import type { Teklif, TeklifKalemi, Urun } from "@prisma/client";
import type {
  ProductForClient,
  QuoteForClient,
  QuoteLineStatus,
} from "@/lib/types";

export function productToClient(product: Urun): ProductForClient {
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

export function quoteToClient(
  quote: Teklif & { kalemler: TeklifKalemi[] },
): QuoteForClient {
  return {
    id: quote.id,
    createdAt: quote.createdAt.toISOString(),
    durum: quote.durum as QuoteForClient["durum"],
    gonderildiAt: quote.gonderildiAt?.toISOString() ?? null,
    kabulEdildiAt: quote.kabulEdildiAt?.toISOString() ?? null,
    reddedildiAt: quote.reddedildiAt?.toISOString() ?? null,
    kabulEdilenTutar: quote.kabulEdilenTutar,
    kalemler: quote.kalemler.map((line) => ({
      id: line.id,
      hamMetin: line.hamMetin,
      miktar: line.miktar,
      birim: line.birim,
      eslesenUrunKodu: line.eslesenUrunKodu,
      kategori: line.kategori,
      guvenSkoru: line.guvenSkoru,
      durum: line.durum as QuoteLineStatus,
      birimFiyat: line.birimFiyat,
      toplam: line.toplam,
      sebep: line.sebep,
    })),
  };
}
