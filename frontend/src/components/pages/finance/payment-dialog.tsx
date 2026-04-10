// LOKASI: src/components/pages/finance/payment-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet } from "lucide-react";
import { FinanceBilling } from "@/types/finance";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billing: FinanceBilling | null;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}

export function PaymentDialog({ open, onOpenChange, billing, onSubmit, isSubmitting }: PaymentDialogProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [channel, setChannel] = useState("cashless");
  const [paymentType, setPaymentType] = useState("Bayar Sekaligus");
  const [notes, setNotes] = useState("");

  // Reset form saat modal terbuka
  useEffect(() => {
    if (open && billing) {
      setAmount(billing.remaining_amount);
      setChannel("cashless");
      setPaymentType("Bayar Sekaligus");
      setNotes("");
    }
  }, [open, billing]);

  if (!billing) return null;

  const handleProcess = () => {
    if (!amount || Number(amount) <= 0) return;
    onSubmit({
      billing_id: billing.id,
      paid_amount: Number(amount),
      channel,
      payment_type: paymentType,
      notes,
    });
  };

  const formatRupiah = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Wallet className="h-5 w-5" /></div>
            <div>
              <DialogTitle className="text-lg text-slate-800">Proses Pembayaran</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">Siswa: <span className="font-bold text-slate-700">{billing.student?.full_name}</span></DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center">
            <span className="text-sm font-semibold text-rose-700">Sisa Tunggakan:</span>
            <span className="text-lg font-black text-rose-700">{formatRupiah(billing.remaining_amount)}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase">Nominal Bayar (Rp) *</Label>
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))} 
              className="h-10 border-slate-200 text-lg font-bold text-slate-700"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Metode *</Label>
              <Select value={channel} onValueChange={setChannel} disabled={isSubmitting}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashless">Cashless / Transfer</SelectItem>
                  <SelectItem value="cash">Tunai (Cash)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Tipe Bayar *</Label>
              <Select value={paymentType} onValueChange={setPaymentType} disabled={isSubmitting}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bayar Sekaligus">Sekaligus</SelectItem>
                  <SelectItem value="Cicilan">Cicilan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button onClick={handleProcess} disabled={isSubmitting || !amount || amount <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...</> : "Konfirmasi Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}