import Link from "next/link";
import { ArrowRight, FilePlus2, ListFilter } from "lucide-react";
import { DURUM, TEKLIF_DURUM } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function QuoteListPage() {
  await ensureSeedData();

  const quotes = await prisma.teklif.findMany({
    orderBy: { createdAt: "desc" },
    include: { kalemler: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-[#4F8A5B]">
            <ListFilter size={15} aria-hidden="true" />
            Teklif yönetimi
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#1F2937]">
            Teklifler
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#475569]">
            Oluşturulan teklifleri, toplamlarını ve ticari durumlarını tek listeden takip edin.
          </p>
        </div>
        <Link href="/teklif/yeni" className="btn btn-primary">
          <FilePlus2 size={17} aria-hidden="true" />
          Teklif oluştur
        </Link>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#DDE8DD] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#DDE8DD] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#1F2937]">Tüm teklifler</h2>
            <p className="mt-1 text-sm font-medium text-[#64748B]">
              {formatNumber(quotes.length)} teklif listeleniyor
            </p>
          </div>
        </div>
        {quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] divide-y divide-[#DDE8DD] text-sm">
              <thead className="bg-[#EAF4EA] text-left text-xs font-semibold uppercase tracking-normal text-[#1F2937]">
                <tr>
                  <th className="px-5 py-3">Teklif</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3 text-right">Kalem</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">Toplam</th>
                  <th className="px-5 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8DD]">
                {quotes.map((quote) => {
                  const total = quote.kalemler
                    .filter((line) => line.durum !== DURUM.IPTAL_EDILDI)
                    .reduce((sum, line) => sum + (line.toplam ?? 0), 0);

                  return (
                    <tr key={quote.id} className="hover:bg-[#F7FAF6]">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-[#64748B]">
                          {quote.id}
                        </div>
                        {quote.isDemo ? (
                          <div className="mt-1 text-xs font-semibold text-[#1D4ED8]">Mock veri</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#475569]">
                        {new Intl.DateTimeFormat("tr-TR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(quote.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[#475569]">
                        {formatNumber(quote.kalemler.length)}
                      </td>
                      <td className="px-5 py-4">
                        <QuoteStatusBadge status={quote.durum} />
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[#2F855A]">
                        {formatMoney(
                          quote.durum === TEKLIF_DURUM.KABUL_EDILDI
                            ? quote.kabulEdilenTutar ?? total
                            : total,
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/teklif/${quote.id}`} className="btn btn-save btn-sm">
                          İncele
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <div className="text-base font-semibold text-[#1F2937]">Henüz teklif oluşturulmadı.</div>
            <p className="mt-2 text-sm font-medium text-[#64748B]">
              İlk teklifini oluşturmak için aşağıdaki düğmeyi kullanabilirsin.
            </p>
            <Link href="/teklif/yeni" className="btn btn-primary mt-5">
              <FilePlus2 size={17} aria-hidden="true" />
              Teklif oluştur
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const statusInfo = {
    taslak: { label: "Taslak", className: "bg-[#F7FAF6] text-[#475569]" },
    gonderildi: { label: "Gönderildi", className: "bg-[#EFF6FF] text-[#1D4ED8]" },
    kabul_edildi: { label: "Kabul edildi", className: "bg-[#E7F5EC] text-[#276749]" },
    reddedildi: { label: "Reddedildi", className: "bg-[#FEF3F2] text-[#912018]" },
  }[status] ?? { label: status, className: "bg-[#F7FAF6] text-[#475569]" };

  return (
    <span className={`inline-flex rounded-md px-3 py-1.5 text-xs font-semibold ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
}
