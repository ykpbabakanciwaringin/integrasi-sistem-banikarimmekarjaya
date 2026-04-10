// LOKASI: src/stores/use-student-exam-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StudentExamService } from "@/services/student-exam.service";
import { StudentExamBundle } from "@/types/student-exam";
import { dbProvider, OfflineAnswer } from "@/lib/db";
import toast from "react-hot-toast";

interface StudentExamState {
  examData: StudentExamBundle | null;
  answers: Record<string, string>;
  doubtfulAnswers: string[];
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  violationCount: number;
  timeRemaining: number;
  heartbeatFailCount: number; // [HARDENING] Melacak kegagalan heartbeat berturut-turut

  // [PEMBARUAN FASE 6]: State khusus untuk masa jeda istirahat antar mata pelajaran
  restTimeRemaining: number; 

  // STATE UNTUK KAMERA CCTV & SENSOR
  triggerCaptureCount: number;
  pendingSnapshot: string | null;
  pendingViolationType: string | null;

  // Tindakan (Actions)
  initializeConnection: () => void;
  startExam: (token: string) => Promise<void>;
  setAnswer: (questionId: string, answer: string) => Promise<void>;
  toggleDoubtful: (questionId: string) => void;
  syncAnswers: () => Promise<void>;
  processPendingFinish: () => Promise<void>;
  addViolation: () => void;
  
  // ACTIONS KAMERA
  takeSnapshot: (type: string) => void;
  saveSnapshot: (base64: string) => void;

  sendHeartbeat: () => Promise<"CONTINUE" | "BLOCK" | "FORCE_SUBMIT">;
  clearExam: () => void;
  
  // Pengendali Waktu
  decrementTime: () => void;
  // [PEMBARUAN FASE 6]: Fungsi untuk mengurangi waktu jeda
  decrementRestTime: () => void; 
}

