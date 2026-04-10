import React, { forwardRef } from "react";

interface RaporPrintTemplateProps {
  data: any; // Menerima object data lengkap dari controller
}

export const RaporPrintTemplate = forwardRef<HTMLDivElement, RaporPrintTemplateProps>(
  ({ data }, ref) => {
    const { classInfo, allStudents, subjectList, todayStr } = data;

    if (!classInfo || !allStudents) return null;

    return (
      <div className="hidden">
        {/* CSS Khusus Cetak untuk memastikan presisi A4 Portrait */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { 
              size: A4 portrait; 
              margin: 15mm 20mm; 
            }
            body { background-color: white; }
            .rapor-page { 
              page-break-after: always; 
              font-family: "Times New Roman", Times, serif;
              color: black;
              line-height: 1.5;
            }
            .rapor-page:last-child { page-break-after: auto; }
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
            .print-table th, .print-table td { 
              border: 1px solid black !important; 
              padding: 6px 10px; 
              font-size: 12px;
            }
            .print-table th { background-color: #f0f0f0 !important; font-weight: bold; text-transform: uppercase; }
          }
        `}} />
        
        <div ref={ref} className="print-visible">
          {allStudents.map((student: any, index: number) => (
            <div key={student.student_id} className="rapor-page">
              
              {/* 1. KOP LEMBAGA & JUDUL */}
              <div className="text-center mb-8 border-b-2 border-double border-black pb-4">
                <h1 className="text-xl font-bold uppercase tracking-widest">{classInfo.institution_name}</h1>
                <h2 className="text-lg font-bold uppercase underline">LAPORAN HASIL BELAJAR (RAPOR)</h2>
                <p className="text-sm font-medium mt-1">Tahun Pelajaran: 2025/2026 | Semester: Ganjil</p>
              </div>

              {/* 2. IDENTITAS SISWA */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-bold">
                <div className="space-y-1">
                  <table className="w-full">
                    <tbody>
                      <tr><td className="w-24">Nama Siswa</td><td className="w-4">:</td><td className="uppercase">{student.student_name}</td></tr>
                      <tr><td>NISN</td><td>:</td><td>{student.nisn || "-"}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="space-y-1">
                  <table className="w-full">
                    <tbody>
                      <tr><td className="w-24">Kelas</td><td className="w-4">:</td><td className="uppercase">{classInfo.name}</td></tr>
                      <tr><td>Wali Kelas</td><td>:</td><td className="uppercase">{classInfo.teacher_name}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. TABEL NILAI MATA PELAJARAN */}
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-2 uppercase italic">A. Nilai Capaian Kompetensi</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th className="w-10">No</th>
                      <th className="text-left">Mata Pelajaran</th>
                      <th className="w-20">Nilai</th>
                      <th className="w-32">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectList.map((subject: string, sIdx: number) => {
                      const score = student.grades[subject] || 0;
                      return (
                        <tr key={subject}>
                          <td className="text-center">{sIdx + 1}</td>
                          <td>{subject}</td>
                          <td className="text-center font-bold">{score || "-"}</td>
                          <td className="text-center">
                            {score >= 85 ? "Sangat Baik" : score >= 75 ? "Baik" : score > 0 ? "Cukup" : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 4. ABSENSI & CATATAN */}
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <h3 className="text-sm font-bold mb-2 uppercase italic">B. Ketidakhadiran</h3>
                  <table className="print-table">
                    <tbody>
                      <tr><td className="w-40">Sakit (S)</td><td className="text-center font-bold w-16">{student.attendance?.sick || 0}</td><td className="text-center">Hari</td></tr>
                      <tr><td>Izin (I)</td><td className="text-center font-bold">{student.attendance?.permission || 0}</td><td className="text-center">Hari</td></tr>
                      <tr><td>Tanpa Keterangan (A)</td><td className="text-center font-bold">{student.attendance?.absent || 0}</td><td className="text-center">Hari</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold mb-2 uppercase italic">C. Catatan Wali Kelas</h3>
                  <div className="flex-1 border-2 border-black p-3 text-xs italic leading-relaxed min-h-[80px]">
                    "{student.attendance?.note || "Tingkatkan terus semangat belajarmu untuk meraih prestasi yang lebih baik lagi."}"
                  </div>
                </div>
              </div>

              {/* 5. KEPUTUSAN & TANDA TANGAN */}
              <div className="mb-10 text-sm font-bold">
                <p>Keputusan: Berdasarkan hasil yang dicapai, siswa dinyatakan </p>
                <div className="mt-2 border-2 border-black w-max px-6 py-1 uppercase tracking-widest bg-gray-50">
                  {student.attendance?.is_promoted ? "NAIK KE KELAS BERIKUTNYA" : "TINGGAL DI KELAS YANG SAMA"}
                </div>
              </div>

              <div className="flex justify-between items-start text-sm">
                <div className="text-center w-64">
                  <p className="mb-24 font-bold">Orang Tua/Wali,</p>
                  <p className="font-bold border-b border-black w-48 mx-auto"></p>
                </div>
                <div className="text-center w-64">
                  <p className="mb-1 font-medium">Cirebon, {todayStr}</p>
                  <p className="mb-24 font-bold">Wali Kelas,</p>
                  <p className="font-bold underline uppercase">{classInfo.teacher_name}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  }
);

RaporPrintTemplate.displayName = "RaporPrintTemplate";