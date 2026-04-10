import React, { forwardRef } from "react";

interface StudentIdCardPrintProps {
  student: any;
}

export const StudentIdCardPrint = forwardRef<
  HTMLDivElement,
  StudentIdCardPrintProps
>(({ student }, ref) => {
  if (!student) return null;

  return (
    <div
      ref={ref}
      style={{ width: "638px", height: "1011px" }}
      className="bg-[#f8fcfb] relative flex flex-col items-center font-sans border-0 overflow-hidden box-border"
    >
      {/* --- BACKGROUND ASLI (TIDAK DIUBAH) --- */}
      <div className="absolute top-0 left-0 w-full h-[330px] bg-gradient-to-b from-[#043425] to-[#065f46] rounded-b-[40%] scale-x-[1.25] origin-top shadow-xl z-0"></div>

      {/* --- WATERMARK ASLI (TIDAK DIUBAH) --- */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 mt-32">
        {student.logoUrl && (
          <img
            src={student.logoUrl}
            alt="Watermark"
            className="w-[450px] h-[450px] object-contain grayscale"
          />
        )}
      </div>

      {/* --- HEADER KOP SURAT ASLI (TIDAK DIUBAH) --- */}
      <div className="w-full flex flex-col items-center mt-8 relative z-10 px-6 text-center text-white shrink-0">
        <div className="w-[100px] h-[100px] mb-2">
          {student.logoUrl && (
            <img
              src={student.logoUrl}
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          )}
        </div>

        <h1 className="text-[24px] font-black uppercase tracking-wider leading-tight drop-shadow-sm">
          YAYASAN KEBAJIKAN PESANTREN
        </h1>
        <p className="text-[13px] font-bold mt-0.5 uppercase text-emerald-100 tracking-widest drop-shadow-sm">
          SK KEMENKUMHAM : AHU-0000028.AH.01.05. Tahun 2023
        </p>
        <p className="text-[11px] font-medium mt-1.5 text-emerald-50 tracking-wide drop-shadow-sm leading-snug">
          Jl. Gondang Manis No. 52 RT 002 RW 002 Ds. Babakan Kec. Ciwaringin
          Kab. Cirebon
          <br />
          Jawa Barat Kode Pos 45167 Telp. / WA : 082 260 246 434
          <br />
          Email : ykpbabakanciwaringin@gmail.com
        </p>
      </div>

      {/* --- FOTO PROFIL (Sedikit disesuaikan ukurannya agar hemat ruang vertikal) --- */}
      <div className="relative z-20 w-[210px] h-[280px] rounded-2xl bg-slate-200 border-[6px] border-white shadow-2xl flex items-center justify-center overflow-hidden mt-4 mb-3 shrink-0">
        {student.photoUrl ? (
          <img
            src={student.photoUrl}
            alt="Foto"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-slate-400 text-3xl font-bold tracking-widest">
            3 x 4
          </span>
        )}
      </div>

      {/* --- BAGIAN TENGAH: DETAIL DATA (DIRUBAH MENJADI 2 KOLOM RAPI) --- */}
      <div className="relative z-10 text-center w-full px-12 flex flex-col items-center shrink-0">
        
        {/* Nama Siswa */}
        <h2 className="text-[28px] font-black text-[#043425] uppercase tracking-wide leading-tight mb-1.5 line-clamp-2 px-2">
          {student.nama}
        </h2>

        {/* Kapsul Status */}
        <div className="bg-[#047857] text-white px-8 py-1 rounded-full text-[14px] font-black tracking-[0.1em] shadow-md mb-3 uppercase text-center border border-[#064e3b]">
          KARTU TANDA SISWA
        </div>

        {/* Grid Data Lengkap 2 Kolom */}
        <div className="flex flex-col w-full border-t-2 border-b-2 border-emerald-100/80 py-2.5 px-2">
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full text-left">
            <DataRow label="NISN / NIK" value={student.nisn} isBold />
            <DataRow label="KELAS FORMAL" value={student.kelas} />
            <DataRow 
              label="PONDOK & ASRAMA" 
              value={student.pondok !== "TIDAK MUKIM" ? `${student.pondok} ${student.kamar ? `(${student.kamar})` : ""}` : "TIDAK MUKIM"} 
            />
            <DataRow label="PROGRAM PENGAJIAN" value={student.program} />
          </div>
          
          <div className="flex flex-col text-left mt-2 pt-2 border-t border-slate-200 border-dashed">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Lembaga Pendidikan
            </span>
            <span className="text-[12px] font-black text-[#043425] uppercase leading-snug line-clamp-2">
              {student.lembaga}
            </span>
          </div>
        </div>
      </div>

      {/* --- FOOTER ASLI (TIDAK DIUBAH) --- */}
      <div className="w-full flex justify-between items-end px-10 mt-auto pb-8 relative z-10 shrink-0">
        <div className="flex flex-col items-center">
          <div className="w-[150px] h-[150px] bg-white p-2 border-2 border-slate-200 rounded-2xl shadow-lg">
            {student.qrCodeUrl && (
              <img
                src={student.qrCodeUrl}
                alt="QR"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-500 mt-2 tracking-widest">
            SCAN TO VERIFY
          </span>
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="text-[14px] font-bold text-slate-600 mb-1">
            Cirebon, {student.printDate}
          </p>
          <p className="text-[14px] font-bold text-slate-600">Ketua Yayasan,</p>
          <div className="h-[110px] w-[220px] relative mt-2 -mb-4">
            <img
              src="/images/stempel-ykp.png"
              alt="Stempel"
              className="absolute -left-16 -top-6 w-[140px] h-[140px] object-contain mix-blend-multiply opacity-85 z-0 -rotate-12"
            />
            <img
              src={student.ttdUrl || "/images/ttd-ketua-yayasan.png"}
              alt="TTD"
              className="absolute right-0 top-2 w-[180px] h-[100px] object-contain mix-blend-multiply drop-shadow-sm z-10"
            />
          </div>
          <p className="text-[16px] font-black text-[#043425] border-b-2 border-[#043425] pb-0.5 inline-block relative z-20">
            Dr. KH. Arwani Syaerozi, Lc, MA.
          </p>
        </div>
      </div>

      {/* Modern Bottom Border */}
      <div className="absolute bottom-0 left-0 w-full h-[16px] bg-gradient-to-r from-[#043425] via-[#065f46] to-[#043425]"></div>
    </div>
  );
});

StudentIdCardPrint.displayName = "StudentIdCardPrint";

// --- Komponen Pembantu Layout 2 Kolom (Atas-Bawah) ---
const DataRow = ({ label, value, isBold = false }: { label: string; value: string; isBold?: boolean }) => (
  <div className="flex flex-col w-full overflow-hidden">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span className={`text-[12px] uppercase truncate ${isBold ? 'font-black text-[#043425] text-[13px]' : 'font-bold text-slate-700'}`}>
      {value}
    </span>
  </div>
);