import { motion } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Camera,
  Music,
  Film,
  Smile,
  MessageCircle,
  Grid3x3,
  Settings,
  Users,
} from "lucide-react";
import { useFocusable } from "@/components/focus/FocusProvider";
import { useNavigate } from "@tanstack/react-router";

const ICONS = [
  { id: "dock-games", icon: Gamepad2, label: "Games" },
  { id: "dock-trophies", icon: Trophy, label: "Achievements" },
  { id: "dock-camera", icon: Camera, label: "Screenshots" },
  { id: "dock-music", icon: Music, label: "Music" },
  { id: "dock-video", icon: Film, label: "Video" },
  { id: "dock-emoji", icon: Smile, label: "Friends" },
  { id: "dock-mii", icon: Users, label: "Avatars" },
  { id: "dock-chat", icon: MessageCircle, label: "Chat" },
  { id: "dock-apps", icon: Grid3x3, label: "All apps" },
];

function DockIcon({
  id, Icon, label, col, onSelect,
}: {
  id: string; Icon: typeof Gamepad2; label: string; col: number; onSelect?: () => void;
}) {
  const { isFocused, focus } = useFocusable({ id, zone: "dock", row: 0, col, onSelect });
  return (
    <motion.button
      type="button"
      onClick={() => { focus(); onSelect?.(); }}
      onMouseEnter={focus}
      animate={{ scale: isFocused ? 1.25 : 1, y: isFocused ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-xl text-foreground/70 ${
        isFocused ? "focus-glow text-primary" : ""
      }`}
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
}

export function Dock({ onEdit }: { onEdit: () => void }) {
  const navigate = useNavigate();

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
          <DockIcon key={it.id} id={it.id} Icon={it.icon} label={it.label} col={i} />
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
