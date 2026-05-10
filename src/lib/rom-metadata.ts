import type { Platform, Game } from "@/stores/library";

const EXT_MAP: Record<string, Platform> = {
  nes: "NES",
  smc: "SNES",
  sfc: "SNES",
  snes: "SNES",
  gb: "GB",
  gbc: "GBC",
  gba: "GBA",
  n64: "N64",
  z64: "N64",
  v64: "N64",
  nds: "DS",
  wbfs: "Wii",
  wad: "Wii",
  iso: "PSP",
  cso: "PSP",
  bin: "PS1",
  cue: "PS1",
  pbp: "PSP",
  md: "Genesis",
  gen: "Genesis",
  smd: "Genesis",
};

export function detectPlatform(fileName: string): Platform {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? "Other";
}

export function stripExt(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i > 0 ? fileName.slice(0, i) : fileName;
}

async function hashFirstChunk(file: File): Promise<string> {
  const slice = file.slice(0, Math.min(file.size, 1024 * 1024));
  const buf = await slice.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function fileToGame(file: File): Promise<Game> {
  const id = await hashFirstChunk(file);
  return {
    id,
    title: stripExt(file.name),
    platform: detectPlatform(file.name),
    size: file.size,
    fileName: file.name,
    addedAt: Date.now(),
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
