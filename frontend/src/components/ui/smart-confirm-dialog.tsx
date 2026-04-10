// LOKASI: src/components/ui/smart-confirm-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export interface SmartConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
  confirmText?: string;
}

export function SmartConfirmDialog({ open, onOpenChange, title, description, onConfirm, isLoading, isDanger = true, confirmText = "Lanjutkan" }: SmartConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <VisuallyHidden.Root><DialogTitle>Konfirmasi</DialogTitle></VisuallyHidden.Root>
        <DialogHeader className="flex flex-col items-center text-center sm:text-center mt-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-rose-100' : 'bg-indigo-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDanger ? 'text-rose-600' : 'text-indigo-600'}`} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">{title}</DialogTitle>
          <DialogDescription className="text-slate-500 mt-2 text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-center mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="min-w-[100px]">
            Batal
          </Button>
          <Button 
            className={`min-w-[100px] ${isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}