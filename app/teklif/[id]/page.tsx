import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { QuoteTable } from "@/app/ui/quote-table";
import { productToClient, quoteToClient } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function QuoteResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSeedData();

  const [quote, products] = await Promise.all([
    prisma.teklif.findUnique({
      where: { id },
      include: {
        kalemler: true,
      },
    }),
    prisma.urun.findMany({
      orderBy: { kod: "asc" },
    }),
  ]);

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/"
            className="btn btn-outline btn-sm mb-3"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Panele dön
          </Link>
          <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
            Teklif Kaydı
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#1F2937]">
            Teklif sonucu
          </h1>
          <p className="mt-2 text-sm font-medium text-[#475569]">
            {new Intl.DateTimeFormat("tr-TR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(quote.createdAt)}
          </p>
        </div>
        <Link
          href="/teklif/yeni"
          className="btn btn-outline"
        >
          <FilePlus2 size={17} aria-hidden="true" />
          Yeni Teklif
        </Link>
      </div>

      <QuoteTable
        quote={quoteToClient(quote)}
        products={products.map(productToClient)}
      />
    </div>
  );
}
