import Link from "next/link";

const PERIODS = [
  { label: "30 gün", value: "30" },
  { label: "90 gün", value: "90" },
  { label: "6 ay", value: "180" },
  { label: "Tümü", value: "all" },
];

export function PeriodFilter({ current }: { current: string }) {
  return (
    <div className="flex gap-1 rounded-lg border border-[#DDE8DD] bg-[#F7FAF6] p-1">
      {PERIODS.map(({ label, value }) => {
        const isActive = current === value;
        return (
          <Link
            key={value}
            href={`/?period=${value}`}
            className={
              isActive
                ? "rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] shadow-sm"
                : "rounded-md px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#1F2937]"
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
