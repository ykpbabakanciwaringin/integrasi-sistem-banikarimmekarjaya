import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap, Eye, EyeOff, Info } from "lucide-react";

export function TabConfig({ formData, handleChange, isLoading }: any) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Konfigurasi Header Kop */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Pengaturan Header Kop Surat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Header Baris 1 (Opsional)</Label>
            <Input value={formData?.header1 || ""} onChange={(e) => handleChange("header1", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: TERAKREDITASI B" disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Header Baris 2 (Opsional)</Label>
            <Input value={formData?.header2 || ""} onChange={(e) => handleChange("header2", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: NPSN : 12345678" disabled={isLoading} />
          </div>
        </div>
      </div>

      {/* Konfigurasi Integrasi Pihak Ketiga */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-amber-600 flex items-center gap-2">
            <Zap className="h-4 w-4 fill-amber-500" /> Integrasi Pihak Ketiga (PesantrenQu)
          </h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="pq-toggle" className="text-[10px] font-bold text-slate-400 uppercase">Status Aktif</Label>
            <Switch 
              id="pq-toggle"
              checked={formData?.is_pq_integration_enabled || false}
              onCheckedChange={(checked) => handleChange("is_pq_integration_enabled", checked)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={`space-y-3 transition-all duration-300 ${formData?.is_pq_integration_enabled ? "opacity-100" : "opacity-40 pointer-events-none grayscale"}`}>
          <div className="space-y-1.5 relative">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Partner Key (API Key)</Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={formData?.pq_partner_key || ""}
                onChange={(e) => handleChange("pq_partner_key", e.target.value)}
                className="h-10 border-slate-200 focus-visible:ring-amber-500 pr-10 font-mono text-sm shadow-sm"
                placeholder="Masukkan Partner Key unik lembaga anda..."
                disabled={isLoading || !formData?.is_pq_integration_enabled}
              />
              <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
            <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 leading-tight">
              Jika Partner Key dikosongkan, sistem akan otomatis menggunakan kunci global yang terdaftar di konfigurasi utama (environment).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}