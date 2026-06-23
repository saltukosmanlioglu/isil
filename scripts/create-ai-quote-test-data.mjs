import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// These codes are intentionally kept in a dedicated DEMO range so rerunning the
// script never overwrites a product that was added through the catalog UI.
const catalogProducts = [
  ["DEMO-KBL-001", "NYY 3x1.5mm² Bakır Kablo", "metre", 12.4, 12, 600],
  ["DEMO-KBL-002", "NYY 3x2.5mm² Bakır Kablo", "metre", 18.6, 12, 500],
  ["DEMO-KBL-003", "NYY 4x4mm² Bakır Kablo", "metre", 42.8, 11, 300],
  ["DEMO-KBL-004", "NYY 4x6mm² Bakır Kablo", "metre", 63.5, 11, 250],
  ["DEMO-KBL-005", "NYY 5x10mm² Bakır Kablo", "metre", 148, 10, 150],
  ["DEMO-KBL-006", "H07V-K 1x1.5mm² Esnek Kablo", "metre", 7.8, 14, 800],
  ["DEMO-KBL-007", "H07V-K 1x2.5mm² Esnek Kablo", "metre", 11.9, 14, 700],
  ["DEMO-KBL-008", "H07V-K 1x6mm² Esnek Kablo", "metre", 28.4, 13, 400],
  ["DEMO-KBL-009", "NEK 606 Gemi Tipi Kablo 4x1.5mm²", "metre", 31.5, 12, 450],
  ["DEMO-KBL-010", "NEK 606 Gemi Tipi Kablo 4x2.5mm²", "metre", 46.2, 12, 350],
  ["DEMO-BGL-001", "Kablo Bağlantı Klemensi 2.5mm²", "adet", 4.8, 20, 250],
  ["DEMO-BGL-002", "Kablo Bağlantı Klemensi 6mm²", "adet", 7.2, 20, 200],
  ["DEMO-BGL-003", "Pirinç Kablo Rakoru M20", "adet", 18.5, 18, 120],
  ["DEMO-BGL-004", "Pirinç Kablo Rakoru M25", "adet", 23.4, 18, 100],
  ["DEMO-BGL-005", "IP68 Plastik Kablo Rakoru M20", "adet", 8.6, 20, 150],
  ["DEMO-BGL-006", "Isı Büzüşmeli Makaron Seti", "adet", 65, 18, 30],
  ["DEMO-BGL-007", "Kablo Bağı Siyah 300mm", "adet", 0.68, 25, 1000],
  ["DEMO-BGL-008", "Kablo Bağı Paslanmaz Çelik 300mm", "adet", 3.2, 22, 500],
  ["DEMO-BGL-009", "Kablo Etiketi Numaratör Seti", "adet", 84, 18, 20],
  ["DEMO-BGL-010", "Kablo Pabucu Bakır 35mm²", "adet", 12.7, 20, 100],
  ["DEMO-PNL-001", "Duvar Tipi Metal Elektrik Panosu 600x800mm", "adet", 1850, 10, 8],
  ["DEMO-PNL-002", "Duvar Tipi Metal Elektrik Panosu 800x1000mm", "adet", 2780, 10, 6],
  ["DEMO-PNL-003", "Modüler Dağıtım Panosu 24 Modül", "adet", 790, 12, 15],
  ["DEMO-PNL-004", "Modüler Dağıtım Panosu 48 Modül", "adet", 1260, 12, 10],
  ["DEMO-PNL-005", "Ana Şalter 3P 63A", "adet", 420, 13, 30],
  ["DEMO-PNL-006", "Ana Şalter 3P 125A", "adet", 980, 13, 20],
  ["DEMO-PNL-007", "Otomatik Sigorta 1P 16A C Tipi", "adet", 78, 16, 100],
  ["DEMO-PNL-008", "Otomatik Sigorta 3P 32A C Tipi", "adet", 365, 16, 50],
  ["DEMO-PNL-009", "Kaçak Akım Rölesi 4P 40A 30mA", "adet", 640, 14, 25],
  ["DEMO-PNL-010", "Kontaktör 3P 25A 230V", "adet", 510, 15, 25],
  ["DEMO-AYD-001", "LED Projektör 100W IP66", "adet", 1240, 14, 15],
  ["DEMO-AYD-002", "LED Projektör 200W IP66", "adet", 2120, 14, 12],
  ["DEMO-AYD-003", "LED Etanj Armatür 120cm 36W IP65", "adet", 690, 15, 40],
  ["DEMO-AYD-004", "LED Etanj Armatür 150cm 50W IP65", "adet", 910, 15, 30],
  ["DEMO-AYD-005", "Acil Çıkış Armatürü LED 3 Saat", "adet", 540, 16, 25],
  ["DEMO-AYD-006", "ATEX LED Armatür 40W Zone 1", "adet", 3450, 10, 8],
  ["DEMO-AYD-007", "LED Panel Armatür 60x60cm 40W", "adet", 520, 16, 35],
  ["DEMO-AYD-008", "Endüstriyel Yüksek Tavan Armatürü 150W", "adet", 2160, 13, 15],
  ["DEMO-AYD-009", "Hareket Sensörü Tavan Tipi 360 Derece", "adet", 285, 18, 40],
  ["DEMO-AYD-010", "Fotosel Röle 220V", "adet", 195, 18, 40],
  ["DEMO-KNT-001", "IP67 Su Geçirmez Buat 100x100mm", "adet", 118, 18, 60],
  ["DEMO-KNT-002", "IP67 Su Geçirmez Buat 150x110mm", "adet", 184, 18, 50],
  ["DEMO-KNT-003", "IP68 Endüstriyel Konnektör 3 Pin", "adet", 96, 18, 80],
  ["DEMO-KNT-004", "IP68 Endüstriyel Konnektör 5 Pin", "adet", 142, 18, 60],
  ["DEMO-KNT-005", "CEE Norm Fiş 16A 3P+E", "adet", 210, 17, 50],
  ["DEMO-KNT-006", "CEE Norm Priz 16A 3P+E", "adet", 235, 17, 50],
  ["DEMO-KNT-007", "CEE Norm Fiş 32A 3P+E", "adet", 365, 17, 40],
  ["DEMO-KNT-008", "CEE Norm Priz 32A 3P+E", "adet", 410, 17, 40],
  ["DEMO-KNT-009", "RJ45 Cat6 Keystone Jack", "adet", 82, 20, 100],
  ["DEMO-KNT-010", "RJ45 Cat6 Duvar Prizi", "adet", 130, 20, 80],
  ["DEMO-KNL-001", "Galvaniz Kablo Kanalı 100x50mm", "metre", 132, 14, 150],
  ["DEMO-KNL-002", "Galvaniz Kablo Kanalı 200x50mm", "metre", 208, 14, 120],
  ["DEMO-KNL-003", "Galvaniz Kablo Kanalı 300x60mm", "metre", 324, 14, 100],
  ["DEMO-KNL-004", "PVC Kablo Kanalı 40x40mm", "metre", 42, 18, 250],
  ["DEMO-KNL-005", "PVC Kablo Kanalı 60x60mm", "metre", 63, 18, 200],
  ["DEMO-KNL-006", "Spiral Kablo Borusu 20mm", "metre", 22, 18, 300],
  ["DEMO-KNL-007", "Spiral Kablo Borusu 32mm", "metre", 35, 18, 250],
  ["DEMO-KNL-008", "Çelik Boru 25mm Galvaniz", "metre", 84, 15, 150],
  ["DEMO-KNL-009", "Çelik Boru 32mm Galvaniz", "metre", 112, 15, 120],
  ["DEMO-KNL-010", "Kablo Kanalı Dönüş Aparatı 100mm", "adet", 95, 18, 40],
  ["DEMO-OTM-001", "PLC Giriş Modülü 16DI 24VDC", "adet", 1680, 12, 10],
  ["DEMO-OTM-002", "PLC Çıkış Modülü 16DO 24VDC", "adet", 1890, 12, 10],
  ["DEMO-OTM-003", "PLC Analog Giriş Modülü 4AI", "adet", 2460, 12, 8],
  ["DEMO-OTM-004", "24VDC 10A Güç Kaynağı", "adet", 980, 15, 20],
  ["DEMO-OTM-005", "24VDC 20A Güç Kaynağı", "adet", 1580, 15, 15],
  ["DEMO-OTM-006", "Endüstriyel Ethernet Switch 8 Port", "adet", 2860, 12, 8],
  ["DEMO-OTM-007", "Sıcaklık Sensörü PT100", "adet", 345, 18, 30],
  ["DEMO-OTM-008", "Basınç Sensörü 0-10 Bar 4-20mA", "adet", 1240, 16, 15],
  ["DEMO-OTM-009", "İndüktif Sensör M18 PNP", "adet", 415, 18, 30],
  ["DEMO-OTM-010", "Operatör Paneli HMI 7 İnç", "adet", 4820, 10, 5],
  ["DEMO-EMN-001", "Parafudr Tip 2 3P+N 40kA", "adet", 1240, 14, 20],
  ["DEMO-EMN-002", "Yangın Alarm Butonu Kırmızı", "adet", 210, 18, 40],
  ["DEMO-EMN-003", "Yangın Alarm Sireni 24VDC", "adet", 385, 18, 30],
  ["DEMO-EMN-004", "Duman Dedektörü Optik 24VDC", "adet", 465, 18, 30],
  ["DEMO-EMN-005", "Isı Dedektörü Sabit Sıcaklık", "adet", 410, 18, 30],
  ["DEMO-EMN-006", "Yangın Alarm Kontrol Paneli 8 Zone", "adet", 5680, 10, 4],
  ["DEMO-EMN-007", "Acil Stop Butonu Mantar Tipi", "adet", 185, 20, 50],
  ["DEMO-EMN-008", "Emniyet Rölesi 24VDC", "adet", 1280, 15, 15],
  ["DEMO-EMN-009", "IP65 Plastik Kumanda Kutusu", "adet", 325, 18, 25],
  ["DEMO-EMN-010", "Kapı Emniyet Switchi", "adet", 530, 18, 20],
  ["DEMO-TOP-001", "Topraklama Kablosu 16mm² Sarı Yeşil", "metre", 72, 14, 300],
  ["DEMO-TOP-002", "Topraklama Kablosu 35mm² Sarı Yeşil", "metre", 152, 14, 200],
  ["DEMO-TOP-003", "Bakır Topraklama Lama 30x3mm", "metre", 245, 12, 100],
  ["DEMO-TOP-004", "Topraklama Çubuğu Bakır Kaplı 1.5m", "adet", 395, 16, 25],
  ["DEMO-TOP-005", "Topraklama Barası 12 Klemensli", "adet", 280, 18, 30],
  ["DEMO-TOP-006", "Eş Potansiyel Bara 6 Klemensli", "adet", 195, 18, 40],
  ["DEMO-TOP-007", "Bimetal Kablo Pabucu 70mm²", "adet", 48, 18, 60],
  ["DEMO-TOP-008", "Topraklama Test Klemensi", "adet", 88, 20, 40],
  ["DEMO-TOP-009", "Galvaniz Şerit 30x3mm", "metre", 96, 15, 150],
  ["DEMO-TOP-010", "Paratoner İniş İletkeni 50mm²", "metre", 188, 13, 100],
  ["DEMO-MRN-001", "Gemi Tipi Seyir Feneri Kırmızı 24V", "adet", 1280, 12, 10],
  ["DEMO-MRN-002", "Gemi Tipi Seyir Feneri Yeşil 24V", "adet", 1280, 12, 10],
  ["DEMO-MRN-003", "Gemi Tipi Güverte Armatürü 24V", "adet", 1860, 12, 12],
  ["DEMO-MRN-004", "Marin Akü Şalteri 300A", "adet", 920, 14, 15],
  ["DEMO-MRN-005", "Marin Sigorta Tutucu 32A", "adet", 175, 18, 40],
  ["DEMO-MRN-006", "Marin Akü Kablosu 1x50mm²", "metre", 286, 12, 120],
  ["DEMO-MRN-007", "Marin Akü Kablosu 1x70mm²", "metre", 398, 12, 100],
  ["DEMO-MRN-008", "Su Geçirmez Güverte Prizi 16A", "adet", 645, 16, 20],
  ["DEMO-MRN-009", "Gemi Tipi Alarm Sireni 24V", "adet", 740, 16, 20],
  ["DEMO-MRN-010", "Marin Kontrol Paneli 12V", "adet", 3280, 11, 6],
].map(([kod, ad, birim, maliyet, marjYuzdesi, esikMiktar]) => ({
  kod,
  ad,
  kategori: categoryForDemoCode(kod),
  birim,
  maliyet,
  marjYuzdesi,
  esikMiktar,
}));

