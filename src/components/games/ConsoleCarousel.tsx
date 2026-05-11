import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useFocusable, useFocusContext } from "@/components/focus/FocusProvider";
import type { ConsoleEntry } from "@/stores/consoles";

export function ConsoleCarousel({
  consoles,
  activeIndex,
  onActiveChange,
  onSelect,
  onAdd,
}: {
  consoles: ConsoleEntry[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onSelect: (c: ConsoleEntry) => void;
  onAdd: () => void;
}) {
  // Items: [...consoles, ADD]
  const total = consoles.length + 1;
  const clamp = (i: number) => Math.max(0, Math.min(total - 1, i));

  const { setFocused } = useFocusContext();
  useEffect(() => {
    const id = activeIndex < consoles.length
      ? `console-${consoles[activeIndex].id}`
      : "console-add";
    setFocused(id);
  }, [activeIndex, consoles, setFocused]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => onActiveChange(clamp(activeIndex - 1))}
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full glass text-foreground/70 hover:text-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => onActiveChange(clamp(activeIndex + 1))}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full glass text-foreground/70 hover:text-foreground"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="relative h-full w-full">
        {consoles.map((c, i) => (
          <ConsoleSlide
            key={c.id}
            entry={c}
            offset={i - activeIndex}
            isActive={i === activeIndex}
            onActivate={() => onActiveChange(i)}
            onSelect={() => onSelect(c)}
          />
        ))}
        <AddSlide
          offset={consoles.length - activeIndex}
          isActive={activeIndex === consoles.length}
          onActivate={() => onActiveChange(consoles.length)}
          onSelect={onAdd}
        />
      </div>
    </div>
  );
}

function slideStyle(offset: number) {
  const abs = Math.abs(offset);
  const x = offset * 320;
  const scale = abs === 0 ? 1 : abs === 1 ? 0.7 : 0.5;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.15;
  const z = 10 - abs;
  return { x, scale, opacity, zIndex: z };
}

function ConsoleSlide({
  entry,
  offset,
  isActive,
  onActivate,
  onSelect,
}: {
  entry: ConsoleEntry;
  offset: number;
  isActive: boolean;
  onActivate: () => void;
  onSelect: () => void;
}) {
  const { isFocused } = useFocusable({
    id: `console-${entry.id}`,
    zone: "grid",
    row: 1,
    col: offset + 100,
    onSelect: () => (isActive ? onSelect() : onActivate()),
  });

  if (Math.abs(offset) > 2) return null;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={slideStyle(offset)}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      <button
        type="button"
        onClick={isActive ? onSelect : onActivate}
        onMouseEnter={onActivate}
        className={`relative grid h-[300px] w-[300px] place-items-center overflow-hidden rounded-[2rem] tile-shadow text-white ${
          isActive && isFocused ? "focus-glow" : ""
        }`}
        style={{ background: entry.accent }}
      >
        <div className="absolute inset-0 grid place-items-center text-[7rem] drop-shadow-2xl">
          {entry.emoji}
        </div>
        <div className="absolute right-3 top-3 rounded-full glass px-2.5 py-1 text-[10px] font-bold text-foreground">
          {entry.platform}
        </div>
        <div className="absolute bottom-3 left-3 rounded-full glass px-3 py-1 text-[11px] font-semibold text-foreground">
          {entry.roms.length} game{entry.roms.length === 1 ? "" : "s"}
        </div>
      </button>
      {isActive ? (
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold tracking-wide drop-shadow">
            {entry.name}
          </div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold">
            Total Games:
            <span className="rounded-full bg-card px-2 py-0.5 text-foreground tile-shadow">
              {entry.roms.length}
            </span>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

function AddSlide({
  offset,
  isActive,
  onActivate,
  onSelect,
}: {
  offset: number;
  isActive: boolean;
  onActivate: () => void;
  onSelect: () => void;
}) {
  const { isFocused } = useFocusable({
    id: "console-add",
    zone: "grid",
    row: 1,
    col: offset + 100,
    onSelect: () => (isActive ? onSelect() : onActivate()),
  });
  if (Math.abs(offset) > 2) return null;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={slideStyle(offset)}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      <button
        type="button"
        onClick={isActive ? onSelect : onActivate}
        onMouseEnter={onActivate}
        className={`relative grid h-[300px] w-[300px] place-items-center overflow-hidden rounded-[2rem] border-2 border-dashed border-foreground/30 bg-foreground/5 text-foreground/70 ${
          isActive && isFocused ? "focus-glow" : ""
        }`}
      >
        <div className="grid place-items-center gap-2">
          <Plus className="h-16 w-16" />
          <div className="text-sm font-semibold">Add console</div>
        </div>
      </button>
      {isActive ? (
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold tracking-wide">New console</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Pick a platform and scan ROMs
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
