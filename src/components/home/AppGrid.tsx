import { useEffect, useMemo } from "react";
import { Plus, Trophy, Settings, Gift } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppTile, type AppTileData, PlaceholderTile } from "./AppTile";
import { FeaturedCard } from "./FeaturedCard";
import { useLibraryStore } from "@/stores/library";

const PLATFORM_BG: Record<string, string> = {
  NES: "linear-gradient(135deg, oklch(0.65 0.22 27), oklch(0.55 0.2 20))",
  SNES: "linear-gradient(135deg, oklch(0.55 0.18 280), oklch(0.45 0.16 290))",
  GB: "linear-gradient(135deg, oklch(0.75 0.15 130), oklch(0.6 0.12 140))",
  GBC: "linear-gradient(135deg, oklch(0.75 0.18 60), oklch(0.65 0.16 50))",
  GBA: "linear-gradient(135deg, oklch(0.6 0.18 290), oklch(0.5 0.16 280))",
  N64: "linear-gradient(135deg, oklch(0.65 0.2 145), oklch(0.55 0.18 150))",
  DS: "linear-gradient(135deg, oklch(0.7 0.15 220), oklch(0.6 0.13 240))",
  Wii: "linear-gradient(135deg, oklch(0.95 0.01 250), oklch(0.85 0.02 250))",
  PSP: "linear-gradient(135deg, oklch(0.4 0.06 280), oklch(0.3 0.05 290))",
  PS1: "linear-gradient(135deg, oklch(0.5 0.05 260), oklch(0.4 0.04 270))",
  Genesis: "linear-gradient(135deg, oklch(0.4 0.05 260), oklch(0.3 0.04 270))",
  Other: "var(--tile)",
};

const PLATFORM_ICON: Record<string, string> = {
  NES: "🎮", SNES: "🕹️", GB: "👾", GBC: "👾", GBA: "🎮",
  N64: "🎯", DS: "📱", Wii: "Wii", PSP: "P", PS1: "💿",
  Genesis: "🦔", Other: "🎲",
};

export function AppGrid({ onOpenImport }: { onOpenImport: () => void }) {
  const games = useLibraryStore((s) => s.games);
  const load = useLibraryStore((s) => s.load);
  const loaded = useLibraryStore((s) => s.loaded);
  const navigate = useNavigate();

  useEffect(() => {
    void load();
  }, [load]);

  const systemTiles: AppTileData[] = useMemo(
    () => [
      {
        id: "sys-import",
        title: "Import games",
        icon: <Plus className="h-7 w-7 text-white" />,
        bg: "linear-gradient(135deg, oklch(0.7 0.2 340), oklch(0.7 0.18 290))",
        onSelect: onOpenImport,
      },
      {
        id: "sys-achievements",
        title: "Achievements",
        icon: <Trophy className="h-7 w-7 text-amber-500" />,
      },
      {
        id: "sys-gifts",
        title: "Rewards",
        icon: <Gift className="h-7 w-7 text-rose-500" />,
      },
      {
        id: "sys-settings",
        title: "Settings",
        icon: <Settings className="h-7 w-7 text-foreground/70" />,
        onSelect: () => navigate({ to: "/profile" }),
      },
    ],
    [onOpenImport, navigate],
  );

  const gameTiles: AppTileData[] = games.map((g) => ({
    id: `game-${g.id}`,
    title: g.title,
    platform: g.platform,
    icon: g.coverDataUrl ? (
      <img
        src={g.coverDataUrl}
        alt={g.title}
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="text-2xl">{PLATFORM_ICON[g.platform] ?? "🎲"}</span>
    ),
    bg: PLATFORM_BG[g.platform] ?? "var(--tile)",
  }));

  const tiles = [...systemTiles, ...gameTiles];

  // Layout: 7-col grid, last 2 cols of rows 1-2 reserved for FeaturedCard
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const inFeatured = (r === 1 || r === 2) && (c === 5 || c === 6);
      if (!inFeatured) cells.push({ row: r, col: c });
    }
  }

  if (!loaded) {
    return (
      <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
        Loading library…
      </div>
    );
  }

  return (
    <div className="relative mx-4 my-4 flex-1 overflow-hidden rounded-3xl glass p-6">
      <div
        className="grid h-full gap-3"
        style={{
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gridTemplateRows: "repeat(3, minmax(0, 1fr))",
        }}
      >
        {cells.map(({ row, col }, i) => {
          const tile = tiles[i];
          return (
            <div
              key={`${row}-${col}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              {tile ? (
                <AppTile data={tile} row={row} col={col} />
              ) : (
                <PlaceholderTile />
              )}
            </div>
          );
        })}

        <div style={{ gridRow: "2 / span 2", gridColumn: "6 / span 2" }}>
          <FeaturedCard />
        </div>
      </div>
    </div>
  );
}
