"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DURUM, TEKLIF_DURUM, URUN_KATEGORILERI } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { parseLocalizedNumber } from "@/lib/parsers";
import { calculateUnitPrice, roundMoney } from "@/lib/pricing";
import { createQuote } from "@/lib/quote-engine";

export type QuoteActionState = {
  error: string | null;
};

export type ProductActionState = {
  error: string | null;
};

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    await prisma.urun.create({ data: readProductForm(formData) });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ürün oluşturulurken hata oluştu." };
  }
  revalidatePath("/katalog");
  revalidatePath("/");
  return { error: null };
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    await prisma.urun.update({ where: { id: productId }, data: readProductForm(formData) });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ürün güncellenirken hata oluştu." };
  }
  revalidatePath("/katalog");
  revalidatePath("/");
  return { error: null };
}

export async function deleteProductAction(productId: string) {
  await prisma.urun.delete({
    where: { id: productId },
  });

  revalidatePath("/katalog");
  revalidatePath("/");
}

export async function createQuoteAction(
  _prevState: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  let quoteId: string;

  try {
    const fileValue = formData.get("file");
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    quoteId = await createQuote({
      file,
      manualText: String(formData.get("manualText") ?? ""),
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Teklif oluşturulurken beklenmeyen bir hata oluştu.",
    };
  }

  redirect(`/teklif/${quoteId}`);
}

export async function cancelQuoteLineAction(
  lineId: string,
  quoteId: string,
  formData: FormData,
) {
  const line = await prisma.teklifKalemi.findFirst({
    where: { id: lineId, teklifId: quoteId, durum: DURUM.MANUEL_INCELEME },
  });

  if (!line) {
    return;
  }

  await prisma.teklifKalemi.update({
    where: { id: lineId },
    data: {
      durum: DURUM.IPTAL_EDILDI,
      kategori: readCategory(formData.get("kategori")),
      sebep: "Teklif kalemi iptal edildi",
    },
  });

  revalidatePath(`/teklif/${quoteId}`);
  revalidatePath("/");
}

export async function updateQuoteStatusAction(quoteId: string, formData: FormData) {
  const requestedStatus = String(formData.get("status") ?? "");
  const statuses = Object.values(TEKLIF_DURUM);

  if (!statuses.includes(requestedStatus as (typeof statuses)[number])) {
    return;
  }

  const quote = await prisma.teklif.findUnique({
    where: { id: quoteId },
    include: { kalemler: true },
  });

  if (!quote) {
    return;
  }

  const now = new Date();
  const status = requestedStatus as (typeof statuses)[number];
  const statusData =
    status === TEKLIF_DURUM.KABUL_EDILDI
      ? {
          durum: status,
          gonderildiAt: quote.gonderildiAt ?? now,
          kabulEdildiAt: now,
          reddedildiAt: null,
          kabulEdilenTutar: totalQuoteAmount(quote.kalemler),
          reddedildiTutar: null,
        }
      : status === TEKLIF_DURUM.REDDEDILDI
        ? {
            durum: status,
            reddedildiAt: now,
            reddedildiTutar: totalQuoteAmount(quote.kalemler),
            kabulEdildiAt: null,
            kabulEdilenTutar: null,
          }
        : status === TEKLIF_DURUM.GONDERILDI
          ? {
              durum: status,
              gonderildiAt: quote.gonderildiAt ?? now,
              kabulEdildiAt: null,
              reddedildiAt: null,
              kabulEdilenTutar: null,
              reddedildiTutar: null,
            }
          : {
              durum: status,
              gonderildiAt: quote.gonderildiAt ?? null,
              kabulEdildiAt: null,
              reddedildiAt: null,
              kabulEdilenTutar: null,
              reddedildiTutar: null,
            };

  await prisma.teklif.update({
    where: { id: quoteId },
    data: statusData,
  });

  revalidatePath(`/teklif/${quoteId}`);
  revalidatePath("/");
}

export async function approveLineWithProductAction(
  lineId: string,
  quoteId: string,
  formData: FormData,
) {
  const productId = String(formData.get("productId") ?? "");
  const [line, product] = await Promise.all([
    prisma.teklifKalemi.findFirst({ where: { id: lineId, teklifId: quoteId } }),
    prisma.urun.findUnique({ where: { id: productId } }),
  ]);

  if (!line || !product) {
    return;
  }

  const unitPrice = calculateUnitPrice(product);

  await prisma.teklifKalemi.update({
    where: { id: lineId },
    data: {
      eslesenUrunKodu: product.kod,
      kategori: product.kategori,
      birim: product.birim,
      durum: DURUM.MANUEL_ONAYLANDI,
      birimFiyat: unitPrice,
      toplam: roundMoney(unitPrice * line.miktar),
      sebep: null,
    },
  });

  revalidatePath(`/teklif/${quoteId}`);
  revalidatePath("/");
}

export async function approveLineWithCustomPriceAction(
  lineId: string,
  quoteId: string,
  formData: FormData,
) {
  const unitPrice = parseLocalizedNumber(formData.get("unitPrice"));
  const line = await prisma.teklifKalemi.findFirst({
    where: { id: lineId, teklifId: quoteId },
  });

  if (!line || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return;
  }

  await prisma.teklifKalemi.update({
    where: { id: lineId },
    data: {
      durum: DURUM.MANUEL_ONAYLANDI,
      birimFiyat: roundMoney(unitPrice),
      toplam: roundMoney(unitPrice * line.miktar),
      sebep: "özel birim fiyat girildi",
    },
  });

  revalidatePath(`/teklif/${quoteId}`);
  revalidatePath("/");
}

function readProductForm(formData: FormData) {
  return {
    kod: readString(formData, "kod"),
    ad: readString(formData, "ad"),
    kategori: readCategory(formData.get("kategori")),
    birim: readString(formData, "birim"),
    maliyet: readPositiveNumber(formData, "maliyet"),
    marjYuzdesi: readPositiveNumber(formData, "marjYuzdesi"),
    esikMiktar: readPositiveNumber(formData, "esikMiktar", false),
  };
}

function readCategory(value: FormDataEntryValue | null) {
  const category = String(value ?? "").trim();

  return URUN_KATEGORILERI.includes(
    category as (typeof URUN_KATEGORILERI)[number],
  )
    ? category
    : "Genel";
}

function totalQuoteAmount(
  lines: Array<{ durum: string; toplam: number | null }>,
) {
  return roundMoney(
    lines
      .filter((line) => line.durum !== DURUM.IPTAL_EDILDI)
      .reduce((total, line) => total + (line.toplam ?? 0), 0),
  );
}

function readString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} alanı zorunlu.`);
  }

  return value;
}

function readPositiveNumber(formData: FormData, key: string, allowZero = true) {
  const value = parseLocalizedNumber(formData.get(key));
  const invalid = !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0);

  if (invalid) {
    throw new Error(`${key} ${allowZero ? "sıfır veya daha büyük" : "sıfırdan büyük"} bir sayı olmalı.`);
  }

  return value;
}
