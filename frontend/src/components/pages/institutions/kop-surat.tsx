// LOKASI: src/components/pages/institutions/kop-surat.tsx
import React, { useState, useEffect } from "react";
import { getUniversalImageUrl } from "@/lib/axios";

interface InstitutionKop {
  name?: string;
  category?: string;
  logo_url?: string;
  address_city?: string;
  address_detail?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  header1?: string;
  header2?: string;
  foundation_name?: string; 
}

interface KopSuratProps {
  institution: InstitutionKop | null;
}

export function KopSurat({ institution }: KopSuratProps) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Mendapatkan URL logo asli
  const logoUrl = institution ? getUniversalImageUrl(institution.logo_url) : null;

  useEffect(() => {
    if (!logoUrl) {
      setLogoDataUrl(null);
      return;
    }

    // Trik Jitu: Mengubah gambar URL menjadi format Base64 secara asinkron.
    // Ini akan menipu sistem browser sehingga mencegah error "Tainted Canvas" saat proses ekspor gambar.
    const loadBase64Image = async () => {
      try {
        // PENYEMPURNAAN: Tambahkan { cache: "no-cache" } agar browser tidak mengambil cache gambar tanpa izin CORS
        const response = await fetch(logoUrl, { cache: "no-cache" });
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn("Gagal convert ke Base64, fallback ke URL asli:", error);
        // Jika fetch gagal (karena Strict CORS Backend), tetap tampilkan gambar aslinya
        setLogoDataUrl(logoUrl); 
      }
    };

    loadBase64Image();
  }, [logoUrl]);

  if (!institution) return null;

  const addressDetail = institution.address_detail || "Alamat lengkap belum diatur di sistem.";
  const addressCity = institution.address_city || "Kota/Kabupaten belum ditentukan.";

  return (
    <div id="kop-surat-area" className="w-full bg-white text-black font-serif pt-6 pb-4 select-none">
      <div className="flex items-center justify-between max-w-[19cm] mx-auto px-2">
        
        {/* SISI KIRI: AREA LOGO */}
        <div className="w-[120px] flex-shrink-0 flex items-center justify-center">
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              alt={`Logo ${institution.name}`}
              // crossOrigin dihapus sepenuhnya agar browser tidak memblokirnya
              className="w-full h-auto object-contain max-h-[110px]"
            />
          ) : (
            <div className="w-[90px] h-[90px] border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300 text-center p-2 rounded-lg">
              Logo Belum<br/>Diunggah
            </div>
          )}
        </div>

        {/* TENGAH: KONTEN TEKS UTAMA */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          
          {institution.foundation_name && (
            <h1
              className="text-[24px] font-bold uppercase text-[#043425] leading-none mb-1 tracking-wide"
              style={{ fontFamily: "Cambria, 'Times New Roman', serif" }}
            >
              {institution.foundation_name}
            </h1>
          )}
          
          <h2
            className="text-[20px] font-bold uppercase text-black leading-tight mb-1"
            style={{ fontFamily: "Cambria, 'Times New Roman', serif" }}
          >
            {institution.name || "NAMA UNIT LEMBAGA"}
          </h2>
          
          {(institution.header1 || institution.header2) && (
            <h3
              className="text-[14px] font-bold uppercase text-slate-800 leading-tight mb-1"
              style={{ fontFamily: "Cambria, 'Times New Roman', serif" }}
            >
              {institution.header1} {institution.header1 && institution.header2 ? " - " : ""} {institution.header2}
            </h3>
          )}

          <div className="space-y-0.5 mt-1">
            <p className="text-[11px] text-black leading-snug" style={{ fontFamily: "Cambria, 'Times New Roman', serif" }}>
              {addressDetail}
            </p>
            <p className="text-[11px] text-black leading-snug" style={{ fontFamily: "Cambria, 'Times New Roman', serif" }}>
              {addressCity} 
              {institution.contact_phone && (
                <span className="font-semibold ml-1"> | Telp/WA: {institution.contact_phone}</span>
              )}
            </p>
            
            {(institution.contact_email || institution.website) && (
              <p className="text-[11px] text-black leading-snug italic" style={{ fontFamily: "Cambria, 'Times New Roman', serif" }}>
                {institution.contact_email && <span>Email: {institution.contact_email}</span>}
                {institution.contact_email && institution.website && <span className="mx-2"> • </span>}
                {institution.website && <span>Website: {institution.website}</span>}
              </p>
            )}
          </div>
        </div>

        {/* SISI KANAN: SPACER */}
        <div className="w-[120px] flex-shrink-0 invisible"></div>
      </div>

      <div className="max-w-[19cm] mx-auto mt-4 px-2">
        <div className="border-t-[2.5px] border-black"></div>
        <div className="border-t-[1px] border-black mt-[1.5px]"></div>
      </div>
    </div>
  );
}