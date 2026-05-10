import { motion } from "framer-motion";
import { useFocusable } from "@/components/focus/FocusProvider";

export function FeaturedCard({ onSelect }: { onSelect?: () => void }) {
  const { isFocused, focus } = useFocusable({
    id: "featured-card",
    zone: "grid",
    row: 1,
    col: 6,
    onSelect,
  });

  return (
    <motion.button
      type="button"
      onClick={() => { focus(); onSelect?.(); }}
      onMouseEnter={focus}
      animate={{ scale: isFocused ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`relative col-span-2 row-span-2 overflow-hidden rounded-2xl tile-shadow ${
        isFocused ? "focus-glow" : ""
      }`}
      style={{
        background:
          "linear-gradient(135deg, oklch(0.78 0.15 230), oklch(0.7 0.18 200))",
        minHeight: 200,
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 p-4 text-center">
        <div className="text-5xl drop-shadow-lg">🦍 💫 🦖</div>
        <div className="text-sm font-bold text-white drop-shadow">
          Welcome back to iiSU
        </div>
        <div className="text-xs text-white/80 drop-shadow">
          Pick up where you left off
        </div>
      </div>
    </motion.button>
  );
}
