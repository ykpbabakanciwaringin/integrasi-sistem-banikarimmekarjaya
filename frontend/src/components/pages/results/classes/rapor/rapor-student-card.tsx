import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, FileText, CheckCircle2, XCircle } from "lucide-react";

export function RaporStudentCard({ student }: any) {
  // Fungsi cetak individu (opsional jika ingin dipisahkan)
  const handlePrintIndividual = () => {
    // Logika cetak individu bisa dihandle via refs massal dengan filter atau fungsi terpisah
    window.print(); 
  };

  return (
    <Card className="group relative overflow-hidden border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50/50 transition-all duration-300 bg-white rounded-2xl p-5 flex flex-col justify-between h-full">
      {/* Dekorasi kartu */}
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${student.attendance?.is_promoted ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
            <User className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          
          <Badge 
            variant="outline" 
            className={`font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg ${
              student.attendance?.is_promoted 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}
          >
            {student.attendance?.is_promoted ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Naik Kelas</span>
            ) : (
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Tinggal Kelas</span>
            )}
          </Badge>
        </div>

        <div>
          <h3 className="font-black text-slate-800 text-base leading-tight uppercase group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[3rem]">
            {student.student_name}
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
            NISN: {student.nisn || "-"}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          <div className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
            S: {student.attendance?.sick || 0}
          </div>
          <div className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
            I: {student.attendance?.permission || 0}
          </div>
          <div className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
            A: {student.attendance?.absent || 0}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <Button 
          variant="outline"
          className="w-full border-slate-200 text-slate-600 font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all rounded-xl h-10 group/btn"
        >
          <FileText className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" /> Preview Rapor
        </Button>
      </div>
    </Card>
  );
}