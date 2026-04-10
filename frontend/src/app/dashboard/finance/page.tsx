// LOKASI: src/app/dashboard/finance/page.tsx
"use client";

import { useFinanceController } from "@/components/pages/finance/useFinanceController";
import { FinanceHeader } from "@/components/pages/finance/finance-header";
import { FinanceSummaryCards } from "@/components/pages/finance/finance-summary-cards";
import { FinanceFilters } from "@/components/pages/finance/finance-filters";
import { FinanceTable } from "@/components/pages/finance/finance-table";
import { FinanceTableMatrix } from "@/components/pages/finance/finance-table-matrix";
import { PaymentDialog } from "@/components/pages/finance/payment-dialog";
import { FinanceImportTab } from "@/components/pages/finance/finance-import-tab"; 
import { RukhsohDialog } from "@/components/pages/finance/rukhsoh-dialog";
import { financeService } from "@/services/finance.service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinancePage() {
  const controller = useFinanceController();

  if (!controller.isMounted) return null;

  const { state, modals, data, mutations } = controller;

  const handleExportExcel = async () => {
    toast.info("Sedang menyiapkan file Excel...");
    try {
      await financeService.exportExcel({
        search: state.search,
        status: state.filterStatus !== "ALL" ? state.filterStatus : undefined,
        category_id: state.filterCategoryId !== "ALL" ? state.filterCategoryId : undefined,
        category_type: state.filterCategoryType !== "ALL" ? state.filterCategoryType : undefined,
        pondok: state.filterPondok !== "ALL" ? state.filterPondok : undefined,
        sekolah: state.filterSekolah !== "ALL" ? state.filterSekolah : undefined,
        program: state.filterProgram !== "ALL" ? state.filterProgram : undefined,
      });
      toast.success("File Excel Buku Besar berhasil diunduh.");
    } catch {
      toast.error("Gagal mengunduh file Excel.");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <FinanceHeader 
        onImportClick={() => state.setActiveTab("import")} 
        onExportExcelClick={handleExportExcel}
        onRukhsohClick={() => modals.setIsRukhsohOpen(true)}
      />

      <FinanceSummaryCards 
        totalBilled={data.summary?.total_billed || 0}
        totalPaid={data.summary?.total_paid || 0}
        totalUnpaid={data.summary?.total_unpaid || 0}
        isLoading={data.isSummaryLoading}
      />

      <FinanceFilters 
        search={state.search}
        onSearchChange={state.setSearch}
        filterStatus={state.filterStatus}
        onFilterStatusChange={state.setFilterStatus}
        
        filterCategoryId={state.filterCategoryId}
        onFilterCategoryIdChange={state.setFilterCategoryId}
        filterCategoryType={state.filterCategoryType}
        onFilterCategoryTypeChange={state.setFilterCategoryType}
        
        filterPondok={state.filterPondok}
        onFilterPondokChange={state.setFilterPondok}
        filterSekolah={state.filterSekolah}
        onFilterSekolahChange={state.setFilterSekolah}
        filterProgram={state.filterProgram} 
        onFilterProgramChange={state.setFilterProgram} 
        
        categories={data.categories} 
        options={data.filterOptions}
      />

      <Tabs value={state.activeTab} onValueChange={(v) => state.setActiveTab(v as "tagihan" | "buku-besar" | "import")} className="w-full">
        <TabsList className="bg-slate-100/50 border border-slate-200 p-1 mb-4 flex flex-wrap h-auto print:hidden">
          <TabsTrigger value="tagihan" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium">
            Daftar Tagihan
          </TabsTrigger>
          <TabsTrigger value="buku-besar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium">
            Rekapitulasi Pembayaran
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium">
            Sistem Import & Validasi Kategori
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tagihan" className="mt-0 outline-none space-y-4">
          <FinanceTable 
            billings={data.billings}
            isLoading={data.isLoading}
            page={state.page}
            limit={state.limit}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            onPageChange={state.setPage}
            onLimitChange={state.setLimit}
            onPaymentClick={(billing) => {
              modals.setSelectedBilling(billing);
              modals.setIsPaymentOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="buku-besar" className="mt-0 outline-none">
          <FinanceTableMatrix 
            billings={data.billings} 
            isLoading={data.isLoading}
            onExportExcelClick={handleExportExcel} 
            onPrintPDFClick={handlePrintPDF}
            onRukhsohClick={() => modals.setIsRukhsohOpen(true)} 
          />
        </TabsContent>

        <TabsContent value="import" className="mt-0 outline-none">
          <FinanceImportTab 
            filterOptions={data.filterOptions}
            onSuccess={() => {
              mutations.paymentMutation.reset(); 
              window.location.reload(); 
            }} 
          />
        </TabsContent>
      </Tabs>

      <PaymentDialog 
        open={modals.isPaymentOpen}
        onOpenChange={modals.setIsPaymentOpen}
        billing={modals.selectedBilling}
        onSubmit={(payload) => mutations.paymentMutation.mutate(payload)}
        isSubmitting={mutations.paymentMutation.isPending}
      />

      <RukhsohDialog 
        open={modals.isRukhsohOpen}
        onOpenChange={modals.setIsRukhsohOpen}
      />
    </div>
  );
}