// LOKASI: src/components/pages/manage-exams/[eventId]/use-participant-print.ts
import { useState, useRef } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import QRCode from "qrcode"; 
import { examService } from "@/services/exam.service";
import { getUniversalImageUrl } from "@/lib/axios";

/**
 * Helper: Mengubah URL gambar ke Base64 dengan penanganan CORS & Error
 */
const convertImageToBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const fullUrl = getUniversalImageUrl(url);
    const response = await fetch(fullUrl, { 
      mode: "cors", 
      cache: "no-cache",
      headers: { 'Accept': 'image/*' }
    });
    
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null); 
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Gagal convert image:", url, error);
    return null;
  }
};

export function useParticipantPrint(selectedIds: string[], onClearSelection: () => void) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [singlePrintData, setSinglePrintData] = useState<any>(null); 
  const singlePrintRef = useRef<HTMLDivElement>(null);

  // [PERBAIKAN] Menambahkan parameter 'level' untuk mendeteksi apakah mencetak per Sesi atau per Event
  const startPrintProcess = async (id: string, mode: "single" | "a4", level: "session" | "event" = "session") => {
    if (selectedIds.length === 0) return;
    
    setIsPrinting(true);
    const toastId = toast.loading("Menghubungkan ke server...");

    try {
      // 1. Ambil data rahasia dari server (Dinamis berdasarkan Level)
      let response;
      if (level === "event") {
        response = await examService.downloadEventExamCards(id);
      } else {
        response = await examService.downloadExamCards(id);
      }

      const rawData = response?.data || response || [];
      
      if (!rawData || rawData.length === 0) throw new Error("Data kartu tidak ditemukan di server.");

      // [PERBAIKAN] Jika id yang dipilih berisi array string "ALL", cetak semua peserta yang didapat dari API
      const isSelectAll = selectedIds.includes("ALL");
      const targets = isSelectAll ? rawData : rawData.filter((p: any) => selectedIds.includes(p.student_id));
      
      if (targets.length === 0) throw new Error("Tidak ada data peserta yang cocok untuk dicetak.");

      toast.loading(`Menyiapkan aset visual untuk ${targets.length} peserta...`, { id: toastId });

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      // ---  OPTIMASI: SISTEM CACHE LOGO ---
      let cachedLogoB64: string | null = null;
      if (targets.length > 0 && targets[0].logo_url) {
        toast.loading("Mengunduh atribut lembaga...", { id: toastId });
        cachedLogoB64 = await convertImageToBase64(targets[0].logo_url);
      }

      // 2. Pemetaan Data & Generate QR Code secara paralel
      const printItems = await Promise.all(
        targets.map(async (p: any) => {
          const photoB64 = await convertImageToBase64(p.photo_url || p.image);
          const safeUsername = p.student_username || p.student?.username || "user";
          
          const qrContent = `${baseUrl}/login?u=${encodeURIComponent(safeUsername)}`;
          const qrDataUrl = await QRCode.toDataURL(qrContent, { 
            margin: 1, 
            width: 150, 
            color: { dark: '#003323', light: '#ffffff' } 
          });

          const rawPassword = p.student_password || p.password_plain || p.student?.password_plain;

          return {
            id: p.student_id,
            student_name: (p.student_name || p.student?.profile?.full_name || "Tanpa Nama").toUpperCase(),
            student_nisn: p.student_nisn || p.student?.profile?.nisn || "-",
            student_username: safeUsername,
            student_password: rawPassword || "123456", 
            exam_number: p.exam_number || "-",
            room: p.class_name || p.student?.profile?.class?.name || "Umum",
            institution_name: p.institution_name || "LEMBAGA PENDIDIKAN",
            address_detail: p.address_detail,
            address_city: p.address_city,
            contact_phone: p.contact_phone,
            logoUrl: cachedLogoB64, 
            photoUrl: photoB64,
            qrCodeUrl: qrDataUrl, 
            printDate: new Date().toLocaleDateString("id-ID", { 
              day: "2-digit", month: "long", year: "numeric", 
              hour: "2-digit", minute: "2-digit" 
            }) + " WIB",
          };
        })
      );

      // =====================================
      // MODE 1: CETAK SATUAN (ZIP/PNG)
      // =====================================
      if (mode === "single") {
        const zip = new JSZip();
        
        for (let i = 0; i < printItems.length; i++) {
          const item = printItems[i];
          setSinglePrintData(item); 
          
          const progress = Math.round(((i + 1) / printItems.length) * 100);
          toast.loading(`Rendering gambar: ${progress}% selesai...`, { id: toastId });
          
          await new Promise((resolve) => setTimeout(resolve, 200)); 

          if (singlePrintRef.current) {
            const dataUrl = await toPng(singlePrintRef.current, { 
              pixelRatio: 3, 
              cacheBust: true,
            });

            const safeFileName = `KARTU_UJIAN_${item.student_name.replace(/\s+/g, '_')}_${item.student_nisn}.png`;

            if (printItems.length === 1) {
              saveAs(dataUrl, safeFileName);
            } else {
              zip.file(safeFileName, dataUrl.replace(/^data:image\/png;base64,/, ""), { base64: true });
            }
          }
        }
        
        if (printItems.length > 1) {
          toast.loading("Mengemas paket ZIP...", { id: toastId });
          const content = await zip.generateAsync({ type: "blob" });
          saveAs(content, `PAKET_KARTU_UJIAN_${new Date().getTime()}.zip`);
        }
        toast.success("Cetak kartu satuan berhasil!", { id: toastId });
      } 
      
      // =====================================
      // MODE 2: CETAK A4 (PDF)
      // =====================================
      else if (mode === "a4") {
        // [PERBAIKAN] Instansiasi PDF langsung
        const pdf = new jsPDF("p", "mm", "a4");
        const cardWidth = 90;
        const cardHeight = 60;
        const marginLeft = 12;
        const marginTop = 15;
        const gapX = 6;
        const gapY = 6;

        for (let i = 0; i < printItems.length; i++) {
          toast.loading(`Menyusun PDF: ${i + 1} / ${printItems.length}`, { id: toastId });
          
          setSinglePrintData(printItems[i]); 
          await new Promise((resolve) => setTimeout(resolve, 200)); 

          if (singlePrintRef.current) {
            const dataUrl = await toPng(singlePrintRef.current, { 
              pixelRatio: 2.5, 
              cacheBust: true 
            });

            if (i > 0 && i % 8 === 0) pdf.addPage();

            const pos = i % 8;
            const col = pos % 2;
            const row = Math.floor(pos / 2);

            const x = marginLeft + (col * (cardWidth + gapX));
            const y = marginTop + (row * (cardHeight + gapY));

            pdf.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight, undefined, 'FAST');
          }
        }
        
        pdf.save(`KARTU_UJIAN_A4_BATCH_${new Date().getTime()}.pdf`);
        toast.success("Dokumen PDF berhasil diunduh!", { id: toastId });
      }

      onClearSelection();
    } catch (error: any) {
      console.error("Print Engine Error:", error);
      toast.error("Gagal mencetak: " + (error.message || "Kesalahan sistem"), { id: toastId });
    } finally {
      setIsPrinting(false);
      setSinglePrintData(null); // Memory cleanup
    }
  };

  return { isPrinting, singlePrintRef, singlePrintData, startPrintProcess };
}