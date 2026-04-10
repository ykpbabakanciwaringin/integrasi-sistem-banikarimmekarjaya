// LOKASI: src/app/(auth)/login/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/pages/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-teal-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 text-sm animate-pulse">
              Menyiapkan halaman login...
            </p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}