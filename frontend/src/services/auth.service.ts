// LOKASI: src/services/auth.service.ts
import { apiClient } from "@/lib/axios";
import {
  LoginRequest,
  LoginResponse,
  RegisterAdminInput,
} from "@/types/user";
import Cookies from "js-cookie";

export const authService = {
  // Route: GET /api/v1/auth/setup-check
  checkSetup: async (config?: import("axios").AxiosRequestConfig) => {
    const response = await apiClient.get("/auth/setup-check", config);
    //  PERBAIKAN: Backend merespons langsung dengan { is_setup_required: true/false }
    return response.data.is_setup_required;
  },

  // Route: POST /api/v1/auth/setup
  setupFirstAdmin: async (payload: RegisterAdminInput): Promise<void> => {
    await apiClient.post("/auth/setup", payload);
  },

  // Route: POST /api/v1/auth/login
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    //  PERBAIKAN: Kita langsung mendefinisikan tipe kembalian sebagai LoginResponse
    // Karena backend membalas langsung { token, user } tanpa dibungkus "data" lagi
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    
    //  PERBAIKAN: Baca langsung dari data.token, bukan data.data.token
    if (data.token) {
      Cookies.set("token", data.token, { expires: 1 });
    }
    
    return data;
  },

  // Route: POST /api/v1/auth/switch-institution
  switchInstitution: async (targetInstId: string): Promise<any> => {
    const { data } = await apiClient.post("/auth/switch-institution", {
      target_institution_id: targetInstId,
    });
    //  CATATAN: Ini TETAP data.data karena di backend, SwitchInstitution menggunakan
    // utils.SuccessResponse yang memang secara eksplisit membungkusnya dalam properti "data"
    return data.data; 
  },

  // Helper local...
  logout: () => {
    Cookies.remove("token");
  },

  getPublicInstitutions: async () => {
    const response = await apiClient.get("/public/institutions");
    //  CATATAN: Ini TETAP response.data.data karena backend mengembalikan 
    // PaginationResult yang di dalamnya memiliki struct field "Data" (json: "data")
    return response.data.data || [];
  },

  registerPublic: async (payload: any): Promise<void> => {
    await apiClient.post("/auth/register", payload);
  },

  forgotPassword: async (payload: {
    identifier: string;
    method: string;
  }): Promise<void> => {
    await apiClient.post("/auth/forgot-password", payload);
  },
};