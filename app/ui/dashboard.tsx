import Link from "next/link";
import { PeriodFilter } from "@/app/ui/period-filter";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  ClipboardCheck,
  FilePlus2,
  Package,
  Sparkles,
  Target,
} from "lucide-react";
import { formatMoney, formatNumber } from "@/lib/format";

export type DashboardData = {
  productCount: number;
  quoteCount: number;
  totalOfferValue: number;
  acceptedOfferValue: number;
  waitingOfferValue: number;
  acceptanceRate: number;
  matching: Array<{ label: string; value: number; color: string }>;
  lifecycle: Array<{ label: string; value: number; color: string }>;
  monthly: Array<{ label: string; offered: number; accepted: number }>;
  unmatchedCategories: Array<{ label: string; value: number }>;
  catalogCategories: Array<{ label: string; value: number }>;
  confidence: Array<{ label: string; value: number; color: string }>;
  topUnmatched: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    count: number;
  }>;
  period: string;
};

export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-[#4F8A5B]">
            <BarChart3 size={15} aria-hidden="true" />
            Operasyon görünümü
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#1F2937]">
            Teklif dashboard&apos;u
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#475569]">
            Teklif performansını, eşleşme kalitesini ve katalogdaki talep boşluklarını tek ekrandan izleyin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodFilter current={data.period} />
          <Link href="/teklif" className="btn btn-primary">
            <FilePlus2 size={17} aria-hidden="true" />
            Teklifler
          </Link>
          <Link href="/katalog" className="btn btn-outline">
            <Package size={17} aria-hidden="true" />
            Katalog
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={<CircleDollarSign size={18} aria-hidden="true" />}
          label="Toplam teklif değeri"
          value={formatMoney(data.totalOfferValue)}
          detail={`${formatNumber(data.quoteCount)} teklif`}
          tone="blue"
        />
        <Metric
          icon={<Target size={18} aria-hidden="true" />}
          label="Kabul edilen teklif"
          value={formatMoney(data.acceptedOfferValue)}
          detail="Beklenen gelir"
          tone="green"
        />
        <Metric
          icon={<ClipboardCheck size={18} aria-hidden="true" />}
          label="Bekleyen teklif"
          value={formatMoney(data.waitingOfferValue)}
          detail="Gönderildi durumundaki teklifler"
          tone="blue"
        />
        <Metric
          icon={<Sparkles size={18} aria-hidden="true" />}
          label="Kabul oranı"
          value={`%${formatNumber(data.acceptanceRate)}`}
          detail="Sonuçlanan teklif tutarına göre"
          tone="green"
        />
        <Metric
          icon={<Package size={18} aria-hidden="true" />}
          label="Katalog ürünü"
          value={formatNumber(data.productCount)}
          detail="Fiyatlandırmaya hazır kayıt"
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Eşleşme kalitesi"
          description="Teklif kalemlerinin otomasyon ve inceleme dağılımı."
        >
          <div className="grid items-center gap-6 sm:grid-cols-[11rem_1fr]">
            <DonutChart segments={data.matching} />
            <Legend segments={data.matching} />
          </div>
        </SectionCard>
        <SectionCard
          title="Teklif yaşam döngüsü"
          description="Tekliflerin ticari süreçteki güncel durumu."
        >
          <div className="grid items-center gap-6 sm:grid-cols-[11rem_1fr]">
            <DonutChart segments={data.lifecycle} />
            <Legend segments={data.lifecycle} />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Aylık teklif ve kabul tutarı"
          description="Son altı ayda oluşturulan teklifler ve kabul edilen gelir."
        >
          <MonthlyChart data={data.monthly} />
        </SectionCard>
        <SectionCard
          title="Eşleşmeyen talep kategorileri"
          description="Katalog eksikliği sinyali veren aktif veya iptal edilmiş kalemler."
        >
          <HorizontalBars
            data={data.unmatchedCategories}
            emptyMessage="Henüz eşleşmeyen kalem bulunmuyor."
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="AI güven skoru dağılımı"
          description="Eşleşen aktif kalemlerin güven seviyeleri."
        >
          <ConfidenceBars data={data.confidence} />
        </SectionCard>
        <SectionCard
          title="Katalog kategori dağılımı"
          description="Mevcut katalogdaki ürünlerin kategori bazlı görünümü."
        >
          <HorizontalBars
            data={data.catalogCategories}
            emptyMessage="Katalogda kategori verisi bulunmuyor."
          />
        </SectionCard>
      </div>

      <SectionCard
        title="En sık eşleşmeyen ürünler"
        description="Katalog ekleme önceliği için ham talep listesidir."
        action={
          <Link href="/teklif" className="text-sm font-semibold text-[#2F855A] hover:text-[#276749]">
            Teklifler
            <ArrowRight className="ml-1 inline" size={15} aria-hidden="true" />
          </Link>
        }
      >
        <TopUnmatchedTable data={data.topUnmatched} />
      </SectionCard>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "slate";
}) {
  const iconClass = {
    blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    green: "border-[#B7DEC4] bg-[#E7F5EC] text-[#276749]",
    slate: "border-[#DDE8DD] bg-[#F7FAF6] text-[#475569]",
  }[tone];

  return (
    <div className="rounded-lg border border-[#DDE8DD] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
          {label}
        </div>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${iconClass}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-[#1F2937]">{value}</div>
      <div className="mt-1 text-xs font-medium text-[#64748B]">{detail}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#DDE8DD] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#DDE8DD] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1F2937]">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-5 text-[#64748B]">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DonutChart({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let start = 0;
  const gradient =
    total > 0
      ? segments
          .filter((segment) => segment.value > 0)
          .map((segment) => {
            const end = start + (segment.value / total) * 100;
            const range = `${segment.color} ${start}% ${end}%`;
            start = end;
            return range;
          })
          .join(", ")
      : "#DDE8DD 0% 100%";

  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-2xl font-semibold text-[#1F2937]">{formatNumber(total)}</div>
          <div className="mt-1 text-xs font-semibold text-[#64748B]">kalem</div>
        </div>
      </div>
    </div>
  );
}

function Legend({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  return (
    <div className="grid gap-3">
      {segments.map((segment) => (
        <div key={segment.label} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#475569]">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </div>
          <span className="text-sm font-semibold text-[#1F2937]">{formatNumber(segment.value)}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ data }: { data: DashboardData["monthly"] }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.offered, item.accepted]));

  return (
    <div className="grid h-60 grid-cols-6 items-end gap-3 border-b border-[#DDE8DD] pb-7">
      {data.map((item) => {
        const offeredHeight = `${Math.max((item.offered / max) * 100, item.offered > 0 ? 4 : 0)}%`;
        const acceptedHeight = `${Math.max((item.accepted / max) * 100, item.accepted > 0 ? 4 : 0)}%`;

        return (
          <div key={item.label} className="flex h-full min-w-0 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-1" title={`Teklif: ${formatMoney(item.offered)} · Kabul: ${formatMoney(item.accepted)}`}>
              <div className="w-3 rounded-t-sm bg-[#BFDBFE]" style={{ height: offeredHeight }} />
              <div className="w-3 rounded-t-sm bg-[#4F8A5B]" style={{ height: acceptedHeight }} />
            </div>
            <div className="mt-3 truncate text-center text-xs font-semibold text-[#64748B]">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({
  data,
  emptyMessage,
}: {
  data: Array<{ label: string; value: number }>;
  emptyMessage: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid gap-4">
      {data.slice(0, 6).map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-[#475569]">{item.label}</span>
            <span className="font-semibold text-[#1F2937]">{formatNumber(item.value)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAF4EA]">
            <div
              className="h-full rounded-full bg-[#4F8A5B]"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfidenceBars({ data }: { data: DashboardData["confidence"] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <EmptyState message="Henüz değerlendirilecek güven skoru bulunmuyor." />;
  }

  return (
    <div className="grid gap-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#475569]">{item.label}</span>
            <span className="font-semibold text-[#1F2937]">{formatNumber(item.value)} kalem</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#F7FAF6]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopUnmatchedTable({ data }: { data: DashboardData["topUnmatched"] }) {
  if (data.length === 0) {
    return <EmptyState message="Henüz katalogda karşılığı olmayan ürün talebi yok." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full divide-y divide-[#DDE8DD] text-sm">
        <thead className="text-left text-xs font-semibold uppercase tracking-normal text-[#64748B]">
          <tr>
            <th className="pb-3 pr-4">Ürün talebi</th>
            <th className="pb-3 pr-4">Kategori</th>
            <th className="pb-3 pr-4 text-right">Miktar</th>
            <th className="pb-3 text-right">Tekrar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DDE8DD]">
          {data.map((item) => (
            <tr key={`${item.name}-${item.category}`}>
              <td className="max-w-72 py-3 pr-4 font-semibold text-[#1F2937]">{item.name}</td>
              <td className="py-3 pr-4 text-[#475569]">{item.category}</td>
              <td className="whitespace-nowrap py-3 pr-4 text-right text-[#475569]">
                {formatNumber(item.quantity)} {item.unit}
              </td>
              <td className="py-3 text-right font-semibold text-[#1D4ED8]">{formatNumber(item.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-md bg-[#F7FAF6] px-4 py-8 text-center text-sm font-medium text-[#64748B]">{message}</div>;
}
