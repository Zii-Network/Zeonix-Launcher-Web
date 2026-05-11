import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocusable, useFocusContext } from "@/components/focus/FocusProvider";
import type { ConsoleEntry, RomEntry } from "@/stores/consoles";

export function GameList({
  console: con,
  onBack,
}: {
  console: ConsoleEntry;
  onBack: () => void;
}) {
  const items = con.roms;
  const [active, setActive] = useState(0);
  const total = Math.max(items.length, 1);
  const clamp = (i: number) => Math.max(0, Math.min(total - 1, i));

  const { setFocused } = useFocusContext();
  useEffect(() => {
    if (items[active]) setFocused(`game-${items[active].id}`);
    else setFocused("game-empty");
  }, [active, items, setFocused]);

  return (
    <div className="relative h-full w-full">
      {/* Back chip — selected console icon center-left */}
      <ConsoleBackChip entry={con} onBack={onBack} />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setActive(clamp(active - 1))}
            className="absolute left-[280px] top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full glass"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => setActive(clamp(active + 1))}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full glass"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-0">
            {items.map((rom, i) => (
              <GameSlide
                key={rom.id}
                rom={rom}
                consoleAccent={con.accent}
                offset={i - active}
                isActive={i === active}
                onActivate={() => setActive(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ConsoleBackChip({
  entry,
  onBack,
}: {
  entry: ConsoleEntry;
  onBack: () => void;
}) {
  const { isFocused } = useFocusable({
    id: "game-back",
    zone: "grid",
    row: 1,
    col: 0,
    onSelect: onBack,
  });
  return (
    <motion.button
      type="button"
      layoutId={`console-art-${entry.id}`}
      onClick={onBack}
      animate={{ scale: isFocused ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`absolute left-6 top-1/2 z-30 -translate-y-1/2 grid h-[170px] w-[170px] place-items-center overflow-hidden rounded-[1.5rem] tile-shadow text-white ${
        isFocused ? "focus-glow" : ""
      }`}
      style={{ background: entry.accent }}
      aria-label="Back to consoles"
      title="Back to consoles"
    >
      <div className="text-[5rem] drop-shadow-xl">{entry.emoji}</div>
      <div className="absolute left-2 top-2 rounded-full bg-black/30 px-2 py-1 text-[10px] font-bold">
        <ArrowLeft className="inline h-3 w-3" /> Back
      </div>
    </motion.button>
  );
}

function slideStyle(offset: number) {
  const abs = Math.abs(offset);
  const x = 220 + offset * 280; // shift right of the back chip
  const scale = abs === 0 ? 1 : abs === 1 ? 0.72 : 0.5;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.15;
  return { x, scale, opacity, zIndex: 10 - abs };
}

function GameSlide({
  rom,
  consoleAccent,
  offset,
  isActive,
  onActivate,
}: {
  rom: RomEntry;
  consoleAccent: string;
  offset: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const { isFocused } = useFocusable({
    id: `game-${rom.id}`,
    zone: "grid",
    row: 1,
    col: offset + 200,
    onSelect: onActivate,
  });
  if (Math.abs(offset) > 2) return null;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-y-1/2"
      initial={false}
      animate={slideStyle(offset)}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      <button
        type="button"
        onClick={onActivate}
        onMouseEnter={onActivate}
        className={`relative grid h-[260px] w-[260px] place-items-center overflow-hidden rounded-[1.75rem] tile-shadow text-white text-left ${
          isActive && isFocused ? "focus-glow" : ""
        }`}
        style={{
          background:
            "linear-gradient(135deg, oklch(0.95 0.005 250), oklch(0.85 0.01 250))",
        }}
      >
        <div className="absolute inset-0 grid place-items-center text-foreground/40 text-7xl">
          🎮
        </div>
        <div
          className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: consoleAccent }}
        >
          {rom.ext.toUpperCase()}
        </div>
      </button>
      {isActive ? (
        <div className="absolute left-[280px] top-1/2 w-[420px] -translate-y-1/2 text-foreground">
          <div className="text-3xl font-extrabold uppercase tracking-wide drop-shadow">
            {rom.title}
          </div>
          <div className="mt-2 text-xs text-muted-foreground truncate">
            {rom.fileName}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-semibold">
            {(rom.size / (1024 * 1024)).toFixed(1)} MB · {rom.ext.toUpperCase()}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
      <div className="text-base font-semibold">No ROMs yet for this console</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Add ROMs from the Edit menu — they'll appear here.
      </div>
    </div>
  );
}
