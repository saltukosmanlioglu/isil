import type { Metadata } from "next";
import Link from "next/link";
import { Cable, ClipboardList, Home, Package } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tersane Teklif Motoru",
  description: "AI destekli elektrik malzemesi teklif prototipi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-[#F7FAF6] text-[#475569]">
        <div className="min-h-screen">
          <header className="border-b border-[#DDE8DD] bg-white">
            <div className="border-b border-[#DDE8DD] bg-[#1F2937] px-4 py-1 text-xs font-semibold text-white md:px-6">
              <div className="mx-auto w-full max-w-7xl">Demo Prototip</div>
            </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#4F8A5B] text-white">
                  <Cable size={21} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-semibold tracking-normal text-[#1F2937]">
                    Tersane Teklif Motoru
                  </span>
                  <span className="block text-xs font-medium text-[#64748B]">
                    Elektrik malzemeleri demo prototipi
                  </span>
                </span>
              </Link>
              <nav className="flex flex-wrap gap-2">
                <NavLink href="/" icon={<Home size={16} aria-hidden="true" />}>
                  Panel
                </NavLink>
                <NavLink
                  href="/teklif"
                  icon={<ClipboardList size={16} aria-hidden="true" />}
                >
                  Teklifler
                </NavLink>
                <NavLink
                  href="/katalog"
                  icon={<Package size={16} aria-hidden="true" />}
                >
                  Katalog
                </NavLink>
              </nav>
            </div>
          </header>
          <main className="w-full px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="btn btn-outline">
      {icon}
      {children}
    </Link>
  );
}
