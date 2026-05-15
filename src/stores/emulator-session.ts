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

function killEmulator() {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    EJS_emulator?: { exit?: () => void; callEvent?: (e: string) => void } | null;
    EJS_player?: string;
    EJS_gameUrl?: string;
    EJS_core?: string;
    EJS_pathtodata?: string;
    EJS_gameName?: string;
    EJS_startOnLoaded?: boolean;
  };
  // Stop audio context if EJS exposes one
  try {
    const emu = w.EJS_emulator as unknown as {
      exit?: () => void;
      audioContext?: AudioContext;
      Module?: { _IOS_PauseAudioContext?: () => void };
    } | null | undefined;
    emu?.exit?.();
    try { void emu?.audioContext?.close(); } catch { /* noop */ }
  } catch { /* noop */ }
  // Mute every audio/video element on the page (RetroArch sometimes uses HTMLAudio)
  try {
    document.querySelectorAll("audio, video").forEach((el) => {
      const m = el as HTMLMediaElement;
      try { m.pause(); m.muted = true; m.src = ""; m.load(); } catch { /* noop */ }
    });
  } catch { /* noop */ }
  // Wipe the canvas/iframe the emulator mounted into
  const host = document.getElementById("emu-game");
  if (host) host.innerHTML = "";
  // Clear globals so a fresh launch boots clean
  w.EJS_emulator = null;
  delete w.EJS_player;
  delete w.EJS_gameUrl;
  delete w.EJS_core;
  delete w.EJS_pathtodata;
  delete w.EJS_gameName;
  delete w.EJS_startOnLoaded;
}

export const useEmulatorSession = create<SessionState>((set, get) => ({
  rom: null,
  visible: false,
  launch: (rom) => {
    const curr = get().rom;
    if (curr && curr.id !== rom.id) killEmulator();
    set({ rom, visible: true });
  },
  minimize: () => set({ visible: false }),
  restore: () => {
    if (get().rom) set({ visible: true });
  },
  terminate: () => {
    killEmulator();
    set({ rom: null, visible: false });
  },
}));
