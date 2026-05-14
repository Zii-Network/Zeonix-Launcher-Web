import { create } from "zustand";
import type { RomEntry } from "./consoles";

interface SessionState {
  rom: RomEntry | null;
  visible: boolean;
  launch: (rom: RomEntry) => void;
  minimize: () => void;
  restore: () => void;
  terminate: () => void;
}

export const useEmulatorSession = create<SessionState>((set, get) => ({
  rom: null,
  visible: false,
  launch: (rom) => {
    const curr = get().rom;
    // If launching the same rom, just restore. If different, terminate previous first.
    if (curr && curr.id !== rom.id) {
      try {
        (window as unknown as { EJS_emulator?: { exit?: () => void } }).EJS_emulator?.exit?.();
      } catch { /* noop */ }
    }
    set({ rom, visible: true });
  },
  minimize: () => set({ visible: false }),
  restore: () => {
    if (get().rom) set({ visible: true });
  },
  terminate: () => {
    try {
      (window as unknown as { EJS_emulator?: { exit?: () => void } | null }).EJS_emulator?.exit?.();
    } catch { /* noop */ }
    set({ rom: null, visible: false });
  },
}));
