import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mendekode payload JWT untuk mengambil Role tanpa library eksternal
 */
function getRoleFromToken(token: string): string | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload)?.role || null;
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/setup" ||
    pathname === "/";
  const isStudentRoute = pathname.startsWith("/student-exam");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // 1. BLOKIR TAMU (TIDAK ADA TOKEN)
  if (!token && (isStudentRoute || isDashboardRoute)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = token ? getRoleFromToken(token) : null;

  // 2. REDIRECT JIKA SUDAH LOGIN TAPI KE HALAMAN AUTH
  if (token && isAuthRoute) {
    if (role === "USER") {
      return NextResponse.redirect(new URL("/student-exam", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. PEMISAHAN ALUR SISWA DAN STAFF
  if (token) {
    const isStudent = role === "USER";
    // Siswa tidak boleh masuk ke dashboard (kecuali rekap nilai jika diizinkan nanti)
    if (
      isDashboardRoute &&
      isStudent &&
      !pathname.startsWith("/dashboard/results")
    ) {
      return NextResponse.redirect(new URL("/student-exam", request.url));
    }
    // Staff tidak boleh masuk ke area ujian siswa
    if (isStudentRoute && !isStudent) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. PROTEKSI INTERNAL DASHBOARD (SMART ROLE CHECKING)
  if (isDashboardRoute && role) {
    // A. Area Khusus Super Admin
    const superAdminOnly = ["/dashboard/accounts", "/dashboard/institutions"];
    if (superAdminOnly.some((path) => pathname.startsWith(path))) {
      if (role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

// B. Area Khusus Akademik & Manajemen
    const academicRoutes = [
      "/dashboard/classes",
      "/dashboard/students",
      "/dashboard/teachers",
      "/dashboard/academic-years",
      "/dashboard/curriculums",
      "/dashboard/subjects",
      "/dashboard/schedules",
      "/dashboard/exams",
    ];

    // Jika user mengakses halaman akademik, pastikan dia memiliki wewenang!
    if (academicRoutes.some((path) => pathname.startsWith(path))) {
      if (!["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (pathname.startsWith("/dashboard/finance")) {
      if (!["SUPER_ADMIN", "ADMIN_FINANCE"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

/**
 * 
 */
export const config = {
  matcher: [
    /*
     * Mengecualikan rute berikut dari middleware:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (folder gambar publik)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.json|.*\\.js|.*\\.css).*)",
  ],
};
