import { get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";
import type { Platform } from "./library";

export interface RomEntry {
  id: string;
  title: string;
  fileName: string;
  size: number;
  ext: string;
  // Note: File handles cannot be persisted to IndexedDB across reloads via idb-keyval simply.
  // We store metadata; on Electron the absolute path will be re-usable directly.
  absPath?: string;
  addedAt: number;
}

export interface ConsoleEntry {
  id: string;          // platform id (one console per platform for MVP)
  platform: Platform;
  name: string;
  accent: string;      // gradient css
  emoji: string;
  roms: RomEntry[];
  addedAt: number;
}

const KEY = "iisu.consoles.v1";

interface State {
  consoles: ConsoleEntry[];
  loaded: boolean;
  load: () => Promise<void>;
  upsertConsole: (c: ConsoleEntry) => Promise<void>;
  addRoms: (consoleId: string, roms: RomEntry[]) => Promise<void>;
  removeConsole: (consoleId: string) => Promise<void>;
}

const persist = (cs: ConsoleEntry[]) => idbSet(KEY, cs);

export const useConsolesStore = create<State>((set, get) => ({
  consoles: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    const consoles = (await idbGet<ConsoleEntry[]>(KEY)) ?? [];
    set({ consoles, loaded: true });
  },
  upsertConsole: async (c) => {
    const list = get().consoles;
    const idx = list.findIndex((x) => x.id === c.id);
    const next = idx >= 0 ? list.map((x, i) => (i === idx ? c : x)) : [...list, c];
    set({ consoles: next });
    await persist(next);
  },
  addRoms: async (consoleId, roms) => {
    const next = get().consoles.map((c) => {
      if (c.id !== consoleId) return c;
      const ids = new Set(c.roms.map((r) => r.id));
      return { ...c, roms: [...c.roms, ...roms.filter((r) => !ids.has(r.id))] };
    });
    set({ consoles: next });
    await persist(next);
  },
  removeConsole: async (id) => {
    const next = get().consoles.filter((c) => c.id !== id);
    set({ consoles: next });
    await persist(next);
  },
}));

export const PLATFORM_PRESETS: Record<Platform, { name: string; accent: string; emoji: string }> = {
  NES: { name: "Nintendo Entertainment System", accent: "linear-gradient(135deg, oklch(0.65 0.22 27), oklch(0.5 0.2 20))", emoji: "🎮" },
  SNES: { name: "Super Nintendo", accent: "linear-gradient(135deg, oklch(0.6 0.2 280), oklch(0.45 0.18 290))", emoji: "🕹️" },
  GB: { name: "Game Boy", accent: "linear-gradient(135deg, oklch(0.75 0.15 130), oklch(0.55 0.12 140))", emoji: "👾" },
  GBC: { name: "Game Boy Color", accent: "linear-gradient(135deg, oklch(0.78 0.18 60), oklch(0.6 0.16 50))", emoji: "🎨" },
  GBA: { name: "Game Boy Advance", accent: "linear-gradient(135deg, oklch(0.6 0.18 290), oklch(0.45 0.16 280))", emoji: "🎮" },
  N64: { name: "Nintendo 64", accent: "linear-gradient(135deg, oklch(0.65 0.2 145), oklch(0.5 0.18 150))", emoji: "🎯" },
  DS: { name: "Nintendo DS", accent: "linear-gradient(135deg, oklch(0.7 0.15 220), oklch(0.55 0.13 240))", emoji: "📱" },
  Wii: { name: "Nintendo Switch", accent: "linear-gradient(135deg, oklch(0.7 0.22 22), oklch(0.5 0.2 18))", emoji: "🔴" },
  PSP: { name: "PlayStation Portable", accent: "linear-gradient(135deg, oklch(0.4 0.06 280), oklch(0.25 0.05 290))", emoji: "P" },
  PS1: { name: "PlayStation", accent: "linear-gradient(135deg, oklch(0.5 0.05 260), oklch(0.3 0.04 270))", emoji: "💿" },
  Genesis: { name: "Sega Genesis", accent: "linear-gradient(135deg, oklch(0.4 0.05 260), oklch(0.25 0.04 270))", emoji: "🦔" },
  Other: { name: "Other", accent: "linear-gradient(135deg, oklch(0.5 0.05 260), oklch(0.4 0.04 270))", emoji: "🎲" },
};
