export const GUVEN_ESIGI = 0.7;

export const DURUM = {
  OTOMATIK: "otomatik",
  MANUEL_INCELEME: "manuel_inceleme",
  MANUEL_ONAYLANDI: "manuel_onaylandi",
  IPTAL_EDILDI: "iptal_edildi",
} as const;

export const TEKLIF_DURUM = {
  TASLAK: "taslak",
  GONDERILDI: "gonderildi",
  KABUL_EDILDI: "kabul_edildi",
  REDDEDILDI: "reddedildi",
} as const;

export const URUN_KATEGORILERI = [
  "Kablo",
  "Bağlantı ve Aksesuar",
  "Pano ve Şalt",
  "Aydınlatma",
  "Konnektör ve Priz",
  "Kablo Kanalı ve Boru",
  "Otomasyon",
  "Emniyet ve Yangın",
  "Topraklama",
  "Marin Elektrik",
  "Genel",
] as const;

export const CLAUDE_MODEL = "claude-sonnet-4-6";
