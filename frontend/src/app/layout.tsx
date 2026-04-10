// LOKASI: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "@/components/shared/providers";
import { DynamicTitle } from "@/components/shared/dynamic-title";

// =========================================================================
// [PWA HARDENING] 1. KONFIGURASI VIEWPORT (NATIVE APP EXPERIENCE)
// =========================================================================
export const viewport: Viewport = {
  themeColor: "#024e35", // Menyelaraskan warna atas browser (status bar HP) dengan tema gelap kita
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah fitur "Zoom/Pinch" di HP agar UI ujian tidak berantakan/bergeser
};

// =========================================================================
// [PWA HARDENING] 2. REGISTRASI MANIFEST & META TAG
// =========================================================================
export const metadata: Metadata = {
  title: "Yayasan Kebajikan Pesantren",
  description: "Integrated Academic System v3.0",
  manifest: "/manifest.json", // Memanggil KTP Aplikasi yang tadi kita buat
  appleWebApp: {
    capable: true, // Membuat aplikasi bisa diinstal di iPhone/iPad (Home Screen)
    statusBarStyle: "black-translucent",
    title: "YKP Babakan Ciwaringin",
  },
  formatDetection: {
    telephone: false, // Mencegah angka di soal terdeteksi otomatis sebagai nomor telepon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased text-slate-900 bg-slate-50">
        <Providers>
          <DynamicTitle />

          {children}

          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