function categoryForDemoCode(code) {
  const prefix = code.split("-")[1];
  const categories = {
    KBL: "Kablo",
    BGL: "Bağlantı ve Aksesuar",
    PNL: "Pano ve Şalt",
    AYD: "Aydınlatma",
    KNT: "Konnektör ve Priz",
    KNL: "Kablo Kanalı ve Boru",
    OTM: "Otomasyon",
    EMN: "Emniyet ve Yangın",
    TOP: "Topraklama",
    MRN: "Marin Elektrik",
  };

  return categories[prefix] ?? "Genel";
}

const surplusDemoCodes = [
  "DEMO-KBL-011",
  "DEMO-KBL-012",
  "DEMO-KBL-013",
  "DEMO-KBL-014",
  "DEMO-KBL-015",
];

// The first sheet is deliberately limited to the three columns parsed by the
// application. The second sheet records the expected outcome without affecting
// the upload parser, which only reads the first sheet.
const quoteRows = [
  ["Ürün Adı", "Miktar", "Birim"],
  ["NYY 3x1.5mm² Bakır Kablo", 350, "metre"],
  ["NYY 4x6mm² Bakır Kablo", 120, "metre"],
  ["H07V-K 1x2.5mm² Esnek Kablo", 500, "metre"],
  ["NEK 606 Gemi Tipi Kablo 4x2.5mm²", 140, "metre"],
  ["Pirinç Kablo Rakoru M20", 80, "adet"],
  ["Duvar Tipi Metal Elektrik Panosu 600x800mm", 3, "adet"],
  ["Otomatik Sigorta 1P 16A C Tipi", 60, "adet"],
  ["LED Etanj Armatür 120cm 36W IP65", 24, "adet"],
  ["Acil Çıkış Armatürü LED 3 Saat", 12, "adet"],
  ["IP67 Su Geçirmez Buat 100x100mm", 40, "adet"],
  ["CEE Norm Priz 32A 3P+E", 18, "adet"],
  ["Galvaniz Kablo Kanalı 200x50mm", 75, "metre"],
  ["PLC Giriş Modülü 16DI 24VDC", 4, "adet"],
  ["Duman Dedektörü Optik 24VDC", 20, "adet"],
  ["Topraklama Kablosu 16mm² Sarı Yeşil", 220, "metre"],
  ["Marin Akü Şalteri 300A", 6, "adet"],
  ["Gemi Tipi Güverte Armatürü 24V", 8, "adet"],
  ["Paslanmaz Çelik Halat 8mm", 120, "metre"],
  ["Deniz Suyu Filtre Kartuşu 10 İnç", 15, "adet"],
  ["Pnömatik Perçin Tabancası", 2, "adet"],
  ["Silikon Mastik Şeffaf 300ml", 48, "adet"],
  ["UV Sterilizasyon Modülü 24V", 5, "adet"],
  ["Hidrolik Hortum 1/2 İnç", 30, "metre"],
  ["Titanyum Subsea İyonizer 4000", 1, "adet"],
];

