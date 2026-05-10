import { useEffect, useState } from "react";
import { Battery, Clock } from "lucide-react";
import { useFocusable } from "@/components/focus/FocusProvider";
import { useUIStore } from "@/stores/ui";
import { motion } from "framer-motion";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  return now;
}

const friends = ["🦊", "🐼", "🐰", "🐧", "🐸"];

export function StatusBar() {
  const now = useNow();
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const theme = useUIStore((s) => s.theme);

  const friendsFocus = useFocusable({
    id: "status-friends",
    zone: "status",
    row: 0,
    col: 0,
  });
  const profileFocus = useFocusable({
    id: "status-profile",
    zone: "status",
    row: 0,
    col: 10,
    onSelect: toggleTheme,
  });

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString([], { month: "2-digit", day: "2-digit" });

  return (
    <div className="flex items-center justify-between gap-4 px-4 pt-3">
      <motion.button
        type="button"
        onClick={friendsFocus.focus}
        animate={{ scale: friendsFocus.isFocused ? 1.05 : 1 }}
        className={`glass flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2 ${
          friendsFocus.isFocused ? "focus-glow" : ""
        }`}
      >
        <span className="text-xs font-semibold text-foreground/80">+ 4 more</span>
        <div className="flex -space-x-1.5">
          {friends.map((f, i) => (
            <div
              key={i}
              className="grid h-7 w-7 place-items-center rounded-full bg-card text-sm tile-shadow"
            >
              {f}
            </div>
          ))}
        </div>
      </motion.button>

      <div className="flex items-center gap-2">
        <motion.div
          className="glass flex items-center gap-3 rounded-full px-4 py-1.5 text-sm font-medium text-foreground/80"
        >
          <Clock className="h-4 w-4 opacity-60" />
          <span>{time}</span>
          <span className="opacity-30">|</span>
          <span>{date}</span>
          <Battery className="h-4 w-4 opacity-60" />
        </motion.div>

        <motion.button
          type="button"
          onClick={profileFocus.focus}
          onDoubleClick={toggleTheme}
          animate={{ scale: profileFocus.isFocused ? 1.1 : 1 }}
          aria-label="Toggle theme"
          title={`Theme: ${theme} (Enter to toggle)`}
          className={`grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground tile-shadow ${
            profileFocus.isFocused ? "focus-glow" : ""
          }`}
        >
          <span className="text-base">🐰</span>
        </motion.button>
      </div>
    </div>
  );
}
