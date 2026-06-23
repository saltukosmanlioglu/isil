import { CatalogManager } from "@/app/ui/catalog-manager";
import { productToClient } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  await ensureSeedData();

  const products = await prisma.urun.findMany({
    orderBy: { kod: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-normal text-[#64748B]">
          Katalog Yönetimi
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#1F2937]">
          Ürün kataloğu
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#475569]">
          Tedarikçi maliyeti, marj ve otomatik fiyatlandırma eşiği.
        </p>
      </div>
      <CatalogManager products={products.map(productToClient)} />
    </div>
  );
}
