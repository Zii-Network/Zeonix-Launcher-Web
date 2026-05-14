import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, Database, Volume2, Info, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { FocusProvider, useBack, useFocusable } from "@/components/focus/FocusProvider";
import { useUIStore, ACCENT_PRESETS } from "@/stores/ui";
import { useLibraryStore } from "@/stores/library";

const SECTIONS = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "data", label: "Data", icon: Database },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "about", label: "About", icon: Info },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — iiSU" },
      { name: "description", content: "Manage your iiSU profile, themes, ROM data, audio and more." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [section, setSection] = useState<SectionId>("theme");
  return (
    <FocusProvider>
      <h1 className="sr-only">Profile</h1>
      <div className="flex h-screen w-screen flex-col p-4 gap-4">
        <Header />
        <div className="flex flex-1 gap-4 overflow-hidden">
          <SideNav section={section} setSection={setSection} />
          <main className="glass flex-1 overflow-auto rounded-3xl p-6">
            {section === "theme" && <ThemePane />}
            {section === "data" && <DataPane />}
            {section === "audio" && <AudioPane />}
            {section === "about" && <AboutPane />}
          </main>
        </div>
      </div>
    </FocusProvider>
  );
}

function Header() {
  const navigate = useNavigate();
  useBack(() => navigate({ to: "/" }));
  const back = useFocusable({ id: "profile-back", zone: "status", row: 0, col: 0, onSelect: () => navigate({ to: "/" }) });
  return (
    <div className="flex items-center justify-between">
      <motion.button
        type="button"
        onClick={() => navigate({ to: "/" })}
        onMouseEnter={back.focus}
        animate={{ scale: back.isFocused ? 1.05 : 1 }}
        className={`glass flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${back.isFocused ? "focus-glow" : ""}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </motion.button>
      <div className="glass rounded-2xl px-4 py-2 text-sm font-semibold">Profile & Settings</div>
    </div>
  );
}

function SideNavItem({ id, label, Icon, row, active, onClick }: {
  id: SectionId; label: string; Icon: typeof Palette; row: number; active: boolean; onClick: () => void;
}) {
  const f = useFocusable({ id: `nav-${id}`, zone: "grid", row, col: 0, onSelect: onClick });
  return (
    <motion.button
      type="button"
      onClick={() => { f.focus(); onClick(); }}
      onMouseEnter={f.focus}
      animate={{ scale: f.isFocused ? 1.04 : 1 }}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-secondary"
      } ${f.isFocused ? "focus-glow" : ""}`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </motion.button>
  );
}

function SideNav({ section, setSection }: { section: SectionId; setSection: (s: SectionId) => void }) {
  return (
    <nav className="glass flex w-56 flex-col gap-2 rounded-3xl p-3">
      {SECTIONS.map((s, i) => (
        <SideNavItem
          key={s.id}
          id={s.id}
          label={s.label}
          Icon={s.icon}
          row={i}
          active={section === s.id}
          onClick={() => setSection(s.id)}
        />
      ))}
    </nav>
  );
}

function PaneTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-2xl font-bold tracking-tight">{children}</h2>;
}

function ThemePane() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const options: { id: "light" | "dark"; label: string; Icon: typeof Sun }[] = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
  ];
  return (
    <div>
      <PaneTitle>Theme</PaneTitle>
      <p className="mb-6 text-sm text-muted-foreground">Choose how iiSU looks. The change applies immediately.</p>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {options.map(({ id, label, Icon }, i) => {
          const f = useFocusable({ id: `theme-${id}`, zone: "grid", row: 0, col: i + 1, onSelect: () => setTheme(id) });
          const active = theme === id;
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => { f.focus(); setTheme(id); }}
              onMouseEnter={f.focus}
              animate={{ scale: f.isFocused ? 1.06 : 1 }}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-colors ${
                active ? "border-primary bg-primary/10" : "border-transparent bg-card"
              } ${f.isFocused ? "focus-glow" : "tile-shadow"}`}
            >
              <Icon className="h-8 w-8" />
              <span className="font-semibold">{label}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Monitor className="h-4 w-4" />
        System preference is detected on first visit.
      </div>
    </div>
  );
}

function DataPane() {
  const games = useLibraryStore((s) => s.games);
  const load = useLibraryStore((s) => s.load);
  useEffect(() => { void load(); }, [load]);

  const totalSize = games.reduce((sum, g) => sum + g.size, 0);
  const platforms = new Set(games.map((g) => g.platform));

  const clearAll = async () => {
    if (!confirm("Remove all imported game metadata?")) return;
    for (const g of games) await useLibraryStore.getState().remove(g.id);
  };
  const clearF = useFocusable({ id: "data-clear", zone: "grid", row: 1, col: 0, onSelect: clearAll });

  return (
    <div>
      <PaneTitle>Data</PaneTitle>
      <p className="mb-6 text-sm text-muted-foreground">
        Information about imported ROMs, paths, icons and covers. All data is stored locally in your browser (IndexedDB).
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Games" value={String(games.length)} />
        <Stat label="Platforms" value={String(platforms.size)} />
        <Stat label="Total size" value={formatBytes(totalSize)} />
      </div>

      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Library</h3>
      <div className="rounded-2xl border border-border overflow-hidden mb-6">
        {games.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No games imported yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {games.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{g.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{g.fileName}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">{g.platform}</span>
                  <span>{formatBytes(g.size)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <motion.button
        type="button"
        onClick={() => { clearF.focus(); clearAll(); }}
        onMouseEnter={clearF.focus}
        animate={{ scale: clearF.isFocused ? 1.04 : 1 }}
        disabled={games.length === 0}
        className={`flex items-center gap-2 rounded-2xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50 ${
          clearF.isFocused ? "focus-glow" : ""
        }`}
      >
        <Trash2 className="h-4 w-4" />
        Clear all data
      </motion.button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 tile-shadow">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function AudioPane() {
  const [vol, setVol] = useState(70);
  const [sfx, setSfx] = useState(true);
  return (
    <div>
      <PaneTitle>Audio</PaneTitle>
      <p className="mb-6 text-sm text-muted-foreground">UI sound and volume controls.</p>
      <div className="space-y-6 max-w-md">
        <div>
          <label className="mb-2 flex justify-between text-sm font-medium">
            <span>Master volume</span><span>{vol}%</span>
          </label>
          <input
            type="range" min={0} max={100} value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <label className="flex items-center justify-between rounded-2xl bg-card p-4 tile-shadow">
          <div>
            <div className="font-medium">UI sound effects</div>
            <div className="text-xs text-muted-foreground">Clicks and focus sounds</div>
          </div>
          <input type="checkbox" checked={sfx} onChange={(e) => setSfx(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
        </label>
        <p className="text-xs text-muted-foreground">Audio engine is a placeholder for now — settings are not persisted yet.</p>
      </div>
    </div>
  );
}

function AboutPane() {
  return (
    <div>
      <PaneTitle>About</PaneTitle>
      <div className="space-y-3 text-sm text-foreground/80 max-w-xl">
        <p><strong>iiSU</strong> — a retro-game launcher inspired by the Wii U front-end.</p>
        <p>Version <code className="rounded bg-secondary px-1.5 py-0.5">0.1.0</code></p>
        <p>Built with TanStack Start, Framer Motion, Zustand and IndexedDB. Keyboard and gamepad navigation supported.</p>
        <p className="text-muted-foreground">All your data lives locally in this browser. Nothing is uploaded.</p>
        <Link to="/" className="inline-block mt-4 text-primary underline">Back to home</Link>
      </div>
    </div>
  );
}

function formatBytes(n: number) {
  if (n === 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}
