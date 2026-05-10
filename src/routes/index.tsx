import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FocusProvider } from "@/components/focus/FocusProvider";
import { StatusBar } from "@/components/home/StatusBar";
import { AppGrid } from "@/components/home/AppGrid";
import { Dock } from "@/components/home/Dock";
import { ImportDialog } from "@/components/home/ImportDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iiSU — Retro Game Launcher" },
      {
        name: "description",
        content:
          "A retro-game launcher inspired by the iiSU Wii U front-end: glassy tiles, focus-driven navigation, gamepad support.",
      },
      { property: "og:title", content: "iiSU — Retro Game Launcher" },
      {
        property: "og:description",
        content:
          "Browse your imported retro library on a focus-first home screen with light and dark glass themes.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <FocusProvider>
      <h1 className="sr-only">iiSU Home</h1>
      <div className="flex h-screen w-screen flex-col">
        <StatusBar />
        <AppGrid onOpenImport={() => setImportOpen(true)} />
        <Dock onEdit={() => setImportOpen(true)} />
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </FocusProvider>
  );
}
