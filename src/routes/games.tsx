import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FocusProvider, useBack } from "@/components/focus/FocusProvider";
import { StatusBar } from "@/components/home/StatusBar";
import { Dock } from "@/components/home/Dock";
import { ConsoleCarousel } from "@/components/games/ConsoleCarousel";
import { GameList } from "@/components/games/GameList";
import { AddConsoleDialog } from "@/components/games/AddConsoleDialog";
import { useConsolesStore, type ConsoleEntry } from "@/stores/consoles";
import { useEmulatorSession } from "@/stores/emulator-session";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Games — iiSU" },
      { name: "description", content: "Browse your consoles and ROM library in the iiSU launcher." },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  return (
    <FocusProvider>
      <h1 className="sr-only">Games</h1>
      <div className="flex h-screen w-screen flex-col">
        <StatusBar />
        <GamesShell />
        <Dock onEdit={() => undefined} />
      </div>
    </FocusProvider>
  );
}

function GamesShell() {
  const navigate = useNavigate();
  const consoles = useConsolesStore((s) => s.consoles);
  const load = useConsolesStore((s) => s.load);
  const loaded = useConsolesStore((s) => s.loaded);
  const launch = useEmulatorSession((s) => s.launch);
  const sessionVisible = useEmulatorSession((s) => s.visible);
  const sessionRom = useEmulatorSession((s) => s.rom);
  const minimize = useEmulatorSession((s) => s.minimize);

  const [addOpen, setAddOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ConsoleEntry | null>(null);

  useEffect(() => { void load(); }, [load]);

  // Back: in active emulator → minimize. In game list → consoles. In consoles → /
  useBack(() => {
    if (sessionRom && sessionVisible) minimize();
    else if (selected) setSelected(null);
    else navigate({ to: "/" });
  });

  return (
    <div className="relative mx-4 my-4 flex-1 overflow-hidden rounded-3xl glass">
      {!loaded ? (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="absolute inset-0"
            >
              <GameList
                console={selected}
                onBack={() => setSelected(null)}
                onLaunch={(rom) => launch(rom)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="consoles"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="absolute inset-0"
            >
              <ConsoleCarousel
                consoles={consoles}
                activeIndex={Math.min(active, consoles.length)}
                onActiveChange={setActive}
                onSelect={(c) => setSelected(c)}
                onAdd={() => setAddOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AddConsoleDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
