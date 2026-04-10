import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  examNotification: boolean;
  newAccountNotification: boolean;
  kioskMode: boolean;
  autoLogout: boolean;
  toggleSetting: (key: keyof Omit<SettingsState, "toggleSetting">) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      examNotification: true,
      newAccountNotification: true,
      kioskMode: false,
      autoLogout: true, // Default nyala demi keamanan
      toggleSetting: (key) =>
        set((state) => ({ ...state, [key]: !state[key] })),
    }),
    {
      name: "cbt-settings", // Nama kunci penyimpanan di Local Storage Browser
    },
  ),
);
