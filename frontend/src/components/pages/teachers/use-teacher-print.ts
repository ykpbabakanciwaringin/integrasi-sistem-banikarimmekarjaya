// LOKASI: src/components/pages/teachers/use-teacher-print.ts
import { useState, useRef } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { getUniversalImageUrl } from "@/lib/axios";

// Helper untuk format lembaga & jabatan
export const getInstNamesWithPosition = (item: any) => {
  if (!item) return "-";
  if (item.role === "SUPER_ADMIN") return "PUSAT / GLOBAL";

  return (
    item.enrollments
      ?.map((en: any) => `${en.institution?.name || "Lembaga"} (${en.position || "Guru"})`)
      .join(", ") || "Belum Terdaftar"
  );
};

export function useTeacherPrint(
  teachers: any[],
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
      console.warn("Gagal fetch gambar aset:", url);
      return null;
    }
  };

  //  Disesuaikan menjadi processBatchPrint agar sama dengan struktur Data Siswa
  const processBatchPrint = async () => {
    if (selectedIds.length === 0) return;
    setIsPrinting(true);
    const toastId = toast.loading("Mengunduh aset ID Card Guru...");

    try {
      const teachersToPrint = teachers.filter((t: any) =>
        selectedIds.includes(t.id)
      );
      const zip = new JSZip();
      let validCount = 0;

      // Ambil Base64 untuk Logo & TTD (CORS Handle)
      const logoBase64 = await convertImageToBase64(`${window.location.origin}/images/logo-ykp.png`);
      const ttdBase64 = await convertImageToBase64(`${window.location.origin}/images/ttd-ketua-yayasan.png`);

      for (let i = 0; i < teachersToPrint.length; i++) {
        const t = teachersToPrint[i];
        if (!t.profile?.full_name) continue;

        toast.loading(`Memproses kartu ${i + 1}/${teachersToPrint.length}...`, {
          id: toastId,
        });

        //  Pastikan route verifikasi sesuai sistem Anda
        const qrDataUrl = await QRCode.toDataURL(
          `${window.location.origin}/public/verify/teacher/${t.id}`,
          { margin: 0, width: 300 }
        );
        
        const photoBase64 = t.profile?.image
          ? await convertImageToBase64(getUniversalImageUrl(t.profile.image))
          : null;

        // Persiapkan data untuk dikirim ke komponen cetak (teacher-id-card-print.tsx)
        setPrintData({
          nama: t.profile.full_name,
          nip: t.profile?.n_ip || t.profile?.nip || "-",
          nik: t.profile?.nik || "-",
          ttl: `${t.profile?.birth_place || "-"}, ${
            t.profile?.birth_date && !t.profile.birth_date.startsWith("0001")
              ? new Date(t.profile.birth_date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "-"
          }`,
          gender: t.profile?.gender === "P" ? "PEREMPUAN" : "LAKI-LAKI",
          lembaga: getInstNamesWithPosition(t),
          jabatan: t.enrollments?.[0]?.position || "GURU MAPEL",
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

        // Jeda waktu rendering DOM React tersembunyi
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (printCardRef.current) {
          const dataUrl = await toPng(printCardRef.current, {
            pixelRatio: 2, // Resolusi tinggi (Retina)
            cacheBust: true,
          });
          
          const safeName = t.profile.full_name.replace(/[^a-zA-Z0-9]/g, "_");
          
          if (selectedIds.length === 1) {
            saveAs(dataUrl, `ID_Card_Guru_${safeName}.png`);
            validCount++;
            break;
          } else {
            zip.file(
              `ID_Card_Guru_${safeName}.png`,
              dataUrl.replace(/^data:image\/png;base64,/, ""),
              { base64: true }
            );
            validCount++;
          }
        }
      }

      if (selectedIds.length > 1 && validCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "ID_Card_Guru_Batch.zip");
      }
      toast.success("Cetak kartu guru selesai!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memproses gambar cetak.", { id: toastId });
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
    processBatchPrint, // Telah diubah namanya agar sama dengan siswa
    getInstNamesWithPosition,
  };
}