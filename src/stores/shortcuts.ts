import { get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  iconDataUrl?: string; // png/jpg/gif data URL
  addedAt: number;
}

const KEY = "iisu.shortcuts.v1";

interface ShortcutsState {
  items: Shortcut[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (s: Shortcut) => Promise<void>;
  update: (id: string, patch: Partial<Shortcut>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  items: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    const items = (await idbGet<Shortcut[]>(KEY)) ?? [];
    set({ items, loaded: true });
  },
  add: async (s) => {
    const next = [...get().items, s];
    set({ items: next });
    await idbSet(KEY, next);
  },
  update: async (id, patch) => {
    const next = get().items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    set({ items: next });
    await idbSet(KEY, next);
  },
  remove: async (id) => {
    const next = get().items.filter((it) => it.id !== id);
    set({ items: next });
    await idbSet(KEY, next);
  },
}));

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}
