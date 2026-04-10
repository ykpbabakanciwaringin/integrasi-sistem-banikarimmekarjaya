// LOKASI: src/components/pages/results/subjects/subject-print-template.tsx
import React, { forwardRef } from "react";

interface SubjectPrintTemplateProps {
  detail: any;
  grades: any[];
  todayStr: string;
}

export const SubjectPrintTemplate = forwardRef<HTMLDivElement, SubjectPrintTemplateProps>(
  ({ detail, grades, todayStr }, ref) => {
    return (
      <div className="hidden">
        {/* Kontainer Utama Cetak (Kertas A4) */}
        <div ref={ref} className="p-10 font-serif text-black print-visible bg-white w-full">
          
          {/* HEADER KOP SURAT FORMAL */}
          <div className="text-center border-b-4 border-black pb-5 mb-6 relative">
            <h1 className="text-2xl font-black uppercase tracking-widest">{detail?.institution_name || "LEMBAGA PENDIDIKAN"}</h1>
            <h2 className="text-xl font-bold mt-1 tracking-wide">REKAPITULASI NILAI HASIL BELAJAR</h2>
            
            <div className="flex justify-center items-center gap-6 mt-4 text-sm font-semibold">
              <span>Mata Pelajaran: <span className="uppercase">{detail?.subject_name}</span></span>
              <span>|</span>
              <span>Kelas: <span className="uppercase">{detail?.class_name}</span></span>
            </div>
          </div>
          
          {/* TABEL NILAI */}
          <table className="w-full border-collapse border border-black text-sm mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-3 w-12 text-center font-bold">No</th>
                <th className="border border-black p-3 text-left font-bold">Nama Siswa</th>
                <th className="border border-black p-3 text-center font-bold">Username</th>
                <th className="border border-black p-3 text-center w-24 font-bold">B / S</th>
                <th className="border border-black p-3 text-center w-24 font-bold">Nilai Akhir</th>
                <th className="border border-black p-3 text-center w-32 font-bold">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g: any, idx: number) => {
                const isPassed = g.final_score >= (detail?.kkm || 75);
                return (
                  <tr key={idx} className="even:bg-gray-50/50">
                    <td className="border border-black p-2.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-2.5 font-medium">{g.student_name}</td>
                    <td className="border border-black p-2.5 text-center">{g.student_username}</td>
                    <td className="border border-black p-2.5 text-center">
                      {g.exam_status !== "BELUM UJIAN" ? `${g.correct_count} / ${g.wrong_count}` : "-"}
                    </td>
                    <td className="border border-black p-2.5 text-center font-bold text-base">{g.final_score}</td>
                    <td className="border border-black p-2.5 text-center font-medium">
                      {g.exam_status === "BELUM UJIAN" ? "Belum Ujian" : (isPassed ? "Tuntas" : "Remedial")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* BAGIAN TANDA TANGAN */}
          <div className="mt-12 flex justify-end">
            <div className="text-center w-64">
              <p className="mb-1 text-sm">Cirebon, {todayStr}</p>
              <p className="mb-24 text-sm">Guru Mata Pelajaran,</p>
              <p className="font-bold underline uppercase tracking-wider">{detail?.teacher_name || "........................................."}</p>
            </div>
          </div>
          
        </div>
      </div>
    );
  }
);

SubjectPrintTemplate.displayName = "SubjectPrintTemplate";