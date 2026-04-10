// LOKASI: src/components/pages/students/use-student-print.ts
import { useState, useRef } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { getUniversalImageUrl } from "@/lib/axios";
import { User } from "@/types/user";

// Helper untuk mendapatkan nama lembaga formal dari relasi yang ada
const getInstitutionName = (student: User) => {
  if (student.institution_name) return student.institution_name;
  if (student.enrollments && student.enrollments.length > 0) {
    return student.enrollments[0].institution?.name || "Lembaga Pendidikan";
  }
  return (student as any).institution?.name || "YAYASAN KEBAJIKAN PESANTREN";
};

export function useStudentPrint(
  students: User[],
  selectedIds: string[],
  onClearSelection: () => void
) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const printCardRef = useRef<HTMLDivElement>(null);

  const convertImageToBase64 = async (url: string) => {
    if (!url) return null;
    try {
      const response = await fetch(url, { mode: "cors", cache: "no-cache" });
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  };

  const processBatchPrint = async () => {
    if (selectedIds.length === 0) return;
    setIsPrinting(true);
    const toastId = toast.loading("Mengunduh aset Kartu Siswa...");

    try {
      const studentsToPrint = students.filter((s) => selectedIds.includes(s.id));
      const zip = new JSZip();
      let validCount = 0;

      // Persiapkan Base64 untuk Logo & Tanda Tangan (Hindari CORS error saat render kanvas)
      const logoBase64 = await convertImageToBase64(`${window.location.origin}/images/logo-ykp.png`);
      const ttdBase64 = await convertImageToBase64(`${window.location.origin}/images/ttd-ketua-yayasan.png`);

      for (let i = 0; i < studentsToPrint.length; i++) {
        const s = studentsToPrint[i];
        if (!s.profile?.full_name) continue;

        toast.loading(`Memproses kartu ${i + 1}/${studentsToPrint.length}...`, {
          id: toastId,
        });

        // Generate QR Code mengarah ke sistem verifikasi publik (opsional jika ada)
        const qrDataUrl = await QRCode.toDataURL(
          `${window.location.origin}/verify/student/${s.id}`,
          { margin: 0, width: 300 }
        );
        
        const photoBase64 = s.profile?.image
          ? await convertImageToBase64(getUniversalImageUrl(s.profile.image))
          : null;

        // Persiapkan payload yang diterima oleh `student-id-card-print.tsx`
        setPrintData({
          nama: s.profile.full_name,
          nisn: s.profile.nisn || s.profile.nik || "-",
          kelas: s.profile.class?.name || "Belum Ditentukan",
          pondok: s.profile.pondok || "TIDAK MUKIM",
          kamar: s.profile.kamar || "",
          program: s.profile.program || "TIDAK IKUT PROGRAM",
          lembaga: getInstitutionName(s),
          photoUrl: photoBase64,
          qrCodeUrl: qrDataUrl,
          logoUrl: logoBase64,
          ttdUrl: ttdBase64,
          printDate: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        });

        // Jeda untuk memberi waktu React melakukan re-render komponen tersembunyi
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (printCardRef.current) {
          const dataUrl = await toPng(printCardRef.current, {
            pixelRatio: 2,
            cacheBust: true,
          });
          
          if (selectedIds.length === 1) {
            saveAs(dataUrl, `KTS_${s.profile.full_name.replace(/\s+/g, "_")}.png`);
            validCount++;
            break;
          } else {
            zip.file(
              `KTS_${s.profile.full_name.replace(/\s+/g, "_")}.png`,
              dataUrl.replace(/^data:image\/png;base64,/, ""),
              { base64: true }
            );
            validCount++;
          }
        }
      }

      if (selectedIds.length > 1 && validCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "Kartu_Tanda_Siswa_Batch.zip");
      }
      toast.success("Cetak kartu selesai!", { id: toastId });
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses gambar cetak.", { id: toastId });
      console.error(error);
    } finally {
      setIsPrinting(false);
      setPrintData(null);
      onClearSelection();
    }
  };

  return {
    isPrinting,
    printData,
    printCardRef,
    processBatchPrint,
  };
}