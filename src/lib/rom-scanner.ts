// Modular ROM scanner. The browser adapter uses the File API + webkitdirectory.
// In Electron we'll swap `scanner` for an fs-based adapter with the same shape.

import type { Platform } from "@/stores/library";

export interface ScannedRom {
  id: string;          // stable hash (sha1 of name+size)
  fileName: string;
  title: string;
  size: number;
  platform: Platform;
  ext: string;
  // Path is informational; in browser we only have the relative path from the picker.
  relPath: string;
  // Adapter for an emulator. In browser we keep the File for later EmulatorJS load.
  source:
    | { kind: "file"; file: File }
    | { kind: "path"; absPath: string }; // future Electron
}

// Web-compatible extensions per-platform — matches what EmulatorJS / RetroArch WASM cores accept.
export const PLATFORM_EXTENSIONS: Record<Platform, string[]> = {
  NES: ["nes"],
  SNES: ["smc", "sfc", "snes"],
  GB: ["gb"],
  GBC: ["gbc"],
  GBA: ["gba"],
  N64: ["n64", "z64", "v64"],
  DS: ["nds"],
  Wii: ["wbfs", "wad", "iso"],
  PSP: ["iso", "cso", "pbp"],
  PS1: ["bin", "cue", "iso", "pbp"],
  Genesis: ["md", "gen", "smd", "bin"],
  Other: [],
};

// EmulatorJS / RetroArch core hint per platform.
export const PLATFORM_CORE: Record<Platform, string> = {
  NES: "nes",
  SNES: "snes",
  GB: "gb",
  GBC: "gb",
  GBA: "gba",
  N64: "n64",
  DS: "nds",
  Wii: "dolphin",
  PSP: "ppsspp",
  PS1: "psx",
  Genesis: "segaMD",
  Other: "",
};

const ARCHIVE_EXTS = ["zip", "7z"];

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

async function hashId(file: File): Promise<string> {
  const buf = new TextEncoder().encode(`${file.name}:${file.size}`);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest))
    .slice(0, 10)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface Scanner {
  scanFiles(files: File[], platform: Platform): Promise<ScannedRom[]>;
}

export const browserScanner: Scanner = {
  async scanFiles(files, platform) {
    const allowed = new Set([
      ...PLATFORM_EXTENSIONS[platform],
      ...ARCHIVE_EXTS,
    ]);
    const out: ScannedRom[] = [];
    for (const f of files) {
      const ext = extOf(f.name);
      if (allowed.size && !allowed.has(ext)) continue;
      out.push({
        id: await hashId(f),
        fileName: f.name,
        title: stripExt(f.name),
        size: f.size,
        platform,
        ext,
        relPath: (f as File & { webkitRelativePath?: string }).webkitRelativePath ?? f.name,
        source: { kind: "file", file: f },
      });
    }
    return out;
  },
};

// Adapter swap point — Electron will replace `scanner` with an fs-based impl.
export const scanner: Scanner = browserScanner;

export function buildAcceptList(platform: Platform): string {
  const exts = [...PLATFORM_EXTENSIONS[platform], ...ARCHIVE_EXTS];
  return exts.map((e) => `.${e}`).join(",");
}
