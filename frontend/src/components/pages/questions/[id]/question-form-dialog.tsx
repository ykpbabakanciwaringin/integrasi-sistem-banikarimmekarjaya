// LOKASI: src/components/pages/questions/[id]/question-form-dialog.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageCircleQuestionMark, AlignLeft, CheckCircle2, UploadCloud, Pencil, X, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { questionService } from "@/services/question.service";
import { getUniversalImageUrl } from "@/lib/axios";

// --- SUB-KOMPONEN UI ---
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <h4 className="text-[11px] font-bold text-emerald-700 flex items-center gap-2 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-2">
    {icon} {title}
  </h4>
);

const InputField = ({ label, children, error }: { label: string; children: React.ReactNode; error?: boolean }) => (
  <div className="space-y-1.5">
    <Label className={`text-[11px] font-bold uppercase tracking-wider ${error ? 'text-rose-500' : 'text-slate-500'}`}>
      {label}
    </Label>
    {children}
  </div>
);

// --- INTERFACE ---
interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: any;
  onSubmit: (payload: any) => void;
  isSaving: boolean;
}

export function QuestionFormDialog({
  open, onOpenChange, isEditMode, initialData, onSubmit, isSaving,
}: QuestionFormDialogProps) {
  
  // --- STATE ---
  const [itemForm, setItemForm] = useState({
    type: "PG", 
    question: "", option_a: "", option_b: "", option_c: "", option_d: "", option_e: "",
    answer_key: "A", score_weight: 1, image_url: "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocked = isSaving || isUploadingImage; // Indikator penguncian form

  // --- EFEK & RESET ---
  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setItemForm({
          type: initialData.type || "PG",
          question: initialData.content?.question || "",
          option_a: initialData.content?.options?.A || "",
          option_b: initialData.content?.options?.B || "",
          option_c: initialData.content?.options?.C || "",
          option_d: initialData.content?.options?.D || "",
          option_e: initialData.content?.options?.E || "",
          answer_key: initialData.answer_key || "A",
          score_weight: initialData.score_weight || 1,
          image_url: initialData.content?.image_url || "",
        });
        setPreviewImage(initialData.content?.image_url ? getUniversalImageUrl(initialData.content.image_url) : null);
      } else {
        setItemForm({
          type: "PG", question: "", option_a: "", option_b: "", option_c: "", option_d: "", option_e: "", answer_key: "A", score_weight: 1, image_url: "",
        });
        setPreviewImage(null);
      }
      setImageFile(null);
    }
  }, [open, isEditMode, initialData]);

  // --- HANDLERS ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran gambar maksimal 2MB");
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewImage(null);
    setItemForm({ ...itemForm, image_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!itemForm.question.trim()) return toast.warning("Redaksi pertanyaan tidak boleh kosong");
    
    if (itemForm.type === "PG") {
      if (!itemForm.option_a.trim() || !itemForm.option_b.trim()) return toast.warning("Minimal Opsi A dan B harus diisi");
      if (!itemForm.answer_key) return toast.warning("Kunci jawaban PG harus dipilih");
    } else {
      if (!itemForm.answer_key.trim()) return toast.warning("Panduan kunci jawaban Essay harus diisi");
    }

    let finalImageUrl = itemForm.image_url;
    if (imageFile) {
      setIsUploadingImage(true);
      try {
        finalImageUrl = await questionService.uploadImage(imageFile);
      } catch (error) {
        setIsUploadingImage(false);
        return toast.error("Gagal mengunggah gambar");
      }
      setIsUploadingImage(false);
    }

    // [PERBAIKAN KRUSIAL]: Wajib menyertakan ID jika sedang dalam mode edit agar tidak beranak-pinak (duplikat)
    onSubmit({ 
      ...itemForm, 
      image_url: finalImageUrl,
      id: isEditMode ? initialData.id : undefined 
    });
  };

  const isPG = itemForm.type === "PG";

  return (
    <Dialog open={open} onOpenChange={!isLocked ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="max-w-[1000px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl h-[90vh] flex flex-col">
        
        {/* HEADER MODAL */}
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Pencil className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Edit Butir Soal" : "Tambah Soal Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-0.5">
                Lengkapi redaksi pertanyaan, opsi jawaban, dan pengaturan butir soal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* AREA KONTEN SCROLLABLE */}
        <div className="p-6 bg-slate-50/50 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* KOLOM KIRI (7 Kolom): Redaksi & Jawaban */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Blok 1: Redaksi Pertanyaan */}
              <div>
                <SectionHeader icon={<AlignLeft className="h-4 w-4" />} title="Redaksi Pertanyaan" />
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <InputField label="Teks Pertanyaan *">
                    <Textarea 
                      value={itemForm.question} 
                      onChange={(e) => setItemForm({ ...itemForm, question: e.target.value })} 
                      placeholder="Ketik pertanyaan di sini..." 
                      className="min-h-[140px] resize-y border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-[14px] leading-relaxed" 
                      disabled={isLocked} // [PENYEMPURNAAN] Dikunci saat menyimpan
                    />
                  </InputField>
                </div>
              </div>

              {/* Blok 2: Opsi / Panduan Jawaban */}
              <div>
                <SectionHeader icon={<MessageCircleQuestionMark className="h-4 w-4" />} title={isPG ? "Pilihan Jawaban & Kunci" : "Kunci / Panduan Essay"} />
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  {isPG ? (
                    <div className="space-y-4">
                      {["A", "B", "C", "D", "E"].map((opt) => {
                        const isCorrect = itemForm.answer_key === opt;
                        return (
                          <div key={opt} className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${isCorrect ? "bg-emerald-50/50 border-emerald-300 shadow-sm ring-1 ring-emerald-400/20" : "bg-white border-slate-200 hover:border-emerald-200"}`}>
                            
                            {/* [PENYEMPURNAAN] Tombol pemilihan jawaban dikunci jika isLocked */}
                            <div 
                              className={`flex shrink-0 items-center justify-center h-10 w-10 rounded-lg font-black text-sm border-2 transition-colors shadow-sm 
                                ${isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-200 text-slate-400"}
                                ${isLocked ? "cursor-not-allowed opacity-60" : isCorrect ? "" : "hover:text-emerald-600 hover:border-emerald-300 cursor-pointer"}
                              `} 
                              onClick={isLocked ? undefined : () => setItemForm({ ...itemForm, answer_key: opt })}
                              title={`Jadikan ${opt} sebagai kunci jawaban`}
                            >
                              {opt}
                            </div>
                            
                            <Textarea 
                              value={(itemForm as any)[`option_${opt.toLowerCase()}`]} 
                              onChange={(e) => setItemForm({ ...itemForm, [`option_${opt.toLowerCase()}`]: e.target.value })} 
                              placeholder={`Teks opsi ${opt}...`} 
                              className={`min-h-[40px] h-10 resize-y focus-visible:ring-emerald-500 bg-white ${isCorrect ? 'border-emerald-200' : 'border-slate-200'}`} 
                              disabled={isLocked} // [PENYEMPURNAAN] Dikunci saat menyimpan
                            />
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kunci Jawaban Terpilih:</span>
                        <div className="h-8 w-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200 shadow-sm">
                          {itemForm.answer_key}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <InputField label="Panduan Jawaban Benar *">
                      <Textarea 
                        value={itemForm.answer_key} 
                        onChange={(e) => setItemForm({ ...itemForm, answer_key: e.target.value })} 
                        placeholder="Ketik inti atau panduan jawaban yang benar untuk acuan koreksi penilai..." 
                        className="min-h-[220px] resize-y border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-[14px] leading-relaxed" 
                        disabled={isLocked} // [PENYEMPURNAAN] Dikunci saat menyimpan
                      />
                    </InputField>
                  )}
                </div>
              </div>

            </div>

            {/* KOLOM KANAN (5 Kolom): Pengaturan & Gambar */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div>
                <SectionHeader icon={<Settings className="h-4 w-4" />} title="Pengaturan Soal" />
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5">
                  
                  <InputField label="Tipe Butir Soal">
                    <Select value={itemForm.type} onValueChange={(v) => setItemForm({ ...itemForm, type: v, answer_key: v === "PG" ? "A" : "" })} disabled={isLocked}>
                      <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 font-bold text-slate-700 shadow-sm bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PG">Pilihan Ganda (A-E)</SelectItem>
                        <SelectItem value="ESSAY">Essay / Uraian</SelectItem>
                      </SelectContent>
                    </Select>
                  </InputField>
                  
                  <InputField label="Bobot Nilai (Poin)">
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      value={itemForm.score_weight} 
                      onChange={(e) => setItemForm({ ...itemForm, score_weight: Number(e.target.value) })} 
                      className="h-10 bg-slate-50 border-slate-200 text-center font-bold text-emerald-700 text-lg shadow-sm" 
                      disabled={isLocked} // [PENYEMPURNAAN] Dikunci saat menyimpan
                    />
                  </InputField>

                  <div className="pt-2 border-t border-slate-100">
                    <InputField label="Gambar / Lampiran (Opsional)">
                      <div className="mt-3 flex flex-col items-center gap-4">
                        {previewImage ? (
                          <div className="relative group rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 w-full p-2">
                            <img src={previewImage} alt="Preview" className="w-full h-auto object-contain max-h-[200px] rounded-lg" />
                            
                            {/* [PENYEMPURNAAN] Tombol hapus gambar dikunci saat isLocked */}
                            <div className={`absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm ${isLocked ? 'pointer-events-none' : ''}`}>
                              <Button size="sm" variant="destructive" onClick={handleRemoveImage} disabled={isLocked} className="h-9 shadow-lg font-bold">
                                <X className="h-4 w-4 mr-2"/> Hapus Gambar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          
                          /* [PENYEMPURNAAN] Area klik upload dikunci jika isLocked */
                          <div 
                            onClick={isLocked ? undefined : () => fileInputRef.current?.click()} 
                            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all shadow-sm group
                              ${isLocked ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed" : "border-slate-300 text-slate-500 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 cursor-pointer"}
                            `}
                          >
                            <UploadCloud className={`h-8 w-8 mb-3 transition-colors ${isLocked ? "text-slate-300" : "text-slate-400 group-hover:text-emerald-500"}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">Pilih / Unggah Gambar</span>
                            <span className="text-[10px] opacity-70 mt-1">Maksimal ukuran 2MB (JPG/PNG)</span>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" disabled={isLocked} />
                      </div>
                    </InputField>
                  </div>

                </div>
              </div>
              
            </div>
            
          </div>
        </div>

        {/* FOOTER MODAL */}
        <DialogFooter className="p-4 bg-white border-t border-slate-100 flex justify-between items-center sm:justify-between rounded-b-xl shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLocked} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-10 px-4 font-semibold">
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLocked} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all h-10 px-6 font-bold"
          >
            {isLocked ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...</>
            ) : isEditMode ? (
              <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Tambahkan Soal</>
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}