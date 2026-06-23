"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/app/actions";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { ProductForClient } from "@/lib/types";
import { Modal } from "@/app/ui/modal";
import { URUN_KATEGORILERI } from "@/lib/constants";

type CatalogModal =
  | { type: "create" }
  | { type: "edit"; product: ProductForClient }
  | { type: "delete"; product: ProductForClient }
  | null;

export function CatalogManager({ products }: { products: ProductForClient[] }) {
  const [modal, setModal] = useState<CatalogModal>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[#DDE8DD] bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1F2937]">Katalog kayıtları</h2>
          <p className="mt-1 text-sm font-medium text-[#64748B]">
            {formatNumber(products.length)} ürün listeleniyor
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="btn btn-primary"
        >
          <Plus size={16} aria-hidden="true" />
          Ürün ekle
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#DDE8DD] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-[#DDE8DD] text-sm">
            <thead className="bg-[#EAF4EA] text-left text-xs font-semibold uppercase tracking-normal text-[#1F2937]">
              <tr>
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Ürün adı</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Birim</th>
                <th className="px-4 py-3 text-right">Maliyet</th>
                <th className="px-4 py-3 text-right">Marj</th>
                <th className="px-4 py-3 text-right">Eşik miktar</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE8DD]">
              {products.map((product) => (
                <tr key={product.id} className="align-middle hover:bg-[#F7FAF6]">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#475569]">
                    {product.kod}
                  </td>
                  <td className="min-w-72 px-4 py-3 font-medium text-[#1F2937]">
                    {product.ad}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#475569]">
                    {product.kategori}
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{product.birim}</td>
                  <td className="px-4 py-3 text-right text-[#475569]">
                    {formatMoney(product.maliyet)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#475569]">
                    {formatPercent(product.marjYuzdesi)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#475569]">
                    {formatNumber(product.esikMiktar)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ type: "edit", product })}
                        className="btn btn-edit btn-sm"
                      >
                        <Pencil size={15} aria-hidden="true" />
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ type: "delete", product })}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal?.type === "create"}
        title="Ürün ekle"
        description="Yeni katalog kaydı oluşturulacak. Bilgileri kontrol edip onaylayın."
        onClose={() => setModal(null)}
      >
        {modal?.type === "create" ? (
          <ProductForm
            action={createProductAction}
            submitLabel="Kaydı oluştur"
            icon={<Plus size={16} aria-hidden="true" />}
            onSubmit={() => setModal(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={modal?.type === "edit"}
        title="Ürün düzenle"
        description="Bu işlem katalog fiyatlandırma verisini günceller."
        onClose={() => setModal(null)}
      >
        {modal?.type === "edit" ? (
          <ProductForm
            product={modal.product}
            action={updateProductAction.bind(null, modal.product.id)}
            submitLabel="Değişiklikleri onayla"
            icon={<Save size={16} aria-hidden="true" />}
            onSubmit={() => setModal(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={modal?.type === "delete"}
        title="Silme onayı"
        description="Bu katalog kaydı silinecek. İşlem teklif geçmişindeki satırları silmez."
        onClose={() => setModal(null)}
      >
        {modal?.type === "delete" ? (
          <form
            action={deleteProductAction.bind(null, modal.product.id)}
            onSubmit={() => setModal(null)}
            className="space-y-5"
          >
            <div className="rounded-md border border-[#DDE8DD] bg-[#EAF4EA] px-4 py-3">
              <div className="font-mono text-xs font-semibold text-[#64748B]">
                {modal.product.kod}
              </div>
              <div className="mt-1 text-sm font-semibold text-[#1F2937]">
                {modal.product.ad}
              </div>
            </div>
            <ModalActions
              cancelLabel="Vazgeç"
              submitLabel="Silme işlemini onayla"
              onCancel={() => setModal(null)}
              danger
            />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function ProductForm({
  product,
  action,
  submitLabel,
  icon,
  onSubmit,
}: {
  product?: ProductForClient;
  action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  submitLabel: string;
  icon: React.ReactNode;
  onSubmit: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const wasSubmitting = useRef(false);

  if (pending) wasSubmitting.current = true;

  useEffect(() => {
    if (wasSubmitting.current && !pending && state.error === null) {
      onSubmit();
    }
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="kod" label="Kod" defaultValue={product?.kod} required />
        <Field name="birim" label="Birim" defaultValue={product?.birim} required />
        <CategoryField defaultValue={product?.kategori} />
        <Field
          name="ad"
          label="Ürün adı"
          defaultValue={product?.ad}
          className="md:col-span-2"
          required
        />
        <Field
          name="maliyet"
          label="Birim maliyet"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.maliyet}
          required
        />
        <Field
          name="marjYuzdesi"
          label="Marj yüzdesi"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.marjYuzdesi}
          required
        />
        <Field
          name="esikMiktar"
          label="Otomatik fiyatlandırma eşik miktarı"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={product?.esikMiktar}
          className="md:col-span-2"
          required
        />
      </div>
      {state.error ? (
        <p className="rounded-md border border-[#F7C4C0] bg-[#FEF3F2] px-3 py-2 text-sm font-medium text-[#912018]">
          {state.error}
        </p>
      ) : null}
      <div className="rounded-md border border-[#DDE8DD] bg-[#EAF4EA] px-4 py-3 text-sm font-medium leading-6 text-[#475569]">
        Form gönderildiğinde kayıt onaylanmış sayılır ve katalog tablosu güncellenir.
      </div>
      <ModalActions
        cancelLabel="Vazgeç"
        submitLabel={submitLabel}
        submitIcon={icon}
        onCancel={onSubmit}
        pending={pending}
      />
    </form>
  );
}

function CategoryField({ defaultValue }: { defaultValue?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-[#64748B]">
      Kategori
      <select
        name="kategori"
        defaultValue={defaultValue ?? "Genel"}
        className="h-10 rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
      >
        {URUN_KATEGORILERI.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-xs font-semibold text-[#64748B] ${className ?? ""}`}>
      {label}
      <input
        {...props}
        className="h-10 rounded-md border border-[#DDE8DD] bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition placeholder:text-[#64748B] focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#EAF4EA]"
      />
    </label>
  );
}

function ModalActions({
  cancelLabel,
  submitLabel,
  submitIcon,
  onCancel,
  danger,
  pending,
}: {
  cancelLabel: string;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  onCancel: () => void;
  danger?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-[#DDE8DD] pt-4 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className="btn btn-outline">
        {cancelLabel}
      </button>
      <button type="submit" disabled={pending} className={danger ? "btn btn-danger" : "btn btn-save"}>
        {submitIcon}
        {submitLabel}
      </button>
    </div>
  );
}
