// LOKASI: src/components/pages/teachers/teacher-id-card-print.tsx
import React, { forwardRef } from "react";
import { User } from "lucide-react";

//  DEFINISI INTERFACE: Sudah sangat tepat untuk sistem Multi-Tenant
interface TeacherPrintData {
  nama: string;
  nip: string;
  nik: string;
  ttl: string;
  gender: string;
  lembaga: string; // "Lembaga A (Jabatan A), Lembaga B (Jabatan B)"
  jabatan: string; // Jabatan Utama yang muncul di badge hijau
  photoUrl: string | null;
  qrCodeUrl: string | null;
  logoUrl: string | null;
  ttdUrl: string | null;
  printDate: string;
}

interface TeacherIdCardPrintProps {
  teacher: TeacherPrintData | null;
}

export const TeacherIdCardPrint = forwardRef<
  HTMLDivElement,
  TeacherIdCardPrintProps
>(({ teacher }, ref) => {
  if (!teacher) return null;

  return (
    <div
      ref={ref}
      style={{ width: "638px", height: "1011px" }}
      className="bg-[#f8fcfb] relative flex flex-col items-center font-sans border-0 overflow-hidden box-border"
    >
      {/* --- BACKGROUND --- */}
      <div className="absolute top-0 left-0 w-full h-[330px] bg-gradient-to-b from-[#043425] to-[#065f46] rounded-b-[40%] scale-x-[1.25] origin-top shadow-xl z-0"></div>

      {/* --- WATERMARK --- */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 mt-32">
        {teacher.logoUrl && (
          <img
            src={teacher.logoUrl}
            alt="Watermark"
            crossOrigin="anonymous"
            className="w-[450px] h-[450px] object-contain grayscale"
          />
        )}
      </div>

      {/* --- KOP SURAT --- */}
      <div className="w-full flex flex-col items-center mt-8 relative z-10 px-6 text-center text-white shrink-0">
        <div className="w-[100px] h-[100px] mb-2 bg-white/10 rounded-full p-2 backdrop-blur-sm">
          {teacher.logoUrl && (
            <img src={teacher.logoUrl} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain drop-shadow-md" />
          )}
        </div>
        <h1 className="text-[24px] font-black uppercase tracking-wider leading-tight drop-shadow-sm">YAYASAN KEBAJIKAN PESANTREN</h1>
        <p className="text-[13px] font-bold mt-0.5 uppercase text-emerald-100 tracking-widest drop-shadow-sm">SK KEMENKUMHAM : AHU-0000028.AH.01.05. TAHUN 2023</p>
        <p className="text-[11px] font-medium mt-1.5 text-emerald-50 tracking-wide drop-shadow-sm leading-snug">
          Jl. Gondang Manis No. 52 Babakan Ciwaringin Cirebon<br />
          Jawa Barat 45167 | WA : 082 260 246 434<br />
          Email : banikarimmekarjaya@gmail.com
        </p>
      </div>

      {/* --- FOTO PROFIL --- */}
      <div className="relative z-20 w-[210px] h-[280px] rounded-xl bg-slate-100 border-[6px] border-white shadow-2xl flex items-center justify-center overflow-hidden mt-4 mb-3 shrink-0">
        {teacher.photoUrl ? (
          <img src={teacher.photoUrl} alt="Foto Profil" crossOrigin="anonymous" className="w-full h-full object-cover relative z-10" />
        ) : (
          <div className="flex flex-col items-center text-slate-300">
            <User className="w-24 h-24 mb-2" strokeWidth={1.5} />
            <span className="text-xl font-bold tracking-widest">3 x 4</span>
          </div>
        )}
      </div>

      {/* --- DETAIL DATA --- */}
      <div className="relative z-10 text-center w-full px-12 flex flex-col items-center shrink-0">
        <h2 className="text-[28px] font-black text-[#043425] uppercase tracking-wide leading-tight mb-1.5 line-clamp-2 px-2 drop-shadow-sm">
          {teacher.nama}
        </h2>

        {/* Badge Jabatan Utama */}
        <div className="bg-gradient-to-r from-[#047857] to-[#059669] text-white px-8 py-1.5 rounded-full text-[14px] font-black tracking-[0.1em] shadow-lg mb-3 uppercase text-center border border-[#064e3b]/50">
          {teacher.jabatan || "TENAGA PENDIDIK"}
        </div>

        <div className="flex flex-col w-full border-t-[3px] border-b-[3px] border-[#043425]/10 py-3 px-2 bg-white/50 backdrop-blur-sm rounded-xl">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 w-full text-left">
            <DataRow label="NIP / NIY / NUPTK" value={teacher.nip} isBold />
            <DataRow label="JENIS KELAMIN" value={teacher.gender} />
            <DataRow label="NIK KTP" value={teacher.nik} />
            <DataRow label="TANGGAL LAHIR" value={teacher.ttl} />
          </div>
          
          <div className="flex flex-col text-left mt-3 pt-3 border-t border-slate-300 border-dashed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Unit Penugasan & Jabatan Khusus
            </span>
            <span className={`font-black text-[#043425] uppercase leading-[1.3] line-clamp-3 ${
              teacher.lembaga.length > 60 ? 'text-[9px]' : teacher.lembaga.length > 40 ? 'text-[10px]' : 'text-[12px]'
            }`}>
              {teacher.lembaga}
            </span>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="w-full flex justify-between items-end px-10 mt-auto pb-8 relative z-10 shrink-0">
        <div className="flex flex-col items-center">
          <div className="w-[140px] h-[140px] bg-white p-2 border-2 border-slate-200 rounded-xl shadow-lg">
            {teacher.qrCodeUrl && <img src={teacher.qrCodeUrl} alt="QR Code" crossOrigin="anonymous" className="w-full h-full object-cover" />}
          </div>
          <span className="text-[11px] font-black text-slate-600 mt-2 tracking-widest bg-white/80 px-2 py-0.5 rounded shadow-sm border border-slate-100">SCAN VERIFY</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="text-[14px] font-bold text-slate-700 mb-1">Cirebon, {teacher.printDate}</p>
          <p className="text-[14px] font-bold text-slate-700">Ketua Yayasan,</p>
          <div className="h-[110px] w-[220px] relative mt-2 -mb-4">
            <img src="/images/stempel-ykp.png" alt="Stempel Yayasan" crossOrigin="anonymous" className="absolute -left-16 -top-6 w-[140px] h-[140px] object-contain mix-blend-multiply opacity-85 z-0 -rotate-12" />
            <img src={teacher.ttdUrl || "/images/ttd-ketua-yayasan.png"} alt="Tanda Tangan" crossOrigin="anonymous" className="absolute right-0 top-2 w-[180px] h-[100px] object-contain mix-blend-multiply z-10" />
          </div>
          <p className="text-[16px] font-black text-[#043425] border-b-2 border-[#043425] pb-0.5 inline-block relative z-20">
            Dr. KH. Arwani Syaerozi, Lc, MA.
          </p>
        </div>
      </div>
      
      {/* Modern Bottom Border diselaraskan menjadi 16px */}
      <div className="absolute bottom-0 left-0 w-full h-[16px] bg-gradient-to-r from-[#043425] via-[#065f46] to-[#043425]"></div>
    </div>
  );
});

TeacherIdCardPrint.displayName = "TeacherIdCardPrint";

const DataRow = ({ label, value, isBold = false }: { label: string; value: string; isBold?: boolean }) => (
  <div className="flex flex-col w-full overflow-hidden">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`uppercase truncate ${isBold ? 'font-black text-[#043425] text-[14px]' : 'font-bold text-slate-800 text-[12px]'}`}>
      {value || "-"}
    </span>
  </div>
);