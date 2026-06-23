CREATE TABLE IF NOT EXISTS "Urun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'Genel',
    "birim" TEXT NOT NULL,
    "maliyet" REAL NOT NULL,
    "marjYuzdesi" REAL NOT NULL,
    "esikMiktar" REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS "Teklif" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durum" TEXT NOT NULL DEFAULT 'taslak',
    "gonderildiAt" DATETIME,
    "kabulEdildiAt" DATETIME,
    "reddedildiAt" DATETIME,
    "kabulEdilenTutar" REAL,
    "reddedildiTutar" REAL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "TeklifKalemi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teklifId" TEXT NOT NULL,
    "hamMetin" TEXT NOT NULL,
    "miktar" REAL NOT NULL,
    "birim" TEXT NOT NULL,
    "eslesenUrunKodu" TEXT,
    "kategori" TEXT,
    "guvenSkoru" REAL,
    "durum" TEXT NOT NULL,
    "birimFiyat" REAL,
    "toplam" REAL,
    "sebep" TEXT,
    CONSTRAINT "TeklifKalemi_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Urun_kod_key" ON "Urun"("kod");
