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
  const w = window as any;

  // Stop audio context if EJS exposes one or if there's an Emscripten Module
  try {
    const emu = w.EJS_emulator;
    if (emu) {
      emu.exit?.();
      emu.stop?.();
      emu.destroy?.();
      if (emu.audioContext) {
        void emu.audioContext.close();
      }
    }

    // Emscripten modules often store audio context in Module.SDL2.audioContext
    // or similar depending on the version.
    if (w.Module && w.Module.audioContext) {
      void w.Module.audioContext.close();
    }
  } catch (e) {
    console.warn("Error during emulator cleanup:", e);
  }

  // Mute and stop every audio/video element on the page
  try {
    document.querySelectorAll("audio, video").forEach((el) => {
      const m = el as HTMLMediaElement;
      try {
        m.pause();
        m.muted = true;
        m.src = "";
        m.removeAttribute("src");
        m.load();
        m.remove();
      } catch { /* noop */ }
    });
  } catch { /* noop */ }

  // Wipe the canvas/iframe the emulator mounted into
  const host = document.getElementById("emu-game");
  if (host) {
    const iframes = Array.from(host.getElementsByTagName("iframe"));
    for (const iframe of iframes) {
      try {
        iframe.src = "about:blank";
        iframe.contentWindow?.document.open();
        iframe.contentWindow?.document.write("");
        iframe.contentWindow?.document.close();
        iframe.remove();
      } catch (e) {
        console.warn("Error cleaning up emulator iframe:", e);
      }
    }
    host.innerHTML = "";
  }

  // Clear EmulatorJS globals so a fresh launch boots clean
  w.EJS_emulator = null;
  delete w.EJS_player;
  delete w.EJS_gameUrl;
  delete w.EJS_core;
  delete w.EJS_pathtodata;
  delete w.EJS_gameName;
  delete w.EJS_startOnLoaded;
  delete w.EJS_onGameStart;
  delete w.EJS_AdUrl;
  delete w.EJS_DEBUG_XX;

  // Also clean up potential Emscripten global if it exists
  if (w.Module) {
    try {
      if (w.Module.abort) w.Module.abort();
    } catch { /* noop */ }
    w.Module = null;
  }
}

export { killEmulator };

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
