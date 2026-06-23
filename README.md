# Tersane Teklif Motoru

AI destekli elektrik malzemesi teklif motoru demo prototipi.

## Çalıştırma

```bash
npm run dev
```

Bu komut Prisma client üretir, SQLite tablolarını `prisma/init.sql` ile hazırlar ve Next.js geliştirme sunucusunu başlatır.

Claude entegrasyonu için `.env` içine `ANTHROPIC_API_KEY` ekleyin. Anahtar yoksa prototip yerel demo eşleştirici ile çalışmaya devam eder.

## Demo Dosyası

Örnek Excel dosyası:

```txt
ornekler/tersane-teklif-ornek.xlsx
```

Tekrar üretmek için:

```bash
npm run sample:excel
```

## Rotalar

- `/` panel
- `/katalog` ürün kataloğu CRUD
- `/teklif/yeni` teklif oluşturma
- `/teklif/[id]` teklif sonucu ve manuel onay akışı
