// LOKASI: src/stores/use-auth-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/services/auth.service";
import { User, LoginRequest } from "@/types/user";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (payload: LoginRequest) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
  switchInstitution: (targetInstId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (payload: LoginRequest) => {
        set({ isLoading: true });
        try {
          //  KARENA auth.service.ts SUDAH BENAR, KITA BISA LANGSUNG DESTRUCTURE
          const { user, token } = await authService.login(payload);

          // Sinkronisasi ke Cookies untuk Middleware
          Cookies.set("token", token, { expires: 1, path: "/", sameSite: "lax" });
          Cookies.set("user_role", user.role, { expires: 1, path: "/", sameSite: "lax" });

          set({
            user: user,
            token: token,
            isAuthenticated: true,
            isLoading: false,
          });

          return user;
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      switchInstitution: async (targetInstId: string) => {
        set({ isLoading: true });
        try {
          //  SAMA DI SINI, data langsung berisi { token, role, institution_name }
          const data = await authService.switchInstitution(targetInstId);

          Cookies.set("token", data.token, { expires: 1, path: "/", sameSite: "lax" });
          Cookies.set("user_role", data.role, { expires: 1, path: "/", sameSite: "lax" });

          set((state) => ({
            token: data.token,
            user: state.user
              ? {
                  ...state.user,
                  role: data.role,
                  institution_id: targetInstId,
                  institution_name: data.institution_name,
                }
              : null,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove("token", { path: "/" });
        Cookies.remove("user_role", { path: "/" });
        authService.logout();

        set({ user: null, token: null, isAuthenticated: false });

        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);