import { motion, AnimatePresence } from "framer-motion";
import { Power } from "lucide-react";
import { useEmulatorSession } from "@/stores/emulator-session";

/**
 * Floating "Return to Game" widget. Mounted at the app root so it appears
 * across every route while the emulator is minimized. Sits in the bottom-right
 * corner, separate from the Dock.
 */
export function FloatingActiveSession() {
  const rom = useEmulatorSession((s) => s.rom);
  const visible = useEmulatorSession((s) => s.visible);
  const restore = useEmulatorSession((s) => s.restore);
  const terminate = useEmulatorSession((s) => s.terminate);

  const show = !!rom && !visible;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="active-session"
          initial={{ opacity: 0, y: 24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-4 right-4 z-[80] flex items-center gap-1"
        >
          <button
            type="button"
            onClick={restore}
            title={`Return to ${rom!.title}`}
            aria-label={`Return to ${rom!.title}`}
            className="glass focus-glow flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold tile-shadow"
          >
            <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-base">
              🎮
              <span className="absolute -right-0.5 -top-0.5 grid h-3 w-3 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.78_0.2_145)]" />
              </span>
            </span>
            <span className="hidden max-w-[160px] truncate sm:inline">{rom!.title}</span>
          </button>
          <button
            type="button"
            onClick={terminate}
            title="Close game"
            aria-label="Close game"
            className="glass grid h-9 w-9 place-items-center rounded-2xl text-destructive tile-shadow"
          >
            <Power className="h-4 w-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
