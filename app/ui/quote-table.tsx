"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  FilePenLine,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  approveLineWithCustomPriceAction,
  approveLineWithProductAction,
  cancelQuoteLineAction,
  updateQuoteStatusAction,
} from "@/app/actions";
import { Modal } from "@/app/ui/modal";
import { DURUM, TEKLIF_DURUM, URUN_KATEGORILERI } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/format";
import type {
  ProductForClient,
  QuoteForClient,
  QuoteLineForClient,
  QuoteLineStatus,
  QuoteStatus,
} from "@/lib/types";

type QuoteModal =
  | { type: "product"; line: QuoteLineForClient }
  | { type: "custom"; line: QuoteLineForClient }
  | { type: "cancel"; line: QuoteLineForClient }
  | null;

type QuoteTab = "matched" | "unmatched";

export function QuoteTable({
  quote,
  products,
}: {
  quote: QuoteForClient;
  products: ProductForClient[];
}) {
  const [modal, setModal] = useState<QuoteModal>(null);
  const [activeTab, setActiveTab] = useState<QuoteTab>("matched");
  const productByCode = new Map(products.map((product) => [product.kod, product]));
  const activeLines = quote.kalemler.filter(
    (line) => line.durum !== DURUM.IPTAL_EDILDI,
  );
  const matchedLines = activeLines.filter(
    (line) => line.eslesenUrunKodu || line.durum === DURUM.MANUEL_ONAYLANDI,
  );
  const unmatchedLines = activeLines.filter(
    (line) => !line.eslesenUrunKodu && line.durum !== DURUM.MANUEL_ONAYLANDI,
  );
  const cancelledLines = quote.kalemler.filter(
    (line) => line.durum === DURUM.IPTAL_EDILDI,
  );
  const displayedLines = activeTab === "matched" ? matchedLines : unmatchedLines;
  const automaticTotal = sumByStatus(quote, DURUM.OTOMATIK);
  const manualTotal = sumByStatus(quote, DURUM.MANUEL_ONAYLANDI);
  const pendingCount = quote.kalemler.filter(
    (line) => line.durum === DURUM.MANUEL_INCELEME,
  ).length;
  const grandTotal = automaticTotal + manualTotal;

  return (
    <div className="space-y-4">
      <QuoteStatusControl quote={quote} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary label="Otomatik toplam" value={formatMoney(automaticTotal)} tone="money" />
        <Summary label="Manuel onaylı toplam" value={formatMoney(manualTotal)} tone="money" />
        <Summary label="Genel toplam" value={formatMoney(grandTotal)} tone="moneyStrong" />
        <Summary label="Bekleyen kalem" value={formatNumber(pendingCount)} tone="approval" />
        <Summary label="Eşleşmeyen ürün" value={formatNumber(unmatchedLines.length)} tone="approval" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#DDE8DD] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#DDE8DD] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F2937]">Teklif kalemleri</h2>
            <p className="mt-1 text-sm font-medium text-[#64748B]">
              {activeTab === "matched"
                ? "Eşleşen kalemlerin otomatik veya manuel fiyatlandırma durumunu inceleyin."
                : "Eşleşmeyen kalemleri katalog ürünüyle onaylayın, özel fiyatlandırın veya tekliften çıkarın."}
            </p>
          </div>
          <div className="text-sm font-semibold text-[#475569]">
            {formatNumber(displayedLines.length)} kalem gösteriliyor
            {cancelledLines.length > 0 ? ` · ${formatNumber(cancelledLines.length)} iptal` : ""}
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Teklif kalemi görünümü"
          className="flex gap-1 border-b border-[#DDE8DD] bg-[#F7FAF6] px-4 pt-3"
        >
          <TabButton
            active={activeTab === "matched"}
            count={matchedLines.length}
            id="matched-lines-tab"
            label="Eşleşen kalemler"
            onClick={() => setActiveTab("matched")}
            panelId="matched-lines-panel"
          />
          <TabButton
            active={activeTab === "unmatched"}
            count={unmatchedLines.length}
            id="unmatched-lines-tab"
            label="Eşleşmeyen ürünler"
            onClick={() => setActiveTab("unmatched")}
            panelId="unmatched-lines-panel"
          />
        </div>
        <div
          id={activeTab === "matched" ? "matched-lines-panel" : "unmatched-lines-panel"}
          role="tabpanel"
          aria-labelledby={activeTab === "matched" ? "matched-lines-tab" : "unmatched-lines-tab"}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[1120px] divide-y divide-[#DDE8DD] text-sm">
            <thead className="bg-[#EAF4EA] text-left text-xs font-semibold uppercase tracking-normal text-[#1F2937]">
              <tr>
                <th className="px-4 py-3">Ham metin</th>
                <th className="px-4 py-3">Eşleşen ürün</th>
                <th className="px-4 py-3 text-right">Miktar</th>
                <th className="px-4 py-3">Birim</th>
                <th className="px-4 py-3 text-right">Birim fiyat</th>
                <th className="px-4 py-3 text-right">Toplam</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE8DD]">
              {displayedLines.map((line) => {
                const matchedProduct = line.eslesenUrunKodu
                  ? productByCode.get(line.eslesenUrunKodu)
                  : null;

                return (
                  <tr key={line.id} className="align-top hover:bg-[#F7FAF6]">
                    <td className="max-w-72 px-4 py-4 font-medium leading-5 text-[#1F2937]">
                      {line.hamMetin}
                      {line.eslesenUrunKodu && line.sebep ? (
                        <div className="mt-1 text-xs font-semibold text-[#475569]">
                          {line.sebep}
                        </div>
                      ) : null}
                    </td>
                    <td className="min-w-64 px-4 py-4 text-[#475569]">
                      {matchedProduct ? (
                        <div>
                          <div className="font-semibold text-[#1F2937]">
                            {matchedProduct.ad}
                          </div>
                          <div className="mt-1 font-mono text-xs text-[#64748B]">
                            {matchedProduct.kod}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-[#475569]">
                      {formatNumber(line.miktar)}
                    </td>
                    <td className="px-4 py-4 text-[#475569]">{line.birim}</td>
                    <td className="px-4 py-4 text-right font-medium text-[#475569]">
                      {formatMoney(line.birimFiyat)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-[#2F855A]">
                      {formatMoney(line.toplam)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        status={line.durum}
                        unmatched={activeTab === "unmatched"}
                      />
                      {activeTab === "matched" && line.guvenSkoru !== null ? (
                        <ConfidenceScore score={line.guvenSkoru} />
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      {line.durum === DURUM.MANUEL_INCELEME ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setModal({ type: "product", line })}
                            aria-label="Katalog ürünüyle onayla"
                            title="Katalog ürünüyle onayla"
                            className={
                              activeTab === "unmatched"
                                ? "btn btn-approve btn-sm btn-icon-only"
                                : "btn btn-approve btn-sm min-w-36"
                            }
                          >
                            <ClipboardCheck size={15} aria-hidden="true" />
                            {activeTab === "matched" ? "Ürünle onayla" : null}
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ type: "custom", line })}
                            aria-label="Özel fiyat gir"
                            title="Özel fiyat gir"
                            className={
                              activeTab === "unmatched"
                                ? "btn btn-money btn-sm btn-icon-only"
                                : "btn btn-money btn-sm min-w-32"
                            }
                          >
                            <CircleDollarSign size={15} aria-hidden="true" />
                            {activeTab === "matched" ? "Özel fiyat" : null}
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ type: "cancel", line })}
                            aria-label="Kalemi iptal et"
                            title="Kalemi iptal et"
                            className="btn btn-danger btn-sm btn-icon-only"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-sm font-medium text-[#64748B]">
                          -
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayedLines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-medium text-[#64748B]">
                    {activeTab === "matched"
                      ? "Bu teklifte eşleşen bir ürün yok."
                      : "Bu teklifte eşleşmeyen ürün yok."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal?.type === "product"}
        title="Ürün seçimi onayı"
        description="Seçilen katalog ürünü maliyet ve marj formülüyle fiyatlandırılır."
        onClose={() => setModal(null)}
      >
        {modal?.type === "product" ? (
          <ProductApprovalForm
            quoteId={quote.id}
            line={modal.line}
            products={products}
            onSubmit={() => setModal(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={modal?.type === "custom"}
        title="Özel fiyat onayı"
        description="Girilen birim fiyat doğrudan satır toplamına uygulanır."
        onClose={() => setModal(null)}
      >
        {modal?.type === "custom" ? (
          <CustomPriceApprovalForm
            quoteId={quote.id}
            line={modal.line}
            onSubmit={() => setModal(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={modal?.type === "cancel"}
        title="Kalemi iptal et"
        description="İptal edilen kalem teklif toplamından çıkarılır ve dashboard raporlarında kategori bazında tutulur."
        onClose={() => setModal(null)}
      >
        {modal?.type === "cancel" ? (
          <CancelLineForm
            quoteId={quote.id}
            line={modal.line}
            onSubmit={() => setModal(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function QuoteStatusControl({ quote }: { quote: QuoteForClient }) {
  const statusInfo: Record<
    QuoteStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    taslak: {
      label: "Taslak",
      className: "border-[#DDE8DD] bg-[#F7FAF6] text-[#475569]",
      icon: <FilePenLine size={15} aria-hidden="true" />,
    },
    gonderildi: {
      label: "Gönderildi",
      className: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
      icon: <Send size={15} aria-hidden="true" />,
    },
    kabul_edildi: {
      label: "Kabul edildi",
      className: "border-[#B7DEC4] bg-[#E7F5EC] text-[#276749]",
      icon: <BadgeCheck size={15} aria-hidden="true" />,
    },
    reddedildi: {
      label: "Reddedildi",
      className: "border-[#F7C4C0] bg-[#FEF3F2] text-[#912018]",
      icon: <XCircle size={15} aria-hidden="true" />,
    },
  };
  const current = statusInfo[quote.durum];

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-[#DDE8DD] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
          Teklif durumu
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold ${current.className}`}
          >
            {current.icon}
            {current.label}
          </span>
          {quote.durum === TEKLIF_DURUM.KABUL_EDILDI && quote.kabulEdilenTutar !== null ? (
            <span className="text-sm font-semibold text-[#276749]">
              Beklenen gelir: {formatMoney(quote.kabulEdilenTutar)}
            </span>
          ) : null}
        </div>
      </div>
      <form
        action={updateQuoteStatusAction.bind(null, quote.id)}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <select
          name="status"
          defaultValue={quote.durum}
          aria-label="Teklif durumu"
          className="h-10 rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-semibold text-[#1F2937] outline-none transition focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
        >
          <option value={TEKLIF_DURUM.TASLAK}>Taslak</option>
          <option value={TEKLIF_DURUM.GONDERILDI}>Gönderildi</option>
          <option value={TEKLIF_DURUM.KABUL_EDILDI}>Kabul edildi</option>
          <option value={TEKLIF_DURUM.REDDEDILDI}>Reddedildi</option>
        </select>
        <button type="submit" className="btn btn-save">
          Durumu güncelle
        </button>
      </form>
    </section>
  );
}

function TabButton({
  active,
  count,
  id,
  label,
  onClick,
  panelId,
}: {
  active: boolean;
  count: number;
  id: string;
  label: string;
  onClick: () => void;
  panelId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={panelId}
      aria-selected={active}
      onClick={onClick}
      className={`rounded-t-md border border-b-0 px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#DDE8DD] bg-white text-[#2F855A]"
          : "border-transparent text-[#64748B] hover:bg-[#EAF4EA] hover:text-[#1F2937]"
      }`}
    >
      {label} ({formatNumber(count)})
    </button>
  );
}

function ProductApprovalForm({
  quoteId,
  line,
  products,
  onSubmit,
}: {
  quoteId: string;
  line: QuoteLineForClient;
  products: ProductForClient[];
  onSubmit: () => void;
}) {
  const defaultProduct =
    products.find((product) => product.kod === line.eslesenUrunKodu) ?? products[0];

  return (
    <form
      action={approveLineWithProductAction.bind(null, line.id, quoteId)}
      onSubmit={onSubmit}
      className="space-y-5"
    >
      <LineReview line={line} />
      <label className="grid gap-1 text-xs font-semibold text-[#64748B]">
        Onaylanacak katalog ürünü
        <select
          name="productId"
          className="h-10 rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
          defaultValue={defaultProduct?.id}
          required
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.kod} - {product.ad}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-medium leading-6 text-[#1D4ED8]">
        Onaylandığında satır durumu Manuel onaylandı olur ve toplam tutara dahil edilir.
      </div>
      <ModalActions
        cancelLabel="Vazgeç"
        submitLabel="Ürünle onayla"
        submitIcon={<Check size={16} aria-hidden="true" />}
        submitVariant="approve"
        onCancel={onSubmit}
      />
    </form>
  );
}

function CustomPriceApprovalForm({
  quoteId,
  line,
  onSubmit,
}: {
  quoteId: string;
  line: QuoteLineForClient;
  onSubmit: () => void;
}) {
  return (
    <form
      action={approveLineWithCustomPriceAction.bind(null, line.id, quoteId)}
      onSubmit={onSubmit}
      className="space-y-5"
    >
      <LineReview line={line} />
      <label className="grid gap-1 text-xs font-semibold text-[#64748B]">
        Özel birim fiyat
        <input
          name="unitPrice"
          type="number"
          step="0.01"
          min="0"
          required
          className="h-10 rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition focus:border-[#2F855A] focus:ring-2 focus:ring-[#EAF4EA]"
        />
      </label>
      <div className="rounded-md border border-[#B7DEC4] bg-[#EEF8F1] px-4 py-3 text-sm font-medium leading-6 text-[#2F6F43]">
        Onaylandığında bu fiyat tedarikçiden alınmış fiyat olarak kabul edilir.
      </div>
      <ModalActions
        cancelLabel="Vazgeç"
        submitLabel="Özel fiyatı onayla"
        submitIcon={<CircleDollarSign size={16} aria-hidden="true" />}
        submitVariant="money"
        onCancel={onSubmit}
      />
    </form>
  );
}

function CancelLineForm({
  quoteId,
  line,
  onSubmit,
}: {
  quoteId: string;
  line: QuoteLineForClient;
  onSubmit: () => void;
}) {
  return (
    <form
      action={cancelQuoteLineAction.bind(null, line.id, quoteId)}
      onSubmit={onSubmit}
      className="space-y-5"
    >
      <LineReview line={line} />
      <label className="grid gap-1 text-xs font-semibold text-[#64748B]">
        Talep kategorisi
        <select
          name="kategori"
          defaultValue={line.kategori ?? ""}
          required
          className="h-10 rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
        >
          <option value="" disabled>
            Kategori seçin
          </option>
          {URUN_KATEGORILERI.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-md border border-[#F7C4C0] bg-[#FEF3F2] px-4 py-3 text-sm font-medium leading-6 text-[#912018]">
        {formatNumber(line.miktar)} {line.birim} talebi, seçtiğiniz kategoriyle
        birlikte dashboard&apos;da tutulur. Kalem toplam tutara dahil edilmez ve
        ürün kataloğundaki kayıt silinmez.
      </div>
      <ModalActions
        cancelLabel="Vazgeç"
        submitLabel="Kalemi iptal et"
        submitIcon={<Trash2 size={16} aria-hidden="true" />}
        submitVariant="danger"
        onCancel={onSubmit}
      />
    </form>
  );
}

function LineReview({ line }: { line: QuoteLineForClient }) {
  return (
    <div className="grid gap-3 rounded-md border border-[#DDE8DD] bg-[#EAF4EA] px-4 py-3 text-sm">
      <DetailRow label="Ham metin" value={line.hamMetin} />
      <DetailRow label="Miktar" value={`${formatNumber(line.miktar)} ${line.birim}`} />
      {line.eslesenUrunKodu && line.sebep ? (
        <DetailRow label="Bekleme sebebi" value={line.sebep} />
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 md:grid-cols-[8rem_1fr]">
      <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
        {label}
      </div>
      <div className="font-semibold text-[#1F2937]">{value}</div>
    </div>
  );
}

function Summary({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "money" | "moneyStrong" | "approval";
}) {
  const valueClass = {
    default: "text-[#475569]",
    money: "text-[#2F855A]",
    moneyStrong: "text-[#276749]",
    approval: "text-[#1D4ED8]",
  }[tone];

  return (
    <div className="rounded-lg border border-[#DDE8DD] bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  unmatched = false,
}: {
  status: QuoteLineStatus;
  unmatched?: boolean;
}) {
  const labels: Record<QuoteLineStatus, string> = {
    otomatik: "Otomatik",
    manuel_inceleme: unmatched ? "Eşleşme bekliyor" : "İnceleme bekliyor",
    manuel_onaylandi: "Manuel onaylandı",
    iptal_edildi: "İptal edildi",
  };
  const classes: Record<QuoteLineStatus, string> = {
    otomatik: "border-[#C8DCC8] bg-[#F2F8F2] text-[#4F8A5B]",
    manuel_inceleme: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    manuel_onaylandi: "border-[#B7DEC4] bg-[#E7F5EC] text-[#276749]",
    iptal_edildi: "border-[#F7C4C0] bg-[#FEF3F2] text-[#912018]",
  };

  return (
    <span
      className={`inline-flex min-w-[9.75rem] items-center justify-center rounded-md border px-3 py-1.5 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ConfidenceScore({ score }: { score: number }) {
  const percentage = Math.round(Math.min(1, Math.max(0, score)) * 100);

  return (
    <div className="mt-3 w-36" aria-label={`Güven skoru yüzde ${percentage}`}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-[#475569]">Güven skoru</span>
        <strong className="text-sm text-[#1F2937]">%{percentage}</strong>
      </div>
      <div
        role="progressbar"
        aria-label="Güven skoru"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="mt-1 h-2 overflow-hidden rounded-full bg-[#DDE8DD]"
      >
        <div
          className="h-full rounded-full bg-[#4F8A5B]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ModalActions({
  cancelLabel,
  submitLabel,
  submitIcon,
  submitVariant = "primary",
  onCancel,
}: {
  cancelLabel: string;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  submitVariant?: "primary" | "approve" | "money" | "danger";
  onCancel: () => void;
}) {
  const submitClass = {
    primary: "btn btn-primary",
    approve: "btn btn-approve",
    money: "btn btn-money",
    danger: "btn btn-danger",
  }[submitVariant];

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-[#DDE8DD] pt-4 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className="btn btn-outline">
        {cancelLabel}
      </button>
      <button type="submit" className={submitClass}>
        {submitIcon}
        {submitLabel}
      </button>
    </div>
  );
}

function sumByStatus(quote: QuoteForClient, status: QuoteLineStatus) {
  return quote.kalemler
    .filter((line) => line.durum === status)
    .reduce((total, line) => total + (line.toplam ?? 0), 0);
}
