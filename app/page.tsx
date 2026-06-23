import type { Teklif, TeklifKalemi, Urun } from "@prisma/client";
import { Dashboard, type DashboardData } from "@/app/ui/dashboard";
import { DURUM, TEKLIF_DURUM } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

type QuoteRecord = Teklif & { kalemler: TeklifKalemi[] };

const VALID_PERIODS = ["30", "90", "180", "all"] as const;
type Period = (typeof VALID_PERIODS)[number];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await ensureSeedData();

  const raw = await searchParams;
  const period: Period = VALID_PERIODS.includes(String(raw.period) as Period)
    ? (String(raw.period) as Period)
    : "90";

  const since =
    period === "all"
      ? undefined
      : new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

  const [products, quotes] = await Promise.all([
    prisma.urun.findMany({ orderBy: { kod: "asc" } }),
    prisma.teklif.findMany({
      where: since ? { createdAt: { gte: since } } : undefined,
      orderBy: { createdAt: "desc" },
      include: { kalemler: true },
    }),
  ]);

  return <Dashboard data={createDashboardData(products, quotes, period)} />;
}

function periodToMonths(period: Period): number {
  if (period === "30") return 2;
  if (period === "90") return 3;
  if (period === "180") return 6;
  return 12;
}

function createDashboardData(products: Urun[], quotes: QuoteRecord[], period: Period): DashboardData {
  const quoteTotals = new Map(quotes.map((quote) => [quote.id, quoteTotal(quote)]));
  const allLines = quotes.flatMap((quote) => quote.kalemler);
  const activeLines = allLines.filter((line) => line.durum !== DURUM.IPTAL_EDILDI);
  // Lines with no catalog match that haven't been resolved via custom pricing
  const unmatchedLines = allLines.filter(
    (line) => !line.eslesenUrunKodu && line.durum !== DURUM.MANUEL_ONAYLANDI,
  );
  const acceptedQuotes = quotes.filter(
    (quote) => quote.durum === TEKLIF_DURUM.KABUL_EDILDI,
  );
  const rejectedQuotes = quotes.filter(
    (quote) => quote.durum === TEKLIF_DURUM.REDDEDILDI,
  );
  const resolvedQuoteValue =
    acceptedQuotes.reduce(
      (total, quote) => total + (quote.kabulEdilenTutar ?? quoteTotals.get(quote.id) ?? 0),
      0,
    ) +
    rejectedQuotes.reduce((total, quote) => total + (quote.reddedildiTutar ?? quoteTotals.get(quote.id) ?? 0), 0);
  const acceptedOfferValue = acceptedQuotes.reduce(
    (total, quote) => total + (quote.kabulEdilenTutar ?? quoteTotals.get(quote.id) ?? 0),
    0,
  );

  return {
    productCount: products.length,
    quoteCount: quotes.length,
    totalOfferValue: Array.from(quoteTotals.values()).reduce((total, value) => total + value, 0),
    acceptedOfferValue,
    waitingOfferValue: quotes
      .filter((quote) => quote.durum === TEKLIF_DURUM.GONDERILDI)
      .reduce((total, quote) => total + (quoteTotals.get(quote.id) ?? 0), 0),
    acceptanceRate: resolvedQuoteValue > 0 ? (acceptedOfferValue / resolvedQuoteValue) * 100 : 0,
    matching: [
      {
        label: "Otomatik eşleşen",
        value: activeLines.filter((line) => line.durum === DURUM.OTOMATIK).length,
        color: "#4F8A5B",
      },
      {
        label: "Manuel onaylanan",
        value: activeLines.filter((line) => line.durum === DURUM.MANUEL_ONAYLANDI).length,
        color: "#1D4ED8",
      },
      {
        label: "İnceleme bekleyen",
        value: activeLines.filter(
          (line) => !!line.eslesenUrunKodu && line.durum === DURUM.MANUEL_INCELEME,
        ).length,
        color: "#D97706",
      },
      {
        label: "Eşleşme bekleyen",
        value: activeLines.filter(
          (line) => !line.eslesenUrunKodu && line.durum === DURUM.MANUEL_INCELEME,
        ).length,
        color: "#64748B",
      },
      {
        label: "İptal edilen",
        value: allLines.filter((line) => line.durum === DURUM.IPTAL_EDILDI).length,
        color: "#DC2626",
      },
    ],
    lifecycle: [
      {
        label: "Taslak",
        value: quotes.filter((quote) => quote.durum === TEKLIF_DURUM.TASLAK).length,
        color: "#64748B",
      },
      {
        label: "Gönderildi",
        value: quotes.filter((quote) => quote.durum === TEKLIF_DURUM.GONDERILDI).length,
        color: "#1D4ED8",
      },
      {
        label: "Kabul edildi",
        value: acceptedQuotes.length,
        color: "#4F8A5B",
      },
      {
        label: "Reddedildi",
        value: rejectedQuotes.length,
        color: "#DC2626",
      },
    ],
    monthly: monthlyData(quotes, quoteTotals, periodToMonths(period)),
    period,
    unmatchedCategories: groupedCounts(unmatchedLines, (line) => line.kategori ?? "Kategorisiz"),
    catalogCategories: groupedCounts(products, (product) => product.kategori),
    confidence: confidenceBuckets(activeLines),
    topUnmatched: topUnmatched(unmatchedLines),
  };
}