export const useStudentExamStore = create<StudentExamState>()(
  persist(
    (set, get) => ({
      examData: null,
      answers: {},
      doubtfulAnswers: [],
      isSyncing: false,
      isOnline: typeof window !== "undefined" ? navigator.onLine : true,
      lastSyncedAt: null,
      violationCount: 0,
      timeRemaining: 0,
      restTimeRemaining: 0, // Inisialisasi awal waktu jeda
      heartbeatFailCount: 0,

      // Inisialisasi State Kamera
      triggerCaptureCount: 0,
      pendingSnapshot: null,
      pendingViolationType: null,

      /**
       * 1. Inisialisasi Koneksi & Auto-Sync
       */
      initializeConnection: () => {
        if (typeof window === "undefined") return;

        const updateStatus = async () => {
          const online = navigator.onLine;
          set({ isOnline: online });

          if (online) {
            toast.success("Koneksi pulih. Menyingkronkan data...", {
              id: "net-sync",
            });
            await get().syncAnswers();
            await get().processPendingFinish();
          } else {
            toast.error("Koneksi terputus. Mengaktifkan mode luring.", {
              id: "net-sync",
            });
          }
        };

        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);
      },

      /**
       * 2. Mulai Ujian (Hybrid: Daring & Luring)
       */
      startExam: async (token: string) => {
        try {
          const bundle = await StudentExamService.startExam(token);
          
          let initialTime = 0;
          let initialRestTime = 0;

          // [PEMBARUAN FASE 6]: Logika Penentuan Layar berdasarkan Status Peladen
          if (bundle.status === "WAITING") {
            // Jika siswa sedang dalam jeda antar mapel
            initialRestTime = bundle.time_remaining || 120; // Default 2 menit jika kosong
            initialTime = 0;
          } else {
            // Jika siswa harus mengerjakan soal normal
            initialTime = bundle.duration_min * 60;
            initialRestTime = 0;
          }

          set({
            examData: bundle,
            answers: bundle.last_answers || {},
            timeRemaining: initialTime,
            restTimeRemaining: initialRestTime,
            heartbeatFailCount: 0, // Reset fail count saat mulai baru
            triggerCaptureCount: 0,
            pendingSnapshot: null,
            pendingViolationType: null,
          });
        } catch (error) {
          const cached = await dbProvider.getExamBundle("CURRENT_SESSION");
          if (cached) {
            // [PEMBARUAN FASE 6]: Mencegah masuk ke mode luring jika sedang masa jeda
            if (cached.status === "WAITING") {
               throw new Error("Anda sedang dalam masa jeda. Harap pastikan internet terhubung untuk memuat mata pelajaran selanjutnya.");
            }
            set({ examData: cached, isOnline: false });
            toast("Berjalan dalam mode luring", { icon: "📴" });
          } else {
            throw error;
          }
        }
      },

      /**
       * 3. Simpan Jawaban (Double-Write: State + IndexedDB)
       */
      setAnswer: async (questionId: string, answer: string) => {
        const { isOnline, examData, answers, heartbeatFailCount } = get();

        // Perbarui state internal agar UI responsif
        set({ answers: { ...answers, [questionId]: answer } });

        // Simpan ke IndexedDB
        await dbProvider.saveAnswerLocal(questionId, answer, false);

        // Jika daring dan sistem tidak sedang beku (fail count < 3), kirim ke peladen
        if (isOnline && examData && heartbeatFailCount < 3) {
          get()
            .syncAnswers()
            .catch(() => console.warn("Sinkronisasi otomatis tertunda."));
        }
      },

      toggleDoubtful: (questionId: string) => {
        const { doubtfulAnswers } = get();
        const next = doubtfulAnswers.includes(questionId)
          ? doubtfulAnswers.filter((id) => id !== questionId)
          : [...doubtfulAnswers, questionId];
        set({ doubtfulAnswers: next });
      },

      /**
       * 4. Sinkronisasi Antrean Jawaban
       */
      syncAnswers: async () => {
        const { isOnline, examData, isSyncing } = get();
        // [PEMBARUAN FASE 6]: Hentikan sinkronisasi jika status sedang jeda (WAITING)
        if (!isOnline || !examData || isSyncing || examData.status === "WAITING") return;

        const unsynced: OfflineAnswer[] = await dbProvider.getUnsyncedAnswers();
        if (unsynced.length === 0) return;

        set({ isSyncing: true });
        try {
          await StudentExamService.syncAnswers({
            session_id: examData.session_id,
            answers: unsynced.map((item: OfflineAnswer) => ({
              question_id: item.questionId,
              answer: item.answer,
            })),
          });

          const ids = unsynced.map((a: OfflineAnswer) => a.questionId);
          await dbProvider.markAsSynced(ids);

          set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          set({ isSyncing: false });
        }
      },

      /**
       * 5. Proses Antrean Finalisasi
       */
      processPendingFinish: async () => {
        const { isOnline } = get();
        if (!isOnline) return;

        const pending = await dbProvider.getPendingFinish();
        for (const item of pending) {
          try {
            await StudentExamService.finishExam(item.session_id);
            await dbProvider.removePendingFinish(item.session_id);
            toast.success("Status akhir ujian berhasil dikirim ke peladen.");
          } catch (e) {
            console.error("Gagal mengirim status akhir:", e);
          }
        }
      },

      addViolation: () =>
        set((state) => ({ violationCount: state.violationCount + 1 })),

      // FUNGSI: Memicu komponen kamera dan menyimpan hasilnya
      takeSnapshot: (type) => 
        set((state) => ({ 
          triggerCaptureCount: state.triggerCaptureCount + 1, 
          pendingViolationType: type 
        })),
        
      saveSnapshot: (base64) => 
        set({ pendingSnapshot: base64 }),

      /**
       * 6. Heartbeat Watchdog + CCTV Sender [HARDENING]
       */
      sendHeartbeat: async () => {
        const { 
          examData, 
          violationCount, 
          isOnline, 
          heartbeatFailCount,
          pendingSnapshot,
          pendingViolationType
        } = get();
        
        if (!examData) return "CONTINUE";

        // Jika luring secara navigator, anggap gagal heartbeat tapi jangan banjiri error
        if (!isOnline) {
          set({ heartbeatFailCount: heartbeatFailCount + 1 });
          return "CONTINUE";
        }

        try {
          // Mengirim data normal ditambah data kamera rahasia
          const response = await StudentExamService.pingHeartbeat({
            session_id: examData.session_id,
            violation_count: violationCount,
            snapshot_base64: pendingSnapshot || undefined,
            violation_type: pendingViolationType || undefined,
          });

          // Sukses: Reset hitungan gagal, perbarui waktu, dan bersihkan memori kamera
          // [Catatan]: response.time_remaining dari backend dikelola langsung ke state normal
          set({
            timeRemaining: response.time_remaining,
            heartbeatFailCount: 0,
            pendingSnapshot: null, // Bersihkan agar tidak dikirim ulang
            pendingViolationType: null,
          });

          return response.action;
        } catch (error) {
          // Gagal: Tambah hitungan kegagalan, simpan foto untuk dicoba kirim lagi
          const newFailCount = heartbeatFailCount + 1;
          set({ heartbeatFailCount: newFailCount });

          if (newFailCount >= 3) {
            console.error("PENGAMAT SISTEM: Koneksi hilang total. Membekukan sistem.");
          }

          return "CONTINUE";
        }
      },

      clearExam: () => {
        dbProvider.clearCurrentExamData();
        set({
          examData: null,
          answers: {},
          doubtfulAnswers: [],
          lastSyncedAt: null,
          violationCount: 0,
          timeRemaining: 0,
          restTimeRemaining: 0, // Bersihkan waktu jeda
          heartbeatFailCount: 0,
          triggerCaptureCount: 0,
          pendingSnapshot: null,
          pendingViolationType: null,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("student-exam-storage");
        }
      },

      decrementTime: () =>
        set((state) => ({
          timeRemaining: Math.max(0, state.timeRemaining - 1),
        })),
        
      // [PEMBARUAN FASE 6]: Penurunan waktu jeda
      decrementRestTime: () =>
        set((state) => ({
          restTimeRemaining: Math.max(0, state.restTimeRemaining - 1),
        })),
    }),
    {
      name: "student-exam-storage",
      partialize: (state) => ({
        examData: state.examData,
        answers: state.answers,
        doubtfulAnswers: state.doubtfulAnswers,
        violationCount: state.violationCount,
      }),
    }
  )
);