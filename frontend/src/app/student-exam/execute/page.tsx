// LOKASI: src/app/student-exam/execute/page.tsx
"use client";

import { useState } from "react";
import { useExamExecution } from "@/components/student-exam/execute/use-exam-execution";
import { AnimatePresence } from "framer-motion";

// --- IMPORT KOMPONEN UI ---
import { ExamHeader } from "@/components/student-exam/execute/exam-header";
import { QuestionRenderer } from "@/components/student-exam/execute/question-renderer";
import { QuestionNavigator } from "@/components/student-exam/execute/question-navigator";
import { EmergencyBlocker } from "@/components/student-exam/execute/emergency-blocker";
import { SEBBlocker } from "@/components/student-exam/execute/seb-blocker";
import { CameraProctor } from "@/components/student-exam/execute/camera-proctor"; 
// [PEMBARUAN FASE 6]: Mengimpor Layar Jeda Istirahat
import { RestBlocker } from "@/components/student-exam/execute/rest-blocker"; 

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Send, CheckCircle2, LayoutGrid } from "lucide-react";

export default function ExamExecutionPage() {
  const {
    isMounted, isBlocked, showConfirmModal, isFinishing, currentIndex,
    isSafeBrowser, isOnline, user, examData, questions, currentQuestion,
    totalQuestions, answers, doubtfulAnswers, answeredCount, isAllAnswered,
    setShowConfirmModal, navigateToQuestion, handleAnswer, handleTimeUp, handleConfirmFinish,
  } = useExamExecution();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (!isMounted || !examData || !user) return null;
  if (examData.is_seb_required && !isSafeBrowser) return <SEBBlocker />;
  if (isBlocked) return <EmergencyBlocker />;
  
  // [PEMBARUAN FASE 6]: Memicu Layar Jeda jika peladen menginstruksikan status WAITING
  if (examData.status === "WAITING") return <RestBlocker />;

  return (
    // Latar Belakang UI Premium (Tidak Monoton Putih)
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans selection:bg-emerald-500/30 relative">
      
      {/* Visual Blob Latar Belakang agar Glassmorphism Menonjol */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-300/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-[120px] pointer-events-none"></div>

      <ExamHeader
        title={examData.title}
        studentName={user.profile?.full_name || user.username}
        onTimeUp={handleTimeUp}
      />

      <div className="flex flex-1 overflow-hidden relative max-w-[1400px] w-full mx-auto px-4 md:px-8 pb-4 z-10">
        
        {/* AREA SOAL (Kiri) */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar pb-24 lg:pb-0 pr-0 lg:pr-6">
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <QuestionRenderer
                key={currentQuestion.id}
                question={currentQuestion}
                currentAnswer={answers[currentQuestion.id] || ""}
                onAnswerChange={(ans) => handleAnswer(currentQuestion.id, ans)}
                isSaving={false} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="font-bold tracking-widest uppercase text-xs">Menyiapkan Soal...</p>
              </div>
            )}
          </AnimatePresence>

          {/* TOMBOL NAVIGASI BAWAH */}
          <div className="mt-6 pt-6 mb-10 border-t border-slate-200/60 flex items-center justify-between gap-3 md:gap-4 relative z-10">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigateToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="h-14 rounded-2xl bg-white/80 backdrop-blur-sm border-slate-200 text-slate-600 hover:bg-slate-100 font-bold tracking-widest uppercase text-xs md:text-sm px-4 md:px-8 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 mr-1 md:mr-2" /> <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden h-14 rounded-2xl bg-white/80 border border-slate-200 backdrop-blur-sm hover:bg-slate-50 text-slate-700 font-bold tracking-widest uppercase text-xs px-4 shadow-sm"
            >
              <LayoutGrid className="w-5 h-5 mr-2" /> Peta Soal
            </Button>

            {currentIndex === totalQuestions - 1 ? (
              <Button
                size="lg"
                onClick={() => setShowConfirmModal(true)}
                className="h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/20 font-black tracking-widest uppercase text-xs md:text-sm px-6 md:px-10 border-0"
              >
                Selesai <Send className="w-4 h-4 ml-2 md:ml-3" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigateToQuestion(currentIndex + 1)}
                className="h-14 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-900/20 font-bold tracking-widest uppercase text-xs md:text-sm px-4 md:px-8 border-0"
              >
                <span className="hidden sm:inline">Selanjutnya</span> <ChevronRight className="w-5 h-5 ml-1 md:ml-2" />
              </Button>
            )}
          </div>
        </main>

        {/* AREA NAVIGATOR GRID (Kanan) */}
        <aside className="w-[340px] h-full hidden lg:block z-10">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            doubtfulAnswers={doubtfulAnswers}
            currentIndex={currentIndex}
            onNavigate={navigateToQuestion}
            onFinishClick={() => setShowConfirmModal(true)}
          />
        </aside>
      </div>

      {/* PEMASANGAN CCTV */}
      <CameraProctor />

      {/* MODAL NAVIGASI SOAL UNTUK MOBILE */}
      <Dialog open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">Navigasi Peta Soal Mobile</DialogTitle> 
           <div className="h-[80vh] w-full">
            <QuestionNavigator
              questions={questions}
              answers={answers}
              doubtfulAnswers={doubtfulAnswers}
              currentIndex={currentIndex}
              onNavigate={(idx) => {
                navigateToQuestion(idx);
                setIsMobileNavOpen(false); 
              }}
              onFinishClick={() => {
                setIsMobileNavOpen(false);
                setShowConfirmModal(true);
              }}
            />
           </div>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI PENGUMPULAN JAWABAN */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 border border-slate-100 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
          <DialogTitle className="sr-only">Konfirmasi Pengumpulan Jawaban</DialogTitle>
          
          <div className="bg-emerald-50 p-8 text-center relative overflow-hidden border-b border-emerald-100">
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm relative z-10 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 tracking-tight relative z-10">
              {/* [PEMBARUAN FASE 6]: Perubahan teks agar relevan dengan Multi-Mapel */}
              Kumpulkan Jawaban?
            </h2>
          </div>
          
          <div className="p-8 pb-6 text-center">
            {!isAllAnswered ? (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col items-center gap-2 w-full mb-6 shadow-inner">
                <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
                <p className="text-sm font-bold text-rose-800 leading-relaxed text-center">
                  Masih ada <span className="font-black text-rose-600 text-lg px-1">{totalQuestions - answeredCount}</span> soal yang belum diisi.
                </p>
                <span className="text-[10px] uppercase tracking-widest text-rose-600/80 font-bold">Sebaiknya periksa kembali</span>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center gap-2 w-full mb-6 shadow-inner">
                 <p className="text-sm font-bold text-emerald-800 text-center">
                   Hebat! Seluruh <span className="font-black text-emerald-600 text-lg px-1">{totalQuestions}</span> soal telah terjawab.
                 </p>
              </div>
            )}
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Pastikan Anda sudah yakin. Jawaban yang dikirim <b className="text-slate-700">tidak dapat diubah kembali</b>. 
            </p>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isFinishing}
              className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs hover:bg-slate-50 hover:text-slate-900"
            >
              Cek Lagi
            </Button>
            <Button
              onClick={handleConfirmFinish}
              disabled={isFinishing || (!isOnline && answeredCount > 0)}
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-black uppercase tracking-widest text-xs border-0"
            >
              {isFinishing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Mengirim...</>
              ) : (
                "Kumpulkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}