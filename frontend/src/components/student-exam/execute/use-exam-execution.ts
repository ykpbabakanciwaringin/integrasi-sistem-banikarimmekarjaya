// LOKASI: src/components/pages/student-exam/execute/use-exam-execution.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useExamSecurity } from "@/hooks/use-exam-security";
import { StudentExamService } from "@/services/student-exam.service";
import toast from "react-hot-toast";

export function useExamExecution() {
  const router = useRouter();

  // 1. GLOBAL STORES
  const { user } = useAuthStore();
  const {
    examData,
    answers,
    doubtfulAnswers,
    setAnswer,
    toggleDoubtful,
    addViolation,
    sendHeartbeat,
    clearExam,
    syncAnswers,
    isOnline,
    restTimeRemaining,
    startExam,
  } = useStudentExamStore();

  // 2. LOCAL STATES
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Mencegah Hydration Error di Next.js
  useEffect(() => setIsMounted(true), []);

  // 3. VALIDASI AKSES
  useEffect(() => {
    if (isMounted && !examData && !isFinishing) {
      toast.error("Sesi ujian tidak valid atau sudah berakhir. Silakan masuk kembali.");
      router.replace("/student-exam");
    }
  }, [isMounted, examData, isFinishing, router]);

  // 4. HANDLER SELESAI UJIAN (Pembaruan Fase Multi-Mapel)
  const handleConfirmFinish = useCallback(async () => {
    if (!examData) return;
    try {
      setIsFinishing(true);
      await syncAnswers(); // Pastikan sinkronisasi terakhir berjalan

      // Memanggil endpoint untuk mengakhiri mapel saat ini dan menangkap respons peladen
      const result = await StudentExamService.finishExam(examData.session_id);

      if (result?.status === "WAITING") {
        // [MULTI-MAPEL] Masih ada mapel selanjutnya, masuk ke Mode Jeda (Istirahat)
        useStudentExamStore.setState((state) => ({
          examData: {
            ...state.examData!,
            status: "WAITING",
          },
          restTimeRemaining: 120, // Tetapkan 2 menit jeda
          answers: {},            // Bersihkan jawaban mapel sebelumnya
          doubtfulAnswers: [],    // Bersihkan daftar ragu-ragu
        }));
        setCurrentIndex(0);       // Kembalikan nomor urut soal ke 1
        setIsFinishing(false);
        setShowConfirmModal(false);
        toast.success("Mata pelajaran selesai! Memasuki waktu jeda istirahat.", { duration: 4000 });
      } else {
        // [MULTI-MAPEL] Seluruh mapel telah selesai
        clearExam();
        toast.success("Seluruh mata pelajaran berhasil diselesaikan! Terima kasih.");
        router.replace("/student-exam");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mengakhiri ujian. Pastikan koneksi internet stabil.");
      setIsFinishing(false);
      setShowConfirmModal(false);
    }
  }, [examData, syncAnswers, clearExam, router]);

  // 5. DETEKSI WAKTU JEDA HABIS & TARIK SOAL BARU SECARA OTOMATIS
  useEffect(() => {
    if (examData?.status === "WAITING" && restTimeRemaining === 0 && isMounted && !isFinishing) {
      const fetchNextSubject = async () => {
        try {
          // Menarik token dari local storage (Pastikan Anda menyimpannya saat siswa pertama kali login ujian)
          const token = localStorage.getItem("active_exam_token");
          if (token) {
            await startExam(token);
            toast.success("Mata pelajaran selanjutnya telah dimulai!", { duration: 5000, icon: "🚀" });
          } else {
            toast.error("Sesi tidak valid. Silakan masuk kembali dari Dasbor.");
            clearExam();
            router.replace("/student-exam");
          }
        } catch (err: any) {
          toast.error(err.message || "Gagal memuat mata pelajaran selanjutnya. Memeriksa ulang...");
        }
      };
      fetchNextSubject();
    }
  }, [examData?.status, restTimeRemaining, isMounted, startExam, clearExam, router, isFinishing]);

  // 6. KEAMANAN SEB & ANTI-CHEAT DINAMIS
  const { isSafeBrowser } = useExamSecurity({
    isActive: !!examData?.is_seb_required,
    onViolation: async () => {
      addViolation();
      const action = await sendHeartbeat();
      if (action === "BLOCK") setIsBlocked(true);
      if (action === "FORCE_SUBMIT") handleConfirmFinish();
    },
  });

  // 7. HEARTBEAT LOOP (Dihentikan sementara saat Jeda)
  useEffect(() => {
    if (!examData || isFinishing || examData.status === "WAITING") return;
    const interval = setInterval(async () => {
      const action = await sendHeartbeat();
      if (action === "BLOCK") setIsBlocked(true);
      else if (action === "FORCE_SUBMIT") handleConfirmFinish();
      else setIsBlocked(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [examData, sendHeartbeat, handleConfirmFinish, isFinishing]);

  // 8. AUTO-SYNC BACKGROUND (Dihentikan sementara saat Jeda)
  useEffect(() => {
    if (!examData || !isOnline || isFinishing || examData.status === "WAITING") return;
    const syncInterval = setInterval(() => {
      syncAnswers();
    }, 60000);
    return () => clearInterval(syncInterval);
  }, [examData, isOnline, syncAnswers, isFinishing]);

  // 9. DATA HELPERS
  const questions = useMemo(() => examData?.questions || [], [examData]);
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === totalQuestions;

  // 10. EVENT HANDLERS
  const handleAnswer = (questionId: string, answer: string) => setAnswer(questionId, answer);
  const handleToggleDoubt = (questionId: string) => toggleDoubtful(questionId);
  const handleTimeUp = async () => {
    toast.error("Waktu pengerjaan habis! Jawaban Anda sedang dikirim ke peladen...", { duration: 5000 });
    await handleConfirmFinish();
  };
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) setCurrentIndex(index);
  };

  return {
    isMounted,
    isBlocked,
    showConfirmModal,
    isFinishing,
    currentIndex,
    isSafeBrowser,
    isOnline,
    user,
    examData,
    questions,
    currentQuestion,
    totalQuestions,
    answers,
    doubtfulAnswers,
    answeredCount,
    isAllAnswered,
    setShowConfirmModal,
    navigateToQuestion,
    handleAnswer,
    handleToggleDoubt,
    handleTimeUp,
    handleConfirmFinish,
  };
}