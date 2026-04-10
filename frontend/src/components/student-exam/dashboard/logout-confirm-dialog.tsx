"use client";

import React from "react";
import {
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutConfirmDialog({ open, onOpenChange, onConfirm, isLoading }: LogoutConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-[2.5rem] text-center p-8 border border-emerald-500/20 shadow-2xl shadow-emerald-950/50 bg-emerald-950/95 backdrop-blur-xl [&>button]:hidden">
        
        <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-4 border border-rose-500/20 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-300">
          <LogOut className="h-8 w-8 text-rose-400" />
        </div>
        
        <DialogTitle className="text-xl font-black text-white tracking-tight">
          Keluar Aplikasi?
        </DialogTitle>
        <DialogDescription className="text-sm mt-3 text-emerald-100/70 leading-relaxed px-1 font-medium">
          Apakah Anda yakin ingin keluar dari aplikasi ujian ini? Pastikan Anda <b className="text-rose-400">tidak sedang</b> mengerjakan sesi ujian yang aktif.
        </DialogDescription>
        
        <DialogFooter className="mt-8 flex gap-3 sm:justify-center flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
            className="flex-1 rounded-xl font-bold h-11 border-emerald-700/50 text-emerald-100 hover:bg-emerald-800/50 hover:text-white bg-transparent transition-colors uppercase tracking-wider text-xs"
          >
            Batal
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 rounded-xl font-bold h-11 bg-rose-600 hover:bg-rose-700 text-white border-0 transition-colors shadow-lg shadow-rose-900/20 uppercase tracking-wider text-xs"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Ya, Keluar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}