function quoteTotal(quote: QuoteRecord) {
  return quote.kalemler
    .filter((line) => line.durum !== DURUM.IPTAL_EDILDI)
    .reduce((total, line) => total + (line.toplam ?? 0), 0);
}

function monthlyData(quotes: QuoteRecord[], quoteTotals: Map<string, number>, months: number) {
  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const now = new Date();

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const isInMonth = (value: Date | null) =>
      value !== null && value.getMonth() === month && value.getFullYear() === year;

    return {
      label: formatter.format(date),
      offered: quotes
        .filter((quote) => isInMonth(quote.createdAt))
        .reduce((total, quote) => total + (quoteTotals.get(quote.id) ?? 0), 0),
      accepted: quotes
        .filter((quote) => isInMonth(quote.kabulEdildiAt))
        .reduce(
          (total, quote) => total + (quote.kabulEdilenTutar ?? quoteTotals.get(quote.id) ?? 0),
          0,
        ),
    };
  });
}

function groupedCounts<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item).trim() || "Kategorisiz";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts, ([label, value]) => ({ label, value })).sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label, "tr"),
  );
}

function confidenceBuckets(lines: TeklifKalemi[]) {
  const buckets = [
    { label: "Yüksek güven (%85+)", value: 0, color: "#4F8A5B" },
    { label: "Orta güven (%70-%84)", value: 0, color: "#1D4ED8" },
    { label: "Düşük güven (%70 altı)", value: 0, color: "#DC2626" },
  ];

  for (const line of lines) {
    if (!line.eslesenUrunKodu || line.guvenSkoru === null) {
      continue;
    }

    if (line.guvenSkoru >= 0.85) {
      buckets[0].value += 1;
    } else if (line.guvenSkoru >= 0.7) {
      buckets[1].value += 1;
    } else {
      buckets[2].value += 1;
    }
  }

  return buckets;
}

function topUnmatched(lines: TeklifKalemi[]) {
  const items = new Map<
    string,
    { name: string; category: string; quantity: number; unit: string; count: number }
  >();

  for (const line of lines) {
    const category = line.kategori ?? "Kategorisiz";
    const key = `${line.hamMetin.toLocaleLowerCase("tr-TR")}|${category}|${line.birim}`;
    const current = items.get(key) ?? {
      name: line.hamMetin,
      category,
      quantity: 0,
      unit: line.birim,
      count: 0,
    };

    current.quantity += line.miktar;
    current.count += 1;
    items.set(key, current);
  }

  return Array.from(items.values())
    .sort((left, right) => right.count - left.count || right.quantity - left.quantity)
    .slice(0, 5);
}
