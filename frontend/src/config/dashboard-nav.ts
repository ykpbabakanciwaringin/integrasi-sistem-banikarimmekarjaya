import {
  LayoutDashboard,
  Building2,
  School,
  GraduationCap,
  UserCog,
  BarChart4,
  Users,
  FileQuestion,
  MonitorCheckIcon,
  type LucideIcon,
  BookOpenCheck,
  Wallet,
  Settings2,
  LibrarySquare,
  CalendarRange,
  BookMarked,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const dashboardNav: NavGroup[] = [
  {
    title: "Utama",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        // Semua role yang bisa login boleh melihat dashboard utama
        roles: [
          "SUPER_ADMIN",
          "ADMIN",
          "ADMIN_ACADEMIC",
          "ADMIN_FINANCE",
          "TEACHER",
          "USER",
        ],
      },
    ],
  },
  {
    title: "Administrasi Pusat",
    items: [
      {
        title: "Manajemen Akun",
        href: "/dashboard/accounts",
        icon: Users,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Data Lembaga",
        href: "/dashboard/institutions",
        icon: Building2,
        roles: ["SUPER_ADMIN"], 
      },
    ],
  },
  {
    title: "Data Akademik",
    items: [
      {
        title: "Data Kelas",
        href: "/dashboard/classes",
        icon: School,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"],
      },
      {
        title: "Data Guru",
        href: "/dashboard/teachers",
        icon: UserCog,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"],
      },
      {
        title: "Data Siswa",
        href: "/dashboard/students",
        icon: GraduationCap,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"],
      },
      {
        title: "Master Akademik",
        href: "/dashboard/master-academic",
        icon: Settings2,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"],
      },
      {
        title: "Pelajaran & Jadwal", 
        href: "/dashboard/manage-lessons",
        icon: LibrarySquare,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"],
      },
      {
        title: "Jurnal KBM",
        href: "/dashboard/journals",
        icon: BookMarked,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC", "TEACHER"],
      },
    ],
  },
  {
    title: "Kebendaharaan",
    items: [
      {
        title: "Rekap Pembayaran",
        href: "/dashboard/finance",
        icon: Wallet,
        roles: ["SUPER_ADMIN", "ADMIN_FINANCE"], 
      },
    ],
  },
  {
    title: "Pangkalan Data Ujian",
    items: [
      {
        title: "Bank Soal",
        href: "/dashboard/questions",
        icon: FileQuestion,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC", "TEACHER"],
      },
      {
        title: "Manajemen Ujian",
        href: "/dashboard/manage-exams",
        icon: CalendarRange,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC", "TEACHER"],
      },
      {
        title: "Rekap Nilai",
        href: "/dashboard/results",
        icon: BarChart4,
        roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC", "TEACHER", "USER"],
      },
    ],
  },
];

export const getPageTitleFromNav = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard Utama";

  for (const group of dashboardNav) {
    for (const item of group.items) {
      if (item.href !== "/dashboard" && pathname.includes(item.href)) {
        return item.title;
      }
    }
  }

  if (pathname.includes("/profile")) return "Profil Saya";
  if (pathname.includes("/settings")) return "Pengaturan Sistem";
  if (pathname.includes("/login")) return "Login Akun";
  if (pathname.includes("/register")) return "Registrasi Akun";
  if (pathname.includes("/forgot-password")) return "Lupa Sandi";

  return "Menu";
};
