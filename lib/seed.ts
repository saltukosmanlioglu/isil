import { prisma } from "@/lib/prisma";
import type { ProductInput } from "@/lib/types";

export const SAMPLE_PRODUCTS: ProductInput[] = [
  {
    kod: "KBL-001",
    ad: "NYY 3x2.5mm² Kablo",
    kategori: "Kablo",
    birim: "metre",
    maliyet: 18,
    marjYuzdesi: 12,
    esikMiktar: 500,
  },
  {
    kod: "KBL-045",
    ad: "NEK 606 Gemi Tip Kablo 4x1.5mm²",
    kategori: "Kablo",
    birim: "metre",
    maliyet: 26,
    marjYuzdesi: 12,
    esikMiktar: 1000,
  },
  {
    kod: "JCT-010",
    ad: "IP67 Su Geçirmez Junction Box",
    kategori: "Konnektör ve Priz",
    birim: "adet",
    maliyet: 145,
    marjYuzdesi: 15,
    esikMiktar: 50,
  },
  {
    kod: "ARM-203",
    ad: "ATEX Sertifikalı Aydınlatma Armatürü",
    kategori: "Aydınlatma",
    birim: "adet",
    maliyet: 890,
    marjYuzdesi: 10,
    esikMiktar: 20,
  },
  {
    kod: "KLM-077",
    ad: "Kablo Bağlantı Klemensi",
    kategori: "Bağlantı ve Aksesuar",
    birim: "adet",
    maliyet: 4.5,
    marjYuzdesi: 20,
    esikMiktar: 200,
  },
  {
    kod: "PNL-012",
    ad: "Dağıtım Panosu 24 Çıkışlı",
    kategori: "Pano ve Şalt",
    birim: "adet",
    maliyet: 2150,
    marjYuzdesi: 8,
    esikMiktar: 5,
  },
  {
    kod: "KNT-030",
    ad: "IP68 Endüstriyel Konnektör",
    kategori: "Konnektör ve Priz",
    birim: "adet",
    maliyet: 62,
    marjYuzdesi: 18,
    esikMiktar: 100,
  },
  {
    kod: "SVC-005",
    ad: "Kablo Kanalı Galvaniz 100mm",
    kategori: "Kablo Kanalı ve Boru",
    birim: "metre",
    maliyet: 9,
    marjYuzdesi: 14,
    esikMiktar: 800,
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureSeedData() {
  seedPromise ??= seedCatalog().catch((error) => {
    seedPromise = null;
    throw error;
  });
  await seedPromise;
}

async function seedCatalog() {
  const count = await prisma.urun.count();

  if (count === 0) {
    await prisma.urun.createMany({
      data: SAMPLE_PRODUCTS,
    });
  }

  await prisma.$transaction(
    SAMPLE_PRODUCTS.map((product) =>
      prisma.urun.updateMany({
        where: { kod: product.kod, kategori: "Genel" },
        data: { kategori: product.kategori },
      }),
    ),
  );

  const [products, lines] = await Promise.all([
    prisma.urun.findMany({ select: { kod: true, kategori: true } }),
    prisma.teklifKalemi.findMany({
      where: {
        kategori: null,
        eslesenUrunKodu: { not: null },
      },
      select: { id: true, eslesenUrunKodu: true },
    }),
  ]);
  const categoryByCode = new Map(products.map((product) => [product.kod, product.kategori]));
  const updates = lines.flatMap((line) => {
    const kategori = line.eslesenUrunKodu
      ? categoryByCode.get(line.eslesenUrunKodu)
      : undefined;

    return kategori
      ? [prisma.teklifKalemi.update({ where: { id: line.id }, data: { kategori } })]
      : [];
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}
