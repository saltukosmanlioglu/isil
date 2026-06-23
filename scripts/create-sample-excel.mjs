import { mkdirSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const rows = [
  ["Ürün Adı", "Miktar", "Birim"],
  ["NYY 3x2.5mm² Kablo", 120, "metre"],
  ["NYY 3x2.5mm² Kablo", 20000, "metre"],
  ["NEK 606 gemi tipi kablo 4x1.5", 900, "metre"],
  ["IP67 su geçirmez junction box", 30, "adet"],
  ["ATEX sertifikalı aydınlatma armatürü", 25, "adet"],
  ["Özel marin pano modülü", 7, "adet"],
];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(rows);

worksheet["!cols"] = [{ wch: 42 }, { wch: 12 }, { wch: 12 }];

XLSX.utils.book_append_sheet(workbook, worksheet, "Malzemeler");

const outputDir = join(process.cwd(), "ornekler");
mkdirSync(outputDir, { recursive: true });
XLSX.writeFile(workbook, join(outputDir, "tersane-teklif-ornek.xlsx"));
