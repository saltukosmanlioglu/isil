import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });
const shouldOnlyClear = process.argv.includes("--clear");

const unmatchedDemands = [
  { name: "Paslanmaz Çelik Halat 8mm", category: "Marin Elektrik", unit: "metre" },
  { name: "Deniz Suyu Filtre Kartuşu 10 İnç", category: "Genel", unit: "adet" },
  { name: "Pnömatik Perçin Tabancası", category: "Bağlantı ve Aksesuar", unit: "adet" },
  { name: "Silikon Mastik Şeffaf 300ml", category: "Genel", unit: "adet" },
  { name: "UV Sterilizasyon Modülü 24V", category: "Otomasyon", unit: "adet" },
  { name: "Hidrolik Hortum 1/2 İnç", category: "Genel", unit: "metre" },
];

async function main() {
  const removed = await prisma.teklif.deleteMany({
    where: { isDemo: true },
  });

  if (shouldOnlyClear) {
    console.log(JSON.stringify({ removedMockQuotes: removed.count }, null, 2));
    return;
  }

  const products = await prisma.urun.findMany({
    orderBy: { kod: "asc" },
  });

  if (products.length < 6) {
    throw new Error("Mock dashboard verisi için katalogda en az 6 ürün gerekli.");
  }

  const now = new Date();
  const quotes = Array.from({ length: 42 }, (_, index) => {
    const createdAt = dateInPastMonths(now, index);
    const status = quoteStatusFor(index);
    const lines = buildLines(products, index);
    const total = lines
      .filter((line) => line.durum !== "iptal_edildi")
      .reduce((sum, line) => sum + (line.toplam ?? 0), 0);

    return {
      createdAt,
      durum: status,
      gonderildiAt: status === "taslak" ? null : addDays(createdAt, 1),
      kabulEdildiAt: status === "kabul_edildi" ? addDays(createdAt, 5) : null,
      reddedildiAt: status === "reddedildi" ? addDays(createdAt, 6) : null,
      kabulEdilenTutar: status === "kabul_edildi" ? roundMoney(total) : null,
      isDemo: true,
      kalemler: {
        create: lines,
      },
    };
  });

  await prisma.$transaction(
    quotes.map((quote) =>
      prisma.teklif.create({
        data: quote,
      }),
    ),
  );

  const [statusCounts, lineStatusCounts, totalMockQuotes] = await Promise.all([
    prisma.teklif.groupBy({
      by: ["durum"],
      where: { isDemo: true },
      _count: { _all: true },
      orderBy: { durum: "asc" },
    }),
    prisma.teklifKalemi.groupBy({
      by: ["durum"],
      where: { teklif: { isDemo: true } },
      _count: { _all: true },
      orderBy: { durum: "asc" },
    }),
    prisma.teklif.count({ where: { isDemo: true } }),
  ]);

  console.log(
    JSON.stringify(
      {
        removedPreviousMockQuotes: removed.count,
        createdMockQuotes: totalMockQuotes,
        statusCounts,
        lineStatusCounts,
      },
      null,
      2,
    ),
  );
}

function buildLines(products, quoteIndex) {
  const first = products[(quoteIndex * 3) % products.length];
  const second = products[(quoteIndex * 7 + 5) % products.length];
  const third = products[(quoteIndex * 11 + 9) % products.length];
  const demand = unmatchedDemands[quoteIndex % unmatchedDemands.length];
  const quantity = 8 + ((quoteIndex * 13) % 55);
  const highConfidence = 0.89 + ((quoteIndex % 8) * 0.01);

  const lines = [
    matchedLine(first, quantity, highConfidence, "otomatik"),
    matchedLine(second, 3 + ((quoteIndex * 5) % 20), 0.78, "manuel_onaylandi"),
    matchedLine(third, 5 + ((quoteIndex * 9) % 25), 0.64, "manuel_inceleme"),
  ];

  if (quoteIndex % 2 === 0) {
    lines.push({
      hamMetin: demand.name,
      miktar: 2 + ((quoteIndex * 4) % 40),
      birim: demand.unit,
      eslesenUrunKodu: null,
      kategori: demand.category,
      guvenSkoru: 0.18,
      durum: "manuel_inceleme",
      birimFiyat: null,
      toplam: null,
      sebep: "Katalogda eşleşen ürün bulunamadı",
    });
  }

  if (quoteIndex % 3 === 0) {
    const cancelledDemand = unmatchedDemands[(quoteIndex + 2) % unmatchedDemands.length];
    lines.push({
      hamMetin: cancelledDemand.name,
      miktar: 1 + ((quoteIndex * 3) % 20),
      birim: cancelledDemand.unit,
      eslesenUrunKodu: null,
      kategori: cancelledDemand.category,
      guvenSkoru: 0.15,
      durum: "iptal_edildi",
      birimFiyat: null,
      toplam: null,
      sebep: "Teklif kalemi iptal edildi",
    });
  }

  return lines;
}

function matchedLine(product, quantity, confidence, status) {
  const unitPrice = roundMoney(product.maliyet * (1 + product.marjYuzdesi / 100));
  const shouldPrice = status !== "manuel_inceleme";

  return {
    hamMetin: `${quantity} ${product.birim} ${product.ad}`,
    miktar: quantity,
    birim: product.birim,
    eslesenUrunKodu: product.kod,
    kategori: product.kategori,
    guvenSkoru: confidence,
    durum: status,
    birimFiyat: shouldPrice ? unitPrice : null,
    toplam: shouldPrice ? roundMoney(unitPrice * quantity) : null,
    sebep: status === "manuel_inceleme" ? "Güven skoru düşük" : null,
  };
}

function quoteStatusFor(index) {
  const statuses = [
    "kabul_edildi",
    "gonderildi",
    "taslak",
    "reddedildi",
    "kabul_edildi",
    "gonderildi",
    "taslak",
  ];

  return statuses[index % statuses.length];
}

function dateInPastMonths(now, index) {
  const monthOffset = index % 6;
  const maxDay = monthOffset === 0 ? Math.max(1, now.getDate() - 1) : 25;
  const day = 2 + ((index * 7) % Math.max(1, maxDay - 1));
  return new Date(now.getFullYear(), now.getMonth() - monthOffset, day, 10, 30);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
