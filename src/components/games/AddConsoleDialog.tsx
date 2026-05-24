import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { X, FolderOpen, Plus } from "lucide-react";
import { useBack } from "@/components/focus/FocusProvider";
import type { Platform } from "@/stores/library";
import {
  PLATFORM_PRESETS,
  useConsolesStore,
  type RomEntry,
} from "@/stores/consoles";
import { scanner, buildAcceptList } from "@/lib/rom-scanner";

const PLATFORMS: Platform[] = [
  "NES", "SNES", "GB", "GBC", "GBA", "N64", "DS", "Wii", "PSP", "PS1", "Genesis",
];

export function AddConsoleDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const upsertConsole = useConsolesStore((s) => s.upsertConsole);
  const addRoms = useConsolesStore((s) => s.addRoms);
  const consoles = useConsolesStore((s) => s.consoles);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [scanned, setScanned] = useState<RomEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);

  useBack(open ? onClose : null);

  const reset = () => {
    setPlatform(null);
    setScanned([]);
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleFiles = async (fl: FileList | null) => {
    if (!fl || !platform) return;
    setBusy(true);
    try {
      const result = await scanner.scanFiles(Array.from(fl), platform);
      setScanned(
        result.map((r) => ({
          id: r.id,
          title: r.title,
          fileName: r.fileName,
          size: r.size,
          ext: r.ext,
          addedAt: Date.now(),
        })),
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!platform) return;
    const preset = PLATFORM_PRESETS[platform];
    const existing = consoles.find((c) => c.id === platform);
    await upsertConsole(
      existing ?? {
        id: platform,
        platform,
        name: preset.name,
        accent: preset.accent,
        emoji: preset.emoji,
        roms: [],
        addedAt: Date.now(),
      },
    );
    if (scanned.length) await addRoms(platform, scanned);
    close();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background/40 backdrop-blur-md p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-[min(720px,94vw)] max-h-[86vh] overflow-hidden rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {platform ? `Add ${PLATFORM_PRESETS[platform].name}` : "Add a console"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-foreground/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!platform ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto">
                {PLATFORMS.map((p) => {
                  const preset = PLATFORM_PRESETS[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-foreground/5 p-4 transition-all hover:bg-foreground/10 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm transition-transform group-hover:scale-110"
                        style={{ background: preset.accent }}
                      >
                        {preset.emoji}
                      </div>
                      <div className="text-center">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {p}
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-foreground/90 truncate max-w-[120px]">
                          {preset.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Pick a folder or individual ROM files. Only files matching
                  web-compatible extensions for {platform} will be kept (also
                  .zip / .7z archives). Files stay on your device.
                </p>

                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={buildAcceptList(platform)}
                  hidden
                  onChange={(e) => {
                    void handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={folderInput}
                  type="file"
                  hidden
                  // @ts-expect-error - non-standard but widely supported
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(e) => {
                    void handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => folderInput.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Pick folder
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInput.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    Pick files
                  </button>
                </div>

                <div className="flex-1 min-h-[120px] max-h-[300px] overflow-y-auto rounded-2xl bg-foreground/5 p-2">
                  {busy ? (
                    <div className="grid h-32 place-items-center text-sm text-muted-foreground">
                      Scanning…
                    </div>
                  ) : scanned.length === 0 ? (
                    <div className="grid h-32 place-items-center text-sm text-muted-foreground">
                      No ROMs scanned yet
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {scanned.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 tile-shadow"
                        >
                          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                            {r.ext}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{r.title}</div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {r.fileName}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold hover:bg-foreground/5"
                  >
                    ← Change platform
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirm()}
                    className="rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    {scanned.length > 0
                      ? `Add console + ${scanned.length} ROM${scanned.length === 1 ? "" : "s"}`
                      : "Add empty console"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
