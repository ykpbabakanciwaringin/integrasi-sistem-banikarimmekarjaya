// LOKASI: src/hooks/use-exam-security.ts
import { useEffect, useState, useRef } from "react";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import toast from "react-hot-toast";

interface UseExamSecurityProps {
  isActive: boolean;
  onViolation: (type: string) => void;
}

export const useExamSecurity = ({ isActive, onViolation }: UseExamSecurityProps) => {
  const [isSafeBrowser, setIsSafeBrowser] = useState<boolean>(true);
  const addViolation = useStudentExamStore((state) => state.addViolation);
  const takeSnapshot = useStudentExamStore((state) => state.takeSnapshot); //  Pemicu Kamera
  const examData = useStudentExamStore((state) => state.examData);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // 1. CEK DEVICE: HP atau Desktop?
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    //  FIX UTAMA: Pengecekan User-Agent yang fleksibel untuk SEB Windows v3.10.1+
    const userAgentLower = navigator.userAgent.toLowerCase();
    const isSebBrowser = userAgentLower.includes("safeexambrowser") || userAgentLower.includes("seb");

    // 2. KUNCI DINAMIS SEB & ADAPTIVE MOBILE
    if (examData && examData.is_seb_required === true) {
      // FIX: Gunakan variabel isSebBrowser yang sudah diubah ke lowercase
      if (!isMobile && !isSebBrowser) {
        setIsSafeBrowser(false);
        return; // Blokir langsung jika di Laptop tapi tidak pakai SEB
      } else {
        setIsSafeBrowser(true); // Pastikan state aman jika lolos
      }
      // Jika di HP (isMobile), abaikan cek SEB, tapi kita akan enforce layar penuh di bawah.
    } else if (examData && examData.is_seb_required === false) {
      setIsSafeBrowser(true);
    }

    // 3. [HARDENING] Multi-Tab Prevention (Skrip Asli Anda)
    let bc: BroadcastChannel | null = null;
    if (examData?.session_id) {
      bc = new BroadcastChannel(`exam_session_${examData.session_id}`);
      bc.postMessage({ type: "CHECK_OTHER_TABS" });

      bc.onmessage = (event) => {
        if (event.data.type === "CHECK_OTHER_TABS") {
          bc?.postMessage({ type: "ALREADY_ACTIVE" });
        }
        if (event.data.type === "ALREADY_ACTIVE") {
          toast.error("Ujian sudah terbuka di tab lain!", { id: "multi-tab" });
          onViolation("MULTI_TAB_ATTEMPT");
        }
      };
    }

    //  FUNGSI PEMICU PELANGGARAN + KAMERA
    const triggerViolation = (type: string, message: string) => {
      addViolation();
      takeSnapshot(type); // 📸 JEPRET WAJAH PELAKU!
      toast.error(message, { duration: 4000, id: "violation-toast" });
      onViolation(type);
    };

    // 4. Smart Violation Debouncing (Deteksi Pindah Jendela)
    const handleBlur = () => {
      blurTimeoutRef.current = setTimeout(() => {
        triggerViolation("WINDOW_FOCUS_LOSS", "PELANGGARAN: Anda meninggalkan jendela ujian!");
      }, 1500);
    };

    const handleFocus = () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) triggerViolation("TAB_SWITCH", "PELANGGARAN: Dilarang membuka aplikasi lain!");
    };

    // 5. Blokir Shortcut & Klik Kanan
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
        triggerViolation("DEV_TOOLS_ATTEMPT", "Percobaan meretas diblokir.");
      }
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        toast.error("Dilarang mencetak halaman ujian!");
      }
    };

    // 6. ENFORCE FULLSCREEN (Untuk HP / Non-SEB Desktop)
    const requestFullscreen = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    const handleFullscreenChange = () => {
      //  FIX: Pastikan fitur Fullscreen juga mengenali isSebBrowser agar siswa di SEB tidak terdeteksi melanggar
      if (!document.fullscreenElement && !isSebBrowser) {
        triggerViolation("LEAVE_FULLSCREEN", "PELANGGARAN: Dilarang keluar dari Layar Penuh!");
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    
    // Paksa masuk layar penuh saat klik pertama
    if (isMobile || (examData && !examData.is_seb_required)) {
      document.addEventListener("click", requestFullscreen, { once: true });
      document.addEventListener("fullscreenchange", handleFullscreenChange);
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isActive, examData?.session_id, examData?.is_seb_required, addViolation, onViolation, takeSnapshot]);

  return { isSafeBrowser };
};