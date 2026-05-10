import { create } from "zustand";

type Theme = "light" | "dark";

interface UIState {
  theme: Theme;
  focusedId: string | null;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setFocused: (id: string | null) => void;
}

const initialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("iisu-theme") as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const useUIStore = create<UIState>((set, get) => ({
  theme: initialTheme(),
  focusedId: null,
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("iisu-theme", theme);
    }
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  setFocused: (focusedId) => set({ focusedId }),
}));

// Apply theme class on first load (client only)
if (typeof document !== "undefined") {
  document.documentElement.classList.toggle(
    "dark",
    useUIStore.getState().theme === "dark",
  );
}
