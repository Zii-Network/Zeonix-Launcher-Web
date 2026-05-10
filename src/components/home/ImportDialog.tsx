import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { useLibraryStore } from "@/stores/library";
import { fileToGame, formatSize } from "@/lib/rom-metadata";
import { useBack } from "@/components/focus/FocusProvider";

const ACCEPT =
  ".nes,.smc,.sfc,.snes,.gb,.gbc,.gba,.n64,.z64,.v64,.nds,.iso,.cso,.bin,.cue,.pbp,.md,.gen,.smd,.wbfs,.wad";

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const games = useLibraryStore((s) => s.games);
  const add = useLibraryStore((s) => s.add);
  const remove = useLibraryStore((s) => s.remove);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  useBack(open ? onClose : null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const arr = Array.from(files);
      const games = await Promise.all(arr.map(fileToGame));
      await add(games);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background/40 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-[min(640px,92vw)] max-h-[80vh] overflow-hidden rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import games</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-foreground/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Pick local ROM files. Only metadata (name, platform, size, hash) is
              stored in your browser — the files themselves never leave your
              device.
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              hidden
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {busy ? "Reading files…" : "Choose files"}
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-foreground/5 p-2">
              {games.length === 0 ? (
                <div className="grid h-32 place-items-center text-sm text-muted-foreground">
                  No games yet
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {games.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 tile-shadow"
                    >
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {g.platform}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {g.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatSize(g.size)} · {g.fileName}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(g.id)}
                        aria-label="Remove"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
