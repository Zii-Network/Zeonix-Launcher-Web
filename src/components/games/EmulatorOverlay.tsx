import { motion } from "framer-motion";
import { X, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RomEntry } from "@/stores/consoles";
import { coreForFile } from "@/lib/emulator-cores";

// EmulatorJS is loaded from CDN at launch — it bundles RetroArch cores as WASM.
// See https://emulatorjs.org/docs/getting-started

const EJS_VERSION = "stable";
const EJS_BASE = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;

declare global {
  interface Window {
    EJS_player?: string;
    EJS_gameUrl?: string;
    EJS_core?: string;
    EJS_pathtodata?: string;
    EJS_gameName?: string;
    EJS_startOnLoaded?: boolean;
    EJS_emulator?: { exit?: () => void } | null;
  }
}

export function EmulatorOverlay({
  rom,
  onClose,
}: {
  rom: RomEntry;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const mapping = coreForFile(rom.fileName);

  // Launch EmulatorJS once we have a file + container
  useEffect(() => {
    if (!file || !mapping || !containerRef.current) return;

    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;

    // Configure EmulatorJS via globals
    window.EJS_player = "#emu-game";
    window.EJS_gameUrl = url;
    window.EJS_core = mapping.core;
    window.EJS_pathtodata = EJS_BASE;
    window.EJS_gameName = rom.title;
    window.EJS_startOnLoaded = true;

    const script = document.createElement("script");
    script.src = `${EJS_BASE}loader.js`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        window.EJS_emulator?.exit?.();
      } catch {
        /* noop */
      }
      window.EJS_emulator = null;
      script.remove();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [file, mapping, rom.title]);

  // Esc closes the overlay (don't pass through to EJS)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/95 backdrop-blur"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full glass text-foreground/80 hover:text-foreground"
        aria-label="Close emulator"
      >
        <X className="h-5 w-5" />
      </button>

      {!mapping ? (
        <div className="text-center text-foreground">
          <div className="text-xl font-bold">Unsupported file type</div>
          <div className="mt-2 text-sm text-muted-foreground">
            No core available for .{rom.ext}
          </div>
        </div>
      ) : !file ? (
        <FilePicker
          rom={rom}
          onPick={setFile}
          error={error}
          setError={setError}
        />
      ) : (
        <div
          ref={containerRef}
          id="emu-game"
          className="h-[min(90vh,720px)] w-[min(95vw,1280px)] overflow-hidden rounded-2xl bg-black tile-shadow"
        />
      )}
    </motion.div>
  );
}

function FilePicker({
  rom,
  onPick,
  error,
  setError,
}: {
  rom: RomEntry;
  onPick: (f: File) => void;
  error: string | null;
  setError: (s: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid place-items-center gap-4 text-center text-foreground">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Launching
        </div>
        <div className="mt-1 text-3xl font-extrabold">{rom.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{rom.fileName}</div>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="glass focus-glow flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
      >
        <Upload className="h-4 w-4" />
        Select ROM file to start
      </button>
      <p className="max-w-md text-xs text-muted-foreground">
        Browsers can't open local files automatically — pick{" "}
        <span className="font-mono">{rom.fileName}</span> to boot it in
        RetroArch.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={`.${rom.ext}`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.name.toLowerCase() !== rom.fileName.toLowerCase()) {
            setError(`Expected "${rom.fileName}" — got "${f.name}". Loading anyway.`);
          }
          onPick(f);
        }}
      />
    </div>
  );
}
