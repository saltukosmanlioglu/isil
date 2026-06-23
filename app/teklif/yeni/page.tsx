import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { NewQuoteForm } from "@/app/ui/new-quote-form";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  await ensureSeedData();
  const productCount = await prisma.urun.count();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="space-y-6">
        <div>
          <Link href="/teklif" className="btn btn-outline btn-sm mb-3">
            <ArrowLeft size={16} aria-hidden="true" />
            Teklif listesine dön
          </Link>
          <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
            Teklif İşlemi
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#1F2937]">
            Teklif oluştur
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#475569]">
            Excel, PDF, Word veya tablo üzerinden manuel malzeme girişiyle teklif oluşturun.
          </p>
        </div>
        <NewQuoteForm />
      </section>

      <aside className="h-fit rounded-lg border border-[#DDE8DD] bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
          Katalog durumu
        </div>
        <div className="mt-2 text-3xl font-semibold text-[#1F2937]">
          {productCount}
        </div>
        <div className="mt-1 text-sm font-medium text-[#475569]">
          ürün fiyatlandırmaya hazır
        </div>
        <Link href="/katalog" className="btn btn-outline btn-sm mt-4">
          Kataloğu aç
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </aside>
    </div>
  );
}
