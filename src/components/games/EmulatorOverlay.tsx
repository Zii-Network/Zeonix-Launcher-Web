import { AnimatePresence, motion } from "framer-motion";
import { Power, Minimize2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RomEntry } from "@/stores/consoles";
import { coreForFile } from "@/lib/emulator-cores";
import { useEmulatorSession } from "@/stores/emulator-session";

// EmulatorJS is loaded from CDN at launch — it bundles RetroArch cores as WASM.
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

/**
 * Mounted once at the app root. While `rom` is set, the emulator stays alive —
 * minimizing only hides the overlay so background audio / state continue.
 * Terminate fully tears down the EJS instance.
 */
export function EmulatorRoot() {
  const rom = useEmulatorSession((s) => s.rom);
  const visible = useEmulatorSession((s) => s.visible);
  const minimize = useEmulatorSession((s) => s.minimize);
  const terminate = useEmulatorSession((s) => s.terminate);

  if (!rom) return null;

  return (
    <EmulatorSurface
      rom={rom}
      visible={visible}
      onMinimize={minimize}
      onTerminate={terminate}
    />
  );
}

function EmulatorSurface({
  rom,
  visible,
  onMinimize,
  onTerminate,
}: {
  rom: RomEntry;
  visible: boolean;
  onMinimize: () => void;
  onTerminate: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const mapping = coreForFile(rom.fileName);

  // Boot EJS once the user has provided a file.
  useEffect(() => {
    if (!file || !mapping || !containerRef.current) return;

    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;

    window.EJS_player = "#emu-game";
    window.EJS_gameUrl = url;
    window.EJS_core = mapping.core;
    window.EJS_pathtodata = EJS_BASE;
    window.EJS_gameName = rom.title;
    window.EJS_startOnLoaded = true;

    const script = document.createElement("script");
    script.id = "ejs-loader";
    script.src = `${EJS_BASE}loader.js`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // 1. Force-evict iframe context to kill leaky audio/JS loops
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector("iframe");
        if (iframe) {
          try {
            iframe.src = "about:blank";
            const win = iframe.contentWindow;
            if (win) {
              win.document.open();
              win.document.write("");
              win.document.close();
            }
            iframe.remove();
          } catch (e) {
            console.error("Failed to safely destroy emulator iframe:", e);
          }
        }
      }

      // 2. Explicitly cleanup via the store's killer logic
      const terminate = useEmulatorSession.getState().terminate;
      terminate();

      script.remove();
      const existing = document.getElementById("ejs-loader");
      existing?.remove();

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
    // Tear-down only on rom change / unmount — never on visibility.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, rom.id]);

  // Auto-focus the emulator container when overlay becomes visible so the
  // canvas/iframe receives keyboard + gamepad input directly.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      const host = containerRef.current;
      if (!host) return;
      const target =
        (host.querySelector("canvas, iframe") as HTMLElement | null) ?? host;
      try { target.focus({ preventScroll: true }); } catch { /* noop */ }
    }, 50);
    return () => clearTimeout(t);
  }, [visible, file]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="emu-shade"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] bg-black/95 backdrop-blur"
        />
      ) : null}

      {/* Surface stays mounted whether visible or minimized. */}
      <motion.div
        key="emu-surface"
        initial={false}
        animate={
          visible
            ? { opacity: 1, scale: 1, y: 0, pointerEvents: "auto" }
            : { opacity: 0, scale: 0.2, y: 320, pointerEvents: "none" }
        }
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
        className="fixed inset-0 z-[100] grid place-items-center"
        style={{ visibility: visible ? "visible" : "hidden" }}
      >
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onMinimize}
            className="glass focus-glow flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-foreground/90"
            aria-label="Minimize emulator (keep running)"
            title="Minimize — keep running in background (Esc)"
          >
            <Minimize2 className="h-4 w-4" />
            Minimize
          </button>
          <button
            type="button"
            onClick={onTerminate}
            className="flex items-center gap-2 rounded-2xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground"
            aria-label="Close emulator (terminate)"
            title="Close — fully terminate the game"
          >
            <Power className="h-4 w-4" />
            Close
          </button>
        </div>

        {!mapping ? (
          <div className="text-center text-foreground">
            <div className="text-xl font-bold">Unsupported file type</div>
            <div className="mt-2 text-sm text-muted-foreground">
              No core available for .{rom.ext}
            </div>
          </div>
        ) : !file ? (
          <FilePicker rom={rom} onPick={setFile} error={error} setError={setError} />
        ) : (
          <div
            ref={containerRef}
            id="emu-game"
            tabIndex={-1}
            autoFocus
            className="h-[min(90vh,720px)] w-[min(95vw,1280px)] overflow-hidden rounded-2xl bg-black tile-shadow outline-none"
          />
        )}
      </motion.div>
    </AnimatePresence>
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
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Launching</div>
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
        <span className="font-mono">{rom.fileName}</span> to boot it in RetroArch.
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
