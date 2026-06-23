"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatNumber } from "@/lib/format";

type ChartSegment = {
  label: string;
  value: number;
  color: string;
};

const tooltipStyle = {
  border: "1px solid #DDE8DD",
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  color: "#1F2937",
  fontSize: "13px",
  fontWeight: 600,
};

export function DoughnutChart({ segments }: { segments: ChartSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return <EmptyChart message="Gösterilecek veri bulunmuyor." />;
  }

  return (
    <div className="h-56" role="img" aria-label="Dağılım halka grafiği">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <filter id="pie-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1F2937" floodOpacity="0.14" />
            </filter>
          </defs>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={86}
            paddingAngle={3}
            stroke="none"
            filter="url(#pie-shadow)"
          >
            {segments.map((segment) => (
              <Cell key={segment.label} fill={segment.color} />
            ))}
            <Label
              value={formatNumber(total)}
              position="center"
              fill="#1F2937"
              style={{ fontSize: "26px", fontWeight: 700 }}
            />
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value ?? 0)), "Kalem"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyBarChart({
  data,
}: {
  data: Array<{ label: string; offered: number; accepted: number }>;
}) {
  return (
    <div className="h-72" role="img" aria-label="Aylık teklif ve kabul tutarı grafiği">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: 8, bottom: 0 }} barGap={8}>
          <defs>
            <linearGradient id="offered-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="accepted-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6BB57A" />
              <stop offset="100%" stopColor="#2F855A" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#DDE8DD" strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={76}
            tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
            tickFormatter={formatCompactMoney}
          />
          <Tooltip
            cursor={{ fill: "#F7FAF6" }}
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatMoney(Number(value ?? 0)),
              name === "offered" ? "Teklif tutarı" : "Kabul edilen tutar",
            ]}
          />
          <Legend
            verticalAlign="top"
            height={34}
            iconType="circle"
            formatter={(value: string) => (value === "offered" ? "Teklif tutarı" : "Kabul edilen tutar")}
          />
          <Bar dataKey="offered" fill="url(#offered-gradient)" radius={[6, 6, 0, 0]} maxBarSize={34} />
          <Bar dataKey="accepted" fill="url(#accepted-gradient)" radius={[6, 6, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({
  data,
  emptyMessage,
  label,
}: {
  data: Array<{ label: string; value: number }>;
  emptyMessage: string;
  label: string;
}) {
  const chartData = data.slice(0, 6);

  if (chartData.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <div
      className="h-72"
      role="img"
      aria-label={label}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 2, right: 24, left: 16, bottom: 2 }}>
          <defs>
            <linearGradient id="category-gradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#4F8A5B" />
              <stop offset="100%" stopColor="#86C98E" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke="#DDE8DD" strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <YAxis
            dataKey="label"
            type="category"
            width={132}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip
            cursor={{ fill: "#F7FAF6" }}
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value ?? 0)), "Kalem"]}
          />
          <Bar dataKey="value" fill="url(#category-gradient)" radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConfidenceBarChart({ data }: { data: ChartSegment[] }) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return <EmptyChart message="Henüz değerlendirilecek güven skoru bulunmuyor." />;
  }

  return (
    <div className="h-72" role="img" aria-label="AI güven skoru dağılımı grafiği">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -14, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="#DDE8DD" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
          />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "#F7FAF6" }}
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value ?? 0)), "Kalem"]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {data.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-56 place-items-center rounded-md bg-[#F7FAF6] px-4 text-center text-sm font-medium text-[#64748B]">
      {message}
    </div>
  );
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
