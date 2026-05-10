import { get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";

export type Platform =
  | "NES"
  | "SNES"
  | "GB"
  | "GBC"
  | "GBA"
  | "N64"
  | "DS"
  | "Wii"
  | "PSP"
  | "PS1"
  | "Genesis"
  | "Other";

export interface Game {
  id: string;
  title: string;
  platform: Platform;
  size: number;
  fileName: string;
  coverDataUrl?: string;
  addedAt: number;
}

const KEY = "iisu.library.v1";

interface LibraryState {
  games: Game[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (games: Game[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const persist = (games: Game[]) => idbSet(KEY, games);

export const useLibraryStore = create<LibraryState>((set, get) => ({
  games: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    const games = (await idbGet<Game[]>(KEY)) ?? [];
    set({ games, loaded: true });
  },
  add: async (incoming) => {
    const existing = get().games;
    const ids = new Set(existing.map((g) => g.id));
    const merged = [
      ...existing,
      ...incoming.filter((g) => !ids.has(g.id)),
    ];
    set({ games: merged });
    await persist(merged);
  },
  remove: async (id) => {
    const next = get().games.filter((g) => g.id !== id);
    set({ games: next });
    await persist(next);
  },
}));
