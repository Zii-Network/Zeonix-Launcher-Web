import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { X, Trash2, Image as ImageIcon, Globe } from "lucide-react";
import { useShortcutsStore, fileToDataUrl, type Shortcut } from "@/stores/shortcuts";
import { useBack } from "@/components/focus/FocusProvider";

function makeId() {
  return `sc_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function ShortcutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = useShortcutsStore((s) => s.items);
  const load = useShortcutsStore((s) => s.load);
  const add = useShortcutsStore((s) => s.add);
  const remove = useShortcutsStore((s) => s.remove);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useBack(open ? onClose : null);
  useEffect(() => { if (open) void load(); }, [open, load]);

  const reset = () => { setTitle(""); setUrl(""); setIcon(undefined); };

  const handleSubmit = async () => {
    const cleanUrl = normalizeUrl(url);
    const cleanTitle = title.trim() || cleanUrl.replace(/^https?:\/\//, "").split("/")[0];
    if (!cleanUrl) return;
    setBusy(true);
    try {
      const sc: Shortcut = {
        id: makeId(),
        title: cleanTitle,
        url: cleanUrl,
        iconDataUrl: icon,
        addedAt: Date.now(),
      };
      await add(sc);
      reset();
    } finally {
      setBusy(false);
    }
  };

  const onPickImage = async (file?: File | null) => {
    if (!file) return;
    const data = await fileToDataUrl(file);
    setIcon(data);
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
            className="glass w-[min(640px,92vw)] max-h-[85vh] overflow-hidden rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add web shortcut</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-foreground/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-[88px_1fr] gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative grid h-22 w-22 aspect-square place-items-center overflow-hidden rounded-2xl bg-foreground/5 tile-shadow hover:bg-foreground/10"
                aria-label="Choose icon (PNG, JPG, GIF)"
                title="Choose icon (PNG, JPG, GIF)"
              >
                {icon ? (
                  <img src={icon} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (e.g. YouTube)"
                  className="rounded-xl bg-foreground/5 px-3 py-2 text-sm outline-none focus:bg-foreground/10"
                />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="rounded-xl bg-foreground/5 px-3 py-2 text-sm outline-none focus:bg-foreground/10"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onChange={(e) => { void onPickImage(e.target.files?.[0]); e.target.value = ""; }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={busy || !url.trim()}
              onClick={() => void handleSubmit()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Globe className="h-4 w-4" />
              {busy ? "Saving…" : "Add to Home"}
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-foreground/5 p-2">
              {items.length === 0 ? (
                <div className="grid h-32 place-items-center text-sm text-muted-foreground">
                  No shortcuts yet
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {items.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 tile-shadow"
                    >
                      <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-md bg-primary/15 text-primary">
                        {s.iconDataUrl ? (
                          <img src={s.iconDataUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{s.title}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{s.url}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(s.id)}
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
