import { motion } from "framer-motion";
import { useFocusable } from "@/components/focus/FocusProvider";
import type { ReactNode } from "react";

export interface AppTileData {
  id: string;
  title: string;
  icon: ReactNode;
  bg?: string;
  platform?: string;
  onSelect?: () => void;
}

export function AppTile({
  data,
  row,
  col,
}: {
  data: AppTileData;
  row: number;
  col: number;
}) {
  const { isFocused, focus } = useFocusable({
    id: data.id,
    zone: "grid",
    row,
    col,
    onSelect: data.onSelect,
  });

  return (
    <motion.button
      type="button"
      onClick={() => {
        focus();
        data.onSelect?.();
      }}
      onMouseEnter={focus}
      animate={{ scale: isFocused ? 1.12 : 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`group relative aspect-square w-full overflow-hidden rounded-2xl tile-shadow ${
        isFocused ? "focus-glow z-10" : ""
      }`}
      style={{
        background: data.bg ?? "var(--tile)",
        color: "var(--tile-foreground)",
      }}
      title={data.title}
      aria-label={data.title}
    >
      <div className="absolute inset-0 grid place-items-center text-3xl">
        {data.icon}
      </div>
      {data.platform ? (
        <span className="absolute right-1 top-1 rounded-md bg-black/30 px-1.5 py-0.5 text-[9px] font-bold text-white">
          {data.platform}
        </span>
      ) : null}
    </motion.button>
  );
}

export function PlaceholderTile() {
  return (
    <div className="aspect-square w-full rounded-md bg-foreground/5" />
  );
}