const expectedRows = [
  ["Satır", "Ürün Adı", "Beklenen sonuç"],
  ...quoteRows.slice(1).map((row, index) => [
    index + 2,
    row[0],
    index < 17 ? "Katalogla eşleşmeli" : "Katalogla eşleşmemeli",
  ]),
];

async function main() {
  const existing = await prisma.urun.findMany({
    where: { kod: { in: catalogProducts.map((product) => product.kod) } },
    select: { kod: true },
  });

  await prisma.$transaction(
    catalogProducts.map((product) =>
      prisma.urun.upsert({
        where: { kod: product.kod },
        create: product,
        update: { kategori: product.kategori },
      }),
    ),
  );
  const removedSurplusDemoProducts = await prisma.urun.deleteMany({
    where: { kod: { in: surplusDemoCodes } },
  });

  const workbook = XLSX.utils.book_new();
  const quoteSheet = XLSX.utils.aoa_to_sheet(quoteRows);
  const expectedSheet = XLSX.utils.aoa_to_sheet(expectedRows);

  quoteSheet["!cols"] = [{ wch: 52 }, { wch: 12 }, { wch: 12 }];
  expectedSheet["!cols"] = [{ wch: 10 }, { wch: 52 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, quoteSheet, "Teklif Kalemleri");
  XLSX.utils.book_append_sheet(workbook, expectedSheet, "Beklenen Sonuç");

  const outputDirectory = join(process.cwd(), "ornekler");
  const outputPath = join(outputDirectory, "ai-teklif-eslestirme-testi.xls");
  mkdirSync(outputDirectory, { recursive: true });
  XLSX.writeFile(workbook, outputPath, { bookType: "biff8" });

  const totalCatalogProducts = await prisma.urun.count();
  console.log(
    JSON.stringify(
      {
        addedCatalogProducts: catalogProducts.length - existing.length,
        existingDemoCatalogProducts: existing.length,
        removedSurplusDemoProducts: removedSurplusDemoProducts.count,
        totalCatalogProducts,
        uploadFile: outputPath,
        uploadRows: quoteRows.length - 1,
        expectedMatches: 17,
        expectedNonMatches: 7,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
