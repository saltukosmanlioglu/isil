"use client";

import { useActionState, useState } from "react";
import {
  ClipboardList,
  FileSpreadsheet,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { createQuoteAction, type QuoteActionState } from "@/app/actions";

const initialState: QuoteActionState = {
  error: null,
};

type ManualRow = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
};

const initialManualRows: ManualRow[] = [
  { id: 1, name: "", quantity: "1", unit: "adet" },
];

export function NewQuoteForm() {
  const [mode, setMode] = useState<"file" | "manual">("file");
  const [manualRows, setManualRows] = useState(initialManualRows);
  const [state, formAction, pending] = useActionState(
    createQuoteAction,
    initialState,
  );
  const manualText = manualRows
    .filter((row) => row.name.trim())
    .map((row) => `${row.quantity || "1"} ${row.unit} ${row.name.trim()}`)
    .join("\n");

  const updateManualRow = (id: number, patch: Partial<ManualRow>) => {
    setManualRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addManualRow = () => {
    setManualRows((rows) => [
      ...rows,
      {
        id: Math.max(...rows.map((row) => row.id)) + 1,
        name: "",
        quantity: "1",
        unit: "adet",
      },
    ]);
  };

  const removeManualRow = (id: number) => {
    setManualRows((rows) =>
      rows.length > 1 ? rows.filter((row) => row.id !== id) : rows,
    );
  };

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[#DDE8DD] bg-white shadow-sm"
    >
      <input type="hidden" name="mode" value={mode} />

      <div className="border-b border-[#DDE8DD] bg-[#EAF4EA] px-5 py-4">
        <div className="text-base font-semibold text-[#1F2937]">Girdi yöntemi</div>
        <div className="mt-3 inline-grid grid-cols-2 overflow-hidden rounded-md border border-[#DDE8DD] bg-white">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`btn btn-segment ${
              mode === "file"
                ? "bg-[#4F8A5B] text-white"
                : "text-[#1F2937] hover:bg-[#EAF4EA]"
            }`}
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            Dosya
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`btn btn-segment ${
              mode === "manual"
                ? "bg-[#4F8A5B] text-white"
                : "text-[#1F2937] hover:bg-[#EAF4EA]"
            }`}
          >
            <ClipboardList size={16} aria-hidden="true" />
            Manuel
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        {mode === "file" ? (
          <label className="grid gap-2 text-sm font-semibold text-[#475569]">
            Excel, PDF veya Word dosyası
            <input
              name="file"
              type="file"
              accept=".xlsx,.xls,.pdf,.docx"
              className="block w-full rounded-md border border-dashed border-[#DDE8DD] bg-white px-3 py-4 text-sm text-[#1F2937] file:mr-4 file:rounded-md file:border-0 file:bg-[#4F8A5B] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-[#4F8A5B]"
            />
          </label>
        ) : (
          <ManualItemsTable
            rows={manualRows}
            onAddRow={addManualRow}
            onRemoveRow={removeManualRow}
            onUpdateRow={updateManualRow}
          />
        )}

        <input type="hidden" name="manualText" value={manualText} />

        {state.error ? (
          <p className="rounded-md border border-[#F7C4C0] bg-[#FEF3F2] px-3 py-2 text-sm font-medium text-[#912018]">
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-[#DDE8DD] pt-4">
          <button type="submit" disabled={pending} className="btn btn-primary">
            <WandSparkles size={17} aria-hidden="true" />
            {pending ? "Oluşturuluyor" : "Teklifi Oluştur"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ManualItemsTable({
  rows,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: {
  rows: ManualRow[];
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onUpdateRow: (id: number, patch: Partial<ManualRow>) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#DDE8DD]">
      <div className="flex flex-col gap-3 border-b border-[#DDE8DD] bg-[#F7FAF6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#1F2937]">Malzeme kalemleri</h2>
          <p className="mt-1 text-xs font-medium text-[#64748B]">
            Her satıra ürün adı, miktar ve birim girin.
          </p>
        </div>
        <button type="button" onClick={onAddRow} className="btn btn-save btn-sm">
          <Plus size={15} aria-hidden="true" />
          Satır ekle
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] divide-y divide-[#DDE8DD] text-sm">
          <thead className="bg-[#EAF4EA] text-left text-xs font-semibold uppercase tracking-normal text-[#1F2937]">
            <tr>
              <th className="px-4 py-3">Ürün adı</th>
              <th className="w-36 px-4 py-3 text-right">Miktar</th>
              <th className="w-44 px-4 py-3">Birim</th>
              <th className="w-16 px-4 py-3 text-right">Sil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE8DD] bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <input
                    value={row.name}
                    onChange={(event) => onUpdateRow(row.id, { name: event.target.value })}
                    placeholder="Örn. NYY 3x2.5mm² Kablo"
                    className="h-10 w-full rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition placeholder:text-[#64748B] focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.quantity}
                    onChange={(event) => onUpdateRow(row.id, { quantity: event.target.value })}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="h-10 w-full rounded-md border border-[#DDE8DD] bg-white px-3 text-right text-sm font-medium text-[#1F2937] outline-none transition focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.unit}
                    onChange={(event) => onUpdateRow(row.id, { unit: event.target.value })}
                    className="h-10 w-full rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
                  >
                    <option value="adet">Adet</option>
                    <option value="metre">Metre</option>
                    <option value="kg">Kilogram</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    disabled={rows.length === 1}
                    aria-label="Satırı sil"
                    title="Satırı sil"
                    className="btn btn-danger btn-sm btn-icon-only"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
