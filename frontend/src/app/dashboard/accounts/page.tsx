"use client";

// UI Wrappers & Modals
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

// Custom Components
import { AccountFormDialog } from "@/components/pages/accounts/form/account-form-dialog";
import { AccountDetailDialog } from "@/components/pages/accounts/account-detail-dialog";
import { AccountHeader } from "@/components/pages/accounts/account-header";
import { AccountFilters } from "@/components/pages/accounts/account-filters";
import { AccountTable } from "@/components/pages/accounts/account-table";

// Custom Controller
import { useAccountController } from "@/components/pages/accounts/useAccountController";

export default function AccountsPage() {
  const {
    isMounted, currentUser, state, modals, data, mutations, handlers
  } = useAccountController();

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      <AccountHeader 
        currentUserRole={currentUser?.role} 
        onOpenCreate={handlers.handleOpenCreate} 
      />

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
        <AccountFilters 
          filter={state.filter} 
          setFilter={state.setFilter} 
          searchInput={state.searchInput} 
          setSearchInput={state.setSearchInput} 
          institutionsData={data.institutions} 
          pendingCount={data.pendingCount} 
        />
        <CardContent className="p-0">
          <AccountTable 
            accounts={data.accounts} 
            isLoading={data.isAccountsLoading || data.isFetching} 
            meta={data.meta}
            onPageChange={(newPage) => state.setFilter({ ...state.filter, page: newPage })}
            onLimitChange={(newLimit) => state.setFilter({ ...state.filter, limit: newLimit, page: 1 })}
            onActivate={(id) => mutations.activateMutation.mutate(id)} 
            activatingId={state.activatingId}
            onOpenDetail={handlers.handleOpenDetail} 
            onOpenEdit={handlers.handleOpenEdit} 
            onDelete={(id) => modals.setDeleteId(id)}
          />
        </CardContent>
      </Card>

      <AccountFormDialog
        open={modals.isFormOpen} 
        onOpenChange={modals.setIsFormOpen} 
        isEditMode={modals.isEditMode}
        initialData={modals.selectedAccount ? {
          username: modals.selectedAccount.username, 
          role: modals.selectedAccount.role, 
          full_name: modals.selectedAccount.profile?.full_name || "",
          is_active: modals.selectedAccount.is_active, 
          image: modals.selectedAccount.profile?.image, 
          institution_id: modals.selectedAccount.enrollments?.[0]?.institution_id || "GLOBAL",
          nik: modals.selectedAccount.profile?.nik || "", 
          nip: modals.selectedAccount.profile?.nip || "", 
          nisn: modals.selectedAccount.profile?.nisn || "",
          email: modals.selectedAccount.profile?.email || "", 
          phone_number: modals.selectedAccount.profile?.phone_number || "",
        } : { role: "USER", is_active: false }}
        activeAccountDetail={modals.selectedAccount} 
        onSubmit={(payload) => mutations.saveMutation.mutate(payload)}
        isLoading={mutations.saveMutation.isPending} 
        institutions={data.institutions} 
        isSuperAdmin={currentUser?.role === "SUPER_ADMIN"}
        onAddEnrollment={(instId, role, position) => mutations.addEnrollmentMutation.mutate({ instId, role, position })}
        onDeleteEnrollment={(enrollId) => mutations.deleteEnrollmentMutation.mutate(enrollId)}
        isEnrollmentLoading={mutations.addEnrollmentMutation.isPending || mutations.deleteEnrollmentMutation.isPending}
      />

      <AccountDetailDialog 
        open={modals.isDetailOpen} 
        onOpenChange={modals.setIsDetailOpen} 
        account={modals.selectedAccount}
        onActivate={(id) => { mutations.activateMutation.mutate(id); modals.setIsDetailOpen(false); }} 
        isActivating={state.activatingId === modals.selectedAccount?.id}
      />

      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini bersifat permanen dan tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 shadow-md text-white font-semibold" onClick={() => modals.deleteId && mutations.deleteMutation.mutate(modals.deleteId)}>
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}