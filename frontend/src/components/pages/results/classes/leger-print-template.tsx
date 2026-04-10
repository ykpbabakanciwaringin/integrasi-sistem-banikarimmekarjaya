import React, { forwardRef } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface LegerPrintTemplateProps {
  data: any; // Menerima object controller.data
}

export const LegerPrintTemplate = forwardRef<HTMLDivElement, LegerPrintTemplateProps>(
  ({ data }, ref) => {
    if (!data.classInfo || !data.students) return null;

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });

    return (
      <div className="hidden">
        {/* Kontainer Utama Cetak (Kertas A4 Landscape) */}
        <div ref={ref} className="p-8 font-serif text-black print-visible bg-white w-full">
          
          {/* HEADER LEGER */}
          <div className="text-center border-b-4 border-black pb-4 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-widest">{data.classInfo.institution_name || "LEMBAGA PENDIDIKAN"}</h1>
            <h2 className="text-xl font-bold mt-1 tracking-wide uppercase">LEGER HASIL BELAJAR SISWA</h2>
            <div className="flex justify-center items-center gap-6 mt-3 text-sm font-bold">
              <span>Kelas: <span className="uppercase">{data.classInfo.name}</span></span>
              <span>|</span>
              <span>Wali Kelas: <span className="uppercase">{data.classInfo.teacher_name || "-"}</span></span>
            </div>
          </div>
          
          {/* TABEL LEGER */}
          <table className="w-full border-collapse border border-black text-[10px] mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-8 text-center font-bold" rowSpan={2}>No</th>
                <th className="border border-black p-2 text-left font-bold min-w-[150px]" rowSpan={2}>Nama Siswa</th>
                <th className="border border-black p-2 text-center font-bold" colSpan={data.subjectList?.length || 1}>Nilai Mata Pelajaran</th>
                <th className="border border-black p-2 text-center font-bold" colSpan={3}>Ketidakhadiran</th>
              </tr>
              <tr className="bg-gray-100">
                {/* Header Dinamis untuk Mapel */}
                {data.subjectList?.map((mapel: string) => (
                  <th key={mapel} className="border border-black p-1 text-center font-bold w-10">
                    <div className="writing-mode-vertical whitespace-nowrap overflow-hidden h-24 transform -rotate-180 m-auto">
                      {mapel}
                    </div>
                  </th>
                ))}
                <th className="border border-black p-1 text-center font-bold w-8">S</th>
                <th className="border border-black p-1 text-center font-bold w-8">I</th>
                <th className="border border-black p-1 text-center font-bold w-8">A</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student: any, idx: number) => (
                <tr key={student.student_id} className="even:bg-gray-50/50">
                  <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                  <td className="border border-black p-1.5 font-bold uppercase">{student.student_name}</td>
                  
                  {/* Nilai Mapel */}
                  {data.subjectList?.map((mapel: string) => (
                    <td key={mapel} className="border border-black p-1.5 text-center font-medium">
                      {student.grades[mapel] || "-"}
                    </td>
                  ))}
                  
                  {/* Absensi */}
                  <td className="border border-black p-1.5 text-center">{student.attendance?.sick || "-"}</td>
                  <td className="border border-black p-1.5 text-center">{student.attendance?.permission || "-"}</td>
                  <td className="border border-black p-1.5 text-center">{student.attendance?.absent || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TANDA TANGAN */}
          <div className="mt-8 flex justify-between items-end px-12">
            <div className="text-center w-64">
              <p className="mb-24 text-sm">Mengetahui,<br/>Kepala Madrasah / Sekolah</p>
              <p className="font-bold underline uppercase tracking-wider">.........................................</p>
            </div>
            <div className="text-center w-64">
              <p className="mb-1 text-sm">Cirebon, {todayStr}</p>
              <p className="mb-24 text-sm">Wali Kelas,</p>
              <p className="font-bold underline uppercase tracking-wider">{data.classInfo.teacher_name || "........................................."}</p>
            </div>
          </div>
          
        </div>
      </div>
    );
  }
);

LegerPrintTemplate.displayName = "LegerPrintTemplate";