// LOKASI: frontend\src\app\(auth)\verify\document\page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

/**
 * 1. Pindahkan logika utama ke dalam komponen internal (VerifyContent).
 * Hal ini dilakukan agar useSearchParams() berada di dalam Suspense Boundary.
 */
function VerifyContent() {
  const searchParams = useSearchParams();
  const [docData, setDocData] = useState<any>(null);

  useEffect(() => {
    // Menangkap parameter dari hasil scan QR Code
    const type = searchParams.get("type");
    const instId = searchParams.get("inst_id");
    const date = searchParams.get("date");

    if (type) {
      setDocData({ type, instId, date });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-emerald-700 mb-4">Verifikasi Dokumen</h1>
        
        {docData ? (
          <div className="text-left space-y-3 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <p className="text-sm text-gray-600">Status: <span className="font-bold text-emerald-600">Dokumen Valid (Sistem Tercatat)</span></p>
            <p className="text-sm text-gray-600">Jenis Dokumen: <span className="font-semibold text-gray-800">{docData.type.replace("_", " ")}</span></p>
            <p className="text-sm text-gray-600">ID Lembaga: <span className="font-mono text-xs">{docData.instId || "Semua Lembaga"}</span></p>
            <p className="text-sm text-gray-600">Dicetak Pada: <span className="font-semibold text-gray-800">{docData.date}</span></p>
          </div>
        ) : (
          <p className="text-red-500">QR Code tidak valid atau parameter tidak ditemukan.</p>
        )}
        
        <p className="mt-6 text-xs text-gray-400">Sistem Informasi Akademik Terpadu (SIAP)</p>
      </div>
    </div>
  );
}

/**
 * 2. Export utama sebagai Page.
 * Membungkus VerifyContent dengan Suspense untuk memenuhi standar Build Next.js.
 */
export default function VerifyDocumentPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Menyiapkan data verifikasi...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}