"use client";

import { useEffect, useRef, useState } from "react";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import { Camera, CameraOff } from "lucide-react";

export function CameraProctor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const triggerCount = useStudentExamStore((s) => s.triggerCaptureCount);
  const saveSnapshot = useStudentExamStore((s) => s.saveSnapshot);

  // Minta Izin & Nyalakan Kamera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      })
      .catch((err) => {
        console.warn("Kamera diblokir atau tidak ada:", err);
        setHasPermission(false);
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Mesin Jepret Otomatis saat Pelanggaran Terjadi
  useEffect(() => {
    if (triggerCount > 0 && videoRef.current && hasPermission) {
      const canvas = document.createElement("canvas");
      canvas.width = 320; // Resolusi hemat kuota
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL("image/jpeg", 0.4); // Kompresi 40%
        saveSnapshot(base64Data);
      }
    }
  }, [triggerCount, hasPermission, saveSnapshot]);

  return (
    <div className="fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-emerald-900/50 bg-slate-900 transition-all duration-500 w-24 h-32 hover:w-36 hover:h-48 group">
      {hasPermission ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div className="absolute top-2 right-2 bg-rose-500 rounded-full w-2.5 h-2.5 animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]" title="CCTV Aktif"></div>
          <div className="absolute bottom-2 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">PROCTORING AKTIF</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-800">
          <CameraOff className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}