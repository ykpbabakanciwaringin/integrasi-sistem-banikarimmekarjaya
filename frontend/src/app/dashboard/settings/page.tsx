"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/stores/use-settings-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  BellRing,
  MonitorSmartphone,
  ShieldAlert,
  Info,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const settings = useSettingsStore();

  // Menghindari Hydration Error di Next.js
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSave = () => {
    toast.success("Pengaturan preferensi berhasil disimpan!");
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 p-1 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Settings2 className="h-6 w-6 text-emerald-600" /> Pengaturan Sistem
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sesuaikan preferensi antarmuka dan notifikasi aplikasi Anda.
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 h-10 px-5 rounded-lg"
        >
          <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* KOLOM KIRI (8 Kolom) */}
        <div className="md:col-span-8 space-y-6">
          {/* Notifikasi */}
          <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <BellRing className="w-5 h-5 text-indigo-500" /> Preferensi
                Notifikasi
              </CardTitle>
              <CardDescription>
                Pilih pemberitahuan sistem apa saja yang ingin Anda terima.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <Label className="text-sm font-bold text-slate-700">
                    Notifikasi Ujian Aktif
                  </Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Terima pemberitahuan visual saat ada sesi ujian baru yang
                    dimulai atau dihentikan.
                  </p>
                </div>
                <Switch
                  checked={settings.examNotification}
                  onCheckedChange={() =>
                    settings.toggleSetting("examNotification")
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <div className="h-px bg-slate-100 w-full" />
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <Label className="text-sm font-bold text-slate-700">
                    Notifikasi Pendaftar Baru (Admin)
                  </Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Berikan tanda lencana merah pada menu jika ada akun baru
                    yang menunggu verifikasi.
                  </p>
                </div>
                <Switch
                  checked={settings.newAccountNotification}
                  onCheckedChange={() =>
                    settings.toggleSetting("newAccountNotification")
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tampilan (KIOSK MODE) */}
          <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <MonitorSmartphone className="w-5 h-5 text-blue-500" /> Tampilan
                Antarmuka
              </CardTitle>
              <CardDescription>
                Atur gaya visual dan perilaku aplikasi di perangkat Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <Label className="text-sm font-bold text-slate-700">
                    Mode Layar Penuh (Kiosk Mode)
                  </Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Otomatis menyembunyikan navigasi samping (sidebar) dan
                    header atas untuk memberikan ruang luas saat ujian.
                  </p>
                </div>
                <Switch
                  checked={settings.kioskMode}
                  onCheckedChange={() => settings.toggleSetting("kioskMode")}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Keamanan (AUTO LOGOUT) */}
          <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Keamanan Sesi
                Perangkat
              </CardTitle>
              <CardDescription>
                Opsi terkait login dan durasi sesi aktif di perangkat ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <Label className="text-sm font-bold text-slate-700">
                    Logout Otomatis (Idle)
                  </Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Otomatis mengeluarkan akun Anda dari aplikasi jika tidak
                    terdeteksi adanya aktivitas kursor selama 2 jam.
                  </p>
                </div>
                <Switch
                  checked={settings.autoLogout}
                  onCheckedChange={() => settings.toggleSetting("autoLogout")}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm rounded-xl overflow-hidden">
            <div className="p-5 flex gap-4">
              <Info className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-800 text-sm">
                  Informasi Pengaturan
                </h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed">
                  Pengaturan yang Anda lakukan di halaman ini hanya akan berlaku
                  pada <b>perangkat (browser)</b> yang sedang Anda gunakan saat
                  ini.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
