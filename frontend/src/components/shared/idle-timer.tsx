"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { toast } from "sonner";

export function IdleTimer() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const autoLogoutEnabled = useSettingsStore((state) => state.autoLogout);

  useEffect(() => {
    if (!autoLogoutEnabled) return;

    let timeoutId: NodeJS.Timeout;

    // Fungsi untuk mereset timer setiap kali ada pergerakan
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Atur timer 2 Jam (2 jam * 60 menit * 60 detik * 1000 milidetik = 7200000)
      timeoutId = setTimeout(() => {
        logout();
        toast.error(
          "Sesi telah berakhir karena tidak ada aktivitas selama 2 jam.",
        );
        router.push("/login");
      }, 7200000);
    };

    // Mulai dengarkan aktivitas pengguna
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Mulai timer pertama kali
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [autoLogoutEnabled, logout, router]);

  return null; // Komponen ini tidak merender apa-apa (invisible)
}
