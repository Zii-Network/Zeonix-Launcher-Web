// Map ROM file extensions to EmulatorJS / RetroArch cores.
// EmulatorJS picks the libretro core internally based on system name.
// See https://emulatorjs.org/docs/Systems for the supported set.

export type EmuSystem =
  | "nes"
  | "snes"
  | "gb"
  | "gba"
  | "n64"
  | "nds"
  | "segaMD"
  | "psx"
  | "psp"
  | "arcade";

const EXT_TO_SYSTEM: Record<string, EmuSystem> = {
  nes: "nes",
  fds: "nes",
  smc: "snes",
  sfc: "snes",
  snes: "snes",
  gb: "gb",
  gbc: "gb",
  gba: "gba",
  n64: "n64",
  z64: "n64",
  v64: "n64",
  nds: "nds",
  md: "segaMD",
  gen: "segaMD",
  smd: "segaMD",
  bin: "psx",
  cue: "psx",
  iso: "psx",
  pbp: "psp",
  cso: "psp",
};

// Preferred libretro core per system (fed to EJS_core).
const SYSTEM_TO_CORE: Record<EmuSystem, string> = {
  nes: "fceumm",
  snes: "snes9x",
  gb: "gambatte",
  gba: "mgba",
  n64: "mupen64plus_next",
  nds: "melonds",
  segaMD: "genesis_plus_gx",
  psx: "mednafen_psx_hw",
  psp: "ppsspp",
  arcade: "fbneo",
};

export function detectEmuSystem(fileName: string): EmuSystem | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_SYSTEM[ext] ?? null;
}

export function coreForFile(fileName: string): { system: EmuSystem; core: string } | null {
  const system = detectEmuSystem(fileName);
  if (!system) return null;
  return { system, core: SYSTEM_TO_CORE[system] };
}
