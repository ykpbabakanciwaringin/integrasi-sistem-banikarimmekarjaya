// LOKASI: src/lib/axios.ts
import axios, { AxiosError, AxiosResponse } from "axios";
import Cookies from "js-cookie";

// Base path relatif agar satu domain dengan nginx (proxy /api/v1 -> backend)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Satu sumber untuk URL upload: kosong = same-origin, gambar di /uploads/...
export const STORAGE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_URL,
  //  FIX: headers "Content-Type": "application/json" DIHAPUS DARI SINI
  // Agar Axios bisa otomatis mendeteksi kapan harus mengirim JSON dan kapan harus mengirim File (FormData)
  withCredentials: true,
});

// --- REQUEST INTERCEPTOR ---
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// --- RESPONSE INTERCEPTOR (PENYEMPURNAAN JANGKA PANJANG) ---
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    //  PRAKTIK TERBAIK: Biarkan data mengalir murni sesuai yang dikirim backend.
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn("Sesi telah habis atau tidak memiliki akses.");
      Cookies.remove("token");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
    }

    // Membaca meta.message dari backend Golang
    const backendData = error.response?.data as any;
    const errorMessage =
      backendData?.meta?.message ||
      backendData?.error ||
      backendData?.message ||
      error.message ||
      "Terjadi kesalahan pada server";

    //  PERBAIKAN KRUSIAL: Melempar object Error JS murni, BUKAN menyebar object error Axios
    return Promise.reject(new Error(errorMessage));
  },
);

export const api = apiClient;

// =========================================================================
// GLOBAL HELPER FUNCTIONS (TIDAK ADA YANG DIRUBAH, AMAN UNTUK GAMBAR/FILE)
// =========================================================================

export const downloadBlob = async (endpoint: string, filename: string) => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Sesi habis. Silakan login ulang.");

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isAbsoluteUrl = API_URL.startsWith("http");
  const base =
    typeof window !== "undefined" && !isAbsoluteUrl
      ? window.location.origin
      : "";
  const url = `${base}${API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL}${path}`;

  const response = await axios.get(url, {
    responseType: "blob",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (response.data.type === "application/json") {
    const text = await response.data.text();
    let errorMessage = "Gagal download template";
    try {
      const errorObj = JSON.parse(text);
      errorMessage =
        errorObj.meta?.message ||
        errorObj.error ||
        errorObj.message ||
        errorMessage;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  const blob = new Blob([response.data], {
    type:
      response.headers["content-type"] ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const getUniversalImageUrl = (path?: string | null) => {
  if (!path || path === "null" || path === "") return "";
  if (path.startsWith("http")) return path;
  const safePath = path.startsWith("/") ? path : `/${path}`;
  let baseUrl = API_URL ? API_URL.replace(/\/api\/v1\/?$/, "") : "";
  if (!baseUrl || baseUrl === "") {
    baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8080`
        : "http://localhost:8080";
  }
  return `${baseUrl}${safePath}`;
};