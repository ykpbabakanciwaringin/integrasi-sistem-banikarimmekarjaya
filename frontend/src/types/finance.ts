// LOKASI: src/types/finance.ts

import { PaginationParams } from "./common";
import { User } from "./user";

export interface FinanceCategory {
  id: string;
  institution_id: string;
  name: string;
  category_type: string;
  alias?: string;       
  target_unit?: string; 
  description: string;
}

export interface FinanceBilling {
  id: string;
  institution_id: string;
  student_id: string;
  category_id: string;
  period_name: string;
  billed_amount: number;
  remaining_amount: number;
  due_date: string | null;
  status: "paid" | "unpaid" | "partial";
  notes: string;
  
  student?: {
    id: string;
    username: string;
    profile?: {
      full_name: string;
      pondok?: string;
      asrama?: string;
      sekolah?: string;
      program?: string; 
    }
  };
  category?: FinanceCategory;
  payments?: FinancePayment[];
  created_at: string;
}

export interface FinancePayment {
  id: string;
  billing_id: string;
  paid_amount: number;
  payment_date: string;
  channel: string;
  payment_type: string;
  receipt_number: string;
  processed_by_id: string;
}

export interface FinanceBillingFilter extends PaginationParams {
  institution_id?: string;
  search?: string;
  category_id?: string;
  status?: string;
  pondok?: string;
  asrama?: string;
  category_type?: string; 
  sekolah?: string;       
  program?: string;       
}

export interface ProcessPaymentInput {
  billing_id: string;
  paid_amount: number;
  channel: string;
  payment_type: string;
  notes?: string;
}

export interface CreateRukhsohInput {
  student_id: string;
  promised_date: string;
  reason: string;
  total_debt: number;
}

export interface FinanceSummary {
  total_billed: number;
  total_paid: number;
  total_unpaid: number;
}