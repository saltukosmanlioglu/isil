export type ProductInput = {
  kod: string;
  ad: string;
  kategori: string;
  birim: string;
  maliyet: number;
  marjYuzdesi: number;
  esikMiktar: number;
};

export type ProductForClient = ProductInput & {
  id: string;
};

export type ExtractedItem = {
  ham_metin: string;
  urun_adi?: string;
  miktar: number;
  birim: string;
};

export type MatchResult = ExtractedItem & {
  eslesen_urun_kodu: string | null;
  guven_skoru: number;
  aciklama: string;
};

export type QuoteLineStatus =
  | "otomatik"
  | "manuel_inceleme"
  | "manuel_onaylandi"
  | "iptal_edildi";

export type QuoteStatus =
  | "taslak"
  | "gonderildi"
  | "kabul_edildi"
  | "reddedildi";

export type QuoteLineForClient = {
  id: string;
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

export type QuoteForClient = {
  id: string;
  createdAt: string;
  durum: QuoteStatus;
  gonderildiAt: string | null;
  kabulEdildiAt: string | null;
  reddedildiAt: string | null;
  kabulEdilenTutar: number | null;
  kalemler: QuoteLineForClient[];
};
