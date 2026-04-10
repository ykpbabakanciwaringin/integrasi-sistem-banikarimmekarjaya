// LOKASI: src/components/pages/manage-exams/[eventId]/monitor/monitoring-action-dialog.tsx
"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitoringActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  actionText: string;
  actionClass?: string;
  onConfirm: () => void;
  isLoading: boolean;
}

export function MonitoringActionDialog({
  open, 
  onOpenChange, 
  title, 
  description, 
  icon, 
  actionText, 
  actionClass = "bg-rose-600 hover:bg-rose-700", 
  onConfirm, 
  isLoading 
}: MonitoringActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[450px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        
        {/* HEADER: Identik dengan Student Form Dialog */}
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6 text-emerald-400" }) 
                : icon}
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {title}
              </DialogTitle>
              <div className="flex items-center gap-1 text-emerald-100/80 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                <AlertCircle className="w-3 h-3" /> Konfirmasi Tindakan
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {/* ISI DESKRIPSI */}
        <div className="p-6">
          <DialogDescription className="text-sm text-slate-600 leading-relaxed font-medium">
            {description}
          </DialogDescription>
        </div>

        {/* FOOTER: Tombol Aksi */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex flex-row items-center justify-between sm:justify-between rounded-b-xl shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading} 
            className="text-slate-500 hover:text-slate-800 hover:bg-white h-10 px-4 font-semibold"
          >
            Batal
          </Button>
          
          <Button 
            className={cn(
              "font-bold text-white shadow-md active:scale-95 transition-all h-10 px-6",
              actionClass,
              isLoading && "opacity-80 cursor-not-allowed"
            )} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...</>
            ) : (
              actionText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}