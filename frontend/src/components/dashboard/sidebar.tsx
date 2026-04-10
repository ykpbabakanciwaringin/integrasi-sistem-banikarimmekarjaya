// LOKASI: src/components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/config/dashboard-nav";
import { LogoHeader } from "@/components/shared/logo-header";
import { useAuthStore } from "@/stores/use-auth-store";
import { ChevronRight } from "lucide-react";
import packageInfo from "../../../package.json";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const userRole = user?.role || "";
  
  // Membaca versi secara otomatis dari package.json
  const appVersion = packageInfo.version || "1.0.0";

  return (
    <div className="h-full flex flex-col bg-emerald-950 text-white shadow-2xl border-r border-white/5">
      <div className="h-20 flex items-center px-6 mb-4 border-b border-white/5 bg-black/10">
        <LogoHeader size="sm" mode="dark" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 py-4 scrollbar-hide">
        {dashboardNav.map((group, groupIndex) => {
          const filteredItems = group.items.filter((item) =>
            item.roles.includes(userRole),
          );

          if (filteredItems.length === 0) return null;

          return (
            <div
              key={groupIndex}
              className="animate-in fade-in slide-in-from-left-2 duration-500"
            >
              {group.title && (
                <h4 className="mb-3 px-4 text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em]">
                  {group.title}
                </h4>
              )}

              <nav className="space-y-1">
                {filteredItems.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      prefetch={false} /*  FIX: Mematikan auto-load background Next.js agar tidak spam 404 */
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                          : "text-emerald-100/60 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-transform group-hover:scale-110",
                            isActive ? "text-white" : "text-emerald-500/70",
                          )}
                        />
                        <span className="tracking-tight">{item.title}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-3 w-3 opacity-50" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20 text-center">
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-white-500/40 uppercase tracking-tighter">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Versi Sistem : v{appVersion}</span>
        </div>
      </div>
    </div>
  );
}