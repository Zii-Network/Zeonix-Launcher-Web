import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useEmulatorSession } from "@/stores/emulator-session";

export type Direction = "up" | "down" | "left" | "right";

interface FocusableMeta {
  id: string;
  zone: string;
  row: number;
  col: number;
  onSelect?: () => void;
  onAltSelect?: () => void;
}

interface FocusContextValue {
  focusedId: string | null;
  setFocused: (id: string) => void;
  register: (meta: FocusableMeta) => () => void;
  move: (dir: Direction) => void;
  select: () => void;
  back: () => void;
  registerBack: (fn: (() => void) | null) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function useFocusContext() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("FocusContext missing");
  return ctx;
}

const ZONE_ORDER = ["status", "grid", "dock"];

export function FocusProvider({ children }: { children: ReactNode }) {
  const itemsRef = useRef<Map<string, FocusableMeta>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const backHandlerRef = useRef<(() => void) | null>(null);

  const register = useCallback((meta: FocusableMeta) => {
    itemsRef.current.set(meta.id, meta);
    setFocusedId((curr) => curr ?? meta.id);
    return () => {
      itemsRef.current.delete(meta.id);
      setFocusedId((curr) => (curr === meta.id ? null : curr));
    };
  }, []);

  const setFocused = useCallback((id: string) => setFocusedId(id), []);

  const registerBack = useCallback((fn: (() => void) | null) => {
    backHandlerRef.current = fn;
  }, []);

  const move = useCallback(
    (dir: Direction) => {
      const items = Array.from(itemsRef.current.values());
      if (items.length === 0) return;
      const current =
        items.find((i) => i.id === focusedId) ?? items[0];

      // First try same zone
      const sameZone = items.filter((i) => i.zone === current.zone);
      let candidates = sameZone;

      const pickClosest = (pool: FocusableMeta[], filter: (i: FocusableMeta) => boolean) => {
        const filtered = pool.filter(filter);
        if (filtered.length === 0) return null;
        return filtered.reduce((best, i) => {
          const dRow = Math.abs(i.row - current.row);
          const dCol = Math.abs(i.col - current.col);
          const score = dRow * 10 + dCol;
          const bestScore =
            Math.abs(best.row - current.row) * 10 +
            Math.abs(best.col - current.col);
          return score < bestScore ? i : best;
        });
      };

      let next: FocusableMeta | null = null;

      if (dir === "left") {
        next = pickClosest(candidates, (i) => i.row === current.row && i.col < current.col);
        if (!next) next = pickClosest(candidates, (i) => i.col < current.col);
      } else if (dir === "right") {
        next = pickClosest(candidates, (i) => i.row === current.row && i.col > current.col);
        if (!next) next = pickClosest(candidates, (i) => i.col > current.col);
      } else if (dir === "up") {
        next = pickClosest(candidates, (i) => i.row < current.row);
        if (!next) {
          // jump to previous zone
          const idx = ZONE_ORDER.indexOf(current.zone);
          for (let z = idx - 1; z >= 0; z--) {
            const pool = items.filter((i) => i.zone === ZONE_ORDER[z]);
            if (pool.length) {
              next = pickClosest(pool, () => true);
              break;
            }
          }
        }
      } else if (dir === "down") {
        next = pickClosest(candidates, (i) => i.row > current.row);
        if (!next) {
          const idx = ZONE_ORDER.indexOf(current.zone);
          for (let z = idx + 1; z < ZONE_ORDER.length; z++) {
            const pool = items.filter((i) => i.zone === ZONE_ORDER[z]);
            if (pool.length) {
              next = pickClosest(pool, () => true);
              break;
            }
          }
        }
      }

      if (next) setFocusedId(next.id);
    },
    [focusedId],
  );

  const select = useCallback(() => {
    const item = itemsRef.current.get(focusedId ?? "");
    item?.onSelect?.();
  }, [focusedId]);

  const back = useCallback(() => {
    backHandlerRef.current?.();
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); move("up"); break;
        case "ArrowDown": e.preventDefault(); move("down"); break;
        case "ArrowLeft": e.preventDefault(); move("left"); break;
        case "ArrowRight": e.preventDefault(); move("right"); break;
        case "Enter": case " ": e.preventDefault(); select(); break;
        case "Escape": case "Backspace": e.preventDefault(); back(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, select, back]);

  // Gamepad
  useEffect(() => {
    if (typeof window === "undefined" || !("getGamepads" in navigator)) return;
    let raf = 0;
    const prev = { up: false, down: false, left: false, right: false, a: false, b: false };
    const tick = () => {
      const pads = navigator.getGamepads();
      for (const pad of pads) {
        if (!pad) continue;
        const ax0 = pad.axes[0] ?? 0;
        const ax1 = pad.axes[1] ?? 0;
        const left = pad.buttons[14]?.pressed || ax0 < -0.5;
        const right = pad.buttons[15]?.pressed || ax0 > 0.5;
        const up = pad.buttons[12]?.pressed || ax1 < -0.5;
        const down = pad.buttons[13]?.pressed || ax1 > 0.5;
        const a = pad.buttons[0]?.pressed ?? false;
        const b = pad.buttons[1]?.pressed ?? false;
        if (left && !prev.left) move("left");
        if (right && !prev.right) move("right");
        if (up && !prev.up) move("up");
        if (down && !prev.down) move("down");
        if (a && !prev.a) select();
        if (b && !prev.b) back();
        prev.left = left; prev.right = right; prev.up = up; prev.down = down;
        prev.a = a; prev.b = b;
        break;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [move, select, back]);

  const value = useMemo(
    () => ({ focusedId, setFocused, register, move, select, back, registerBack }),
    [focusedId, setFocused, register, move, select, back, registerBack],
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusable(opts: {
  id: string;
  zone: string;
  row: number;
  col: number;
  onSelect?: () => void;
}) {
  const { register, focusedId, setFocused } = useFocusContext();
  useEffect(() => {
    return register({
      id: opts.id,
      zone: opts.zone,
      row: opts.row,
      col: opts.col,
      onSelect: opts.onSelect,
    });
  }, [register, opts.id, opts.zone, opts.row, opts.col, opts.onSelect]);

  return {
    isFocused: focusedId === opts.id,
    focus: () => setFocused(opts.id),
  };
}

export function useBack(fn: (() => void) | null) {
  const { registerBack } = useFocusContext();
  useEffect(() => {
    registerBack(fn);
    return () => registerBack(null);
  }, [fn, registerBack]);
}
