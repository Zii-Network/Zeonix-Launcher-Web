import { motion } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Users,
  Grid3x3,
  Settings,
  Home,
} from "lucide-react";
import { useFocusable } from "@/components/focus/FocusProvider";
import { useNavigate, useLocation } from "@tanstack/react-router";

const ICONS: { id: string; icon: typeof Gamepad2; label: string; to: string }[] = [
  { id: "dock-home", icon: Home, label: "Home", to: "/" },
  { id: "dock-games", icon: Gamepad2, label: "Games", to: "/games" },
  { id: "dock-trophies", icon: Trophy, label: "Achievements", to: "/achievements" },
  { id: "dock-friends", icon: Users, label: "Friends", to: "/friends" },
  { id: "dock-apps", icon: Grid3x3, label: "All apps", to: "/apps" },
];

function DockIcon({
  id, Icon, label, col, onSelect, isActive,
}: {
  id: string; Icon: typeof Gamepad2; label: string; col: number;
  onSelect?: () => void; isActive?: boolean;
}) {
  const { isFocused, focus } = useFocusable({ id, zone: "dock", row: 0, col, onSelect });
  return (
    <motion.button
      type="button"
      onClick={() => { focus(); onSelect?.(); }}
      onMouseEnter={focus}
      animate={{ scale: isFocused ? 1.25 : isActive ? 1.1 : 1, y: isFocused ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      aria-label={label}
      title={label}
      aria-current={isActive ? "page" : undefined}
      className={`relative grid h-10 w-10 place-items-center rounded-xl ${
        isFocused
          ? "focus-glow text-primary"
          : isActive
            ? "bg-primary/15 text-primary"
            : "text-foreground/70"
      }`}
    >
      <Icon className="h-5 w-5" />
      {isActive ? (
        <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
      ) : null}
    </motion.button>
  );
}

export function Dock({ onEdit }: { onEdit: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const editFocus = useFocusable({
    id: "dock-edit", zone: "dock", row: 0, col: -1, onSelect: onEdit,
  });
  const settingsFocus = useFocusable({
    id: "dock-settings", zone: "dock", row: 0, col: 100,
    onSelect: () => navigate({ to: "/profile" }),
  });

  return (
    <div className="flex items-center justify-between gap-3 px-4 pb-3">
      <motion.button
        type="button"
        onClick={() => { editFocus.focus(); onEdit(); }}
        animate={{ scale: editFocus.isFocused ? 1.05 : 1 }}
        className={`glass flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
          editFocus.isFocused ? "focus-glow" : ""
        }`}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px] text-black">
          Y
        </span>
        Edit
      </motion.button>

      <div className="glass flex items-center gap-1 rounded-2xl px-4 py-2">
        {ICONS.map((it, i) => (
          <DockIcon
            key={it.id}
            id={it.id}
            Icon={it.icon}
            label={it.label}
            col={i}
            isActive={location.pathname === it.to}
            onSelect={() => navigate({ to: it.to })}
          />
        ))}
      </div>

      <motion.button
        type="button"
        onClick={() => { settingsFocus.focus(); navigate({ to: "/profile" }); }}
        animate={{ scale: settingsFocus.isFocused ? 1.05 : 1 }}
        aria-label="Open profile & settings"
        title="Profile & Settings"
        className={`glass flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
          settingsFocus.isFocused ? "focus-glow" : ""
        }`}
      >
        <Settings className="h-4 w-4" />
        Settings
      </motion.button>
    </div>
  );
}
