import { create } from "zustand";

type Theme = "light" | "dark";

export interface AccentPreset {
  id: string;
  label: string;
  hue: number;
  swatch: string; // for picker UI
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "pink", label: "iiSU Pink", hue: 340, swatch: "oklch(0.72 0.22 340)" },
  { id: "purple", label: "Ultra Violet", hue: 290, swatch: "oklch(0.7 0.2 290)" },
  { id: "blue", label: "Electric Blue", hue: 250, swatch: "oklch(0.7 0.2 250)" },
  { id: "cyan", label: "Cyber Cyan", hue: 200, swatch: "oklch(0.75 0.15 200)" },
  { id: "green", label: "Neon Lime", hue: 145, swatch: "oklch(0.75 0.2 145)" },
  { id: "amber", label: "Sunburst", hue: 70, swatch: "oklch(0.78 0.18 70)" },
  { id: "orange", label: "Inferno", hue: 35, swatch: "oklch(0.72 0.2 35)" },
  { id: "red", label: "Crimson", hue: 20, swatch: "oklch(0.65 0.24 20)" },
];

interface UIState {
  theme: Theme;
  accentHue: number;
  focusedId: string | null;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccentHue: (hue: number) => void;
  setFocused: (id: string | null) => void;
}

const initialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("iisu-theme") as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const initialAccent = (): number => {
  if (typeof window === "undefined") return 340;
  const saved = localStorage.getItem("iisu-accent-hue");
  const n = saved ? Number(saved) : NaN;
  return Number.isFinite(n) ? n : 340;
};

function applyAccent(hue: number) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", `oklch(0.72 0.2 ${hue})`);
  root.style.setProperty("--ring", `oklch(0.72 0.2 ${hue})`);
  root.style.setProperty("--accent", `oklch(0.7 0.18 ${hue})`);
  root.style.setProperty("--focus-glow", `oklch(0.78 0.22 ${hue})`);
  root.style.setProperty("--accent-color", `oklch(0.72 0.2 ${hue})`);
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: initialTheme(),
  accentHue: initialAccent(),
  focusedId: null,
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("iisu-theme", theme);
    }
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  setAccentHue: (hue) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("iisu-accent-hue", String(hue));
    }
    applyAccent(hue);
    set({ accentHue: hue });
  },
  setFocused: (focusedId) => set({ focusedId }),
}));

// Apply theme & accent on first load (client only)
if (typeof document !== "undefined") {
  const s = useUIStore.getState();
  document.documentElement.classList.toggle("dark", s.theme === "dark");
  applyAccent(s.accentHue);
}
