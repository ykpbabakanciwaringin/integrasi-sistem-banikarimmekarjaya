// LOKASI: src/components/pages/manage-lessons/schedule-print-template.tsx
import React, { forwardRef } from "react";

interface SchedulePrintTemplateProps {
  sortedClasses: any[];
  sortedDays: string[];
  scheduleMatrix: Record<string, Record<string, Record<string, any[]>>>;
}

export const SchedulePrintTemplate = forwardRef<HTMLDivElement, SchedulePrintTemplateProps>(
  ({ sortedClasses, sortedDays, scheduleMatrix }, ref) => {
    return (
      // Class 'hidden print:block' memastikan ini tidak mengganggu layar utama, tapi muncul saat dicetak
      <div className="hidden print:block w-full text-black" ref={ref}>
        {/* SUNTIKAN CSS KHUSUS PRINTER TINGKAT TINGGI */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: legal landscape; margin: 10mm; }
              body { background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              
              /* Sembunyikan elemen UI lainnya */
              header, nav, footer, .no-print { display: none !important; }
              
              /* Styling Tabel Profesional */
              .print-schedule-table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11px; }
              .print-schedule-table th { background-color: #f1f5f9 !important; border: 1.5px solid #000 !important; padding: 6px 4px; text-align: center; font-weight: bold; color: #000 !important; text-transform: uppercase; }
              .print-schedule-table td { border: 1.5px solid #000 !important; padding: 4px; vertical-align: top; color: #000 !important; }
              
              /* Kustomisasi Khusus Hari & Jam */
              .col-hari-jam { width: 120px; text-align: center; font-weight: bold; }
              .cell-content { margin-bottom: 4px; padding-bottom: 4px; border-bottom: 0.5px dashed #666; }
              .cell-content:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
              .mapel-text { font-weight: bold; font-size: 11px; }
              .guru-text { font-size: 10px; font-style: italic; }
            }
          `
        }} />

        {/* KOP SURAT / JUDUL */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-black uppercase tracking-widest mb-1">Master Jadwal Pelajaran</h1>
          <p className="text-sm font-bold">Dicetak dari Sistem Manajemen Sekolah</p>
          <hr className="border-black border-t-2 mt-4 mb-1" />
          <hr className="border-black border-t mt-1 mb-4" />
        </div>

        {/* TABEL JADWAL */}
        <table className="print-schedule-table">
          <thead>
            <tr>
              <th className="col-hari-jam">HARI & JAM</th>
              {sortedClasses.map((c) => (
                <th key={c.id}>{c.level} - {c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDays.map((day) => {
              const times = Object.keys(scheduleMatrix[day]).sort();
              return times.map((time, tIdx) => (
                <tr key={`${day}-${time}`}>
                  {/* Kolom Hari & Jam */}
                  <td className="col-hari-jam bg-slate-50">
                    {tIdx === 0 && <div className="text-sm mb-1 uppercase tracking-wider">{day}</div>}
                    <div className="text-[10px] font-mono">{time}</div>
                  </td>

                  {/* Kolom Kelas & Pelajaran */}
                  {sortedClasses.map((c) => {
                    const cellSchedules = scheduleMatrix[day][time][c.id] || [];
                    const isConflict = cellSchedules.length > 1;

                    return (
                      <td key={c.id} style={{ backgroundColor: isConflict ? '#fee2e2' : 'transparent' }}>
                        {cellSchedules.length > 0 ? (
                          cellSchedules.map((s: any, sIdx: number) => (
                            <div key={sIdx} className="cell-content">
                              <div className="mapel-text">
                                {isConflict ? "⚠️ BENTROK: " : ""}{s.allocation?.subject?.name}
                              </div>
                              <div className="guru-text">
                                {s.allocation?.teacher?.profile?.full_name || s.allocation?.teacher?.full_name || s.allocation?.teacher?.name || "Guru"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-400">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

SchedulePrintTemplate.displayName = "SchedulePrintTemplate";