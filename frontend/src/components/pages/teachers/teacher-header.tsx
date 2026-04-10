// LOKASI: src/components/pages/teachers/teacher-header.tsx
import { Button } from "@/components/ui/button";
import { UserCog, FileSpreadsheet, Plus, Printer, Loader2, FileDown, FileText } from "lucide-react";

interface TeacherHeaderProps {
  selectedCount: number;
  isPrinting: boolean;
  onPrintClick: () => void;
  onImportClick: () => void;
  onAddClick: () => void;
  onExportExcelClick: () => void;
  onExportPdfClick: () => void;
}

export function TeacherHeader({
  selectedCount,
  isPrinting,
  onPrintClick,
  onImportClick,
  onAddClick,
  onExportExcelClick,
  onExportPdfClick,
}: TeacherHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <UserCog className="h-6 w-6 text-emerald-600" /> Data Guru
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manajemen biodata lengkap, penugasan lembaga, dan verifikasi pendidik.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {selectedCount > 0 && (
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md animate-in zoom-in duration-200"
            onClick={onPrintClick}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Cetak {selectedCount} ID Card
          </Button>
        )}

        {/* Tombol Unduh PDF */}
        <Button
          variant="outline"
          className="bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-sm"
          onClick={onExportPdfClick}
        >
          <FileText className="mr-2 h-4 w-4" /> Unduh PDF Data Guru
        </Button>

        {/* Tombol Unduh Excel */}
        <Button
          variant="outline"
          className="bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm"
          onClick={onExportExcelClick}
          title="Unduh data guru untuk diedit secara massal"
        >
          <FileDown className="mr-2 h-4 w-4" /> Unduh Excel Data Guru
        </Button>

        {/* Tombol Impor Data */}
        <Button
          variant="outline"
          className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
          onClick={onImportClick}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Unggah Excel Data Guru 
        </Button>

        {/* Tombol Tambah Manual */}
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
          onClick={onAddClick}
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Guru
        </Button>
      </div>
    </div>
  );
}