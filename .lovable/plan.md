# План: ретро-лаунчер в стиле iiSU (MVP — Home)

## Что строим в этой итерации

Один экран — **Home** (как 1-й скриншот): статус-бар сверху, сетка плиток приложений по центру, док-панель с иконками снизу. Плюс модалка импорта и переключатель темы. Остальные экраны (Achievements, Game Select) — следующими итерациями.

## 1. Стек и архитектура

- **TanStack Start** (уже стоит), один маршрут `/` для Home.
- **Framer Motion** — для плавных анимаций фокуса, hover, переходов плиток.
- **Zustand** — лёгкий стор для библиотеки игр, активного фокуса, темы.
- **idb-keyval** — обёртка над IndexedDB для метаданных.
- **Tailwind v4 + дизайн-токены** в `src/styles.css` (light/dark уже есть, расширим под iiSU-палитру).

Дополнительно ставим: `framer-motion`, `zustand`, `idb-keyval`.

## 2. Структура файлов

```text
src/
  routes/index.tsx          # Home экран — собирает три зоны
  components/home/
    StatusBar.tsx           # верх: аватары друзей слева, часы/дата/батарея/профиль справа
    AppGrid.tsx             # центральная сетка плиток
    AppTile.tsx             # одна плитка (с фокус-обводкой и свечением)
    FeaturedCard.tsx        # большая правая карточка (как DK/Isabelle/Yoshi)
    Dock.tsx                # нижний док с системными иконками
    ImportDialog.tsx        # модалка импорта файлов
    ThemeToggle.tsx
  components/focus/
    FocusProvider.tsx       # контекст: активный id + клавиатура/геймпад
    useFocusable.ts         # хук регистрации элементов в grid (row,col)
    useGamepad.ts           # poll Gamepad API → события навигации
  stores/
    library.ts              # zustand: games[], add/remove, persist через idb
    ui.ts                   # zustand: theme, focusedId
  lib/
    db.ts                   # idb-keyval обёртка
    rom-metadata.ts         # извлечение имени/размера/SHA-1/платформы по расширению
  styles.css                # расширенные токены iiSU
```

## 3. Дизайн-система (токены в `src/styles.css`)

Светлая (по умолчанию, как iiSU):
- фон `oklch(0.97 0.005 250)` с точечным паттерном (CSS radial-gradient dots)
- плитки: белые карточки с мягкой тенью и скруглением `xl`
- акцент-фокус: розово-фиолетовый градиент `oklch(0.75 0.18 340)` → `oklch(0.78 0.15 290)`
- статус-бар/док: «жидкое стекло» — `backdrop-filter: blur(20px)` + полупрозрачный белый

Тёмная:
- фон `oklch(0.18 0.02 260)` с тем же dot-паттерном
- карточки `oklch(0.24 0.02 260)`, тот же розовый акцент

Новые токены: `--focus-glow`, `--surface-glass`, `--dot-pattern`, `--gradient-focus`, `--shadow-tile`, `--shadow-focus`.

## 4. Фокус-система (ключевая фича)

`FocusProvider` хранит 2D-карту фокусируемых элементов (registerable через `useFocusable({row, col})`).

Источники ввода:
- **Клавиатура**: ←↑→↓ (навигация), Enter=A (выбор), Esc=B (назад), Tab между зонами (статус-бар → grid → dock).
- **Геймпад**: `useGamepad` через `requestAnimationFrame` опрашивает `navigator.getGamepads()`, мапит D-pad/левый стик/A/B/X/Y на те же события.

Визуал активного элемента (`AppTile` при `isFocused`):
- `framer-motion`: `scale: 1.12`, `spring { stiffness: 300, damping: 20 }`
- обводка `2px solid var(--focus-glow)` + двойной box-shadow для свечения
- лёгкое непрерывное «дыхание» glow через `animate` keyframes

При навигации — `motion` `layoutId` на focus-ring создаёт плавный переезд рамки между плитками (как в iiSU).

## 5. Импорт метаданных игр

Кнопка «+ Импорт» открывает `ImportDialog`:
1. `<input type="file" multiple accept=".nes,.snes,.gb,.gba,.nds,.iso,.cso,...">`.
2. Для каждого файла извлекаем:
   - имя без расширения → `title`
   - расширение → определение `platform` (NES/SNES/GBA/PSP/DS/Wii…)
   - `size`
   - SHA-1 первых 1 МБ через `crypto.subtle.digest` → стабильный `id`
3. Опционально: пользователь грузит обложку (картинка → `FileReader` → base64, лимит ~200 КБ).
4. Сохраняем массив `Game[]` в `idb-keyval` под ключом `library.v1`.

**Сами ROM не храним** — только метаданные. В `Game` остаётся `fileName` для информации, без возможности «запустить» (отдельная итерация).

Тип:
```ts
type Game = { id: string; title: string; platform: Platform; size: number; coverDataUrl?: string; addedAt: number };
```

## 6. Компоновка Home

```text
┌─────────────────────────────────────────────────────────┐
│ [+N друзей][аватары]      [часы|дата|батарея][профиль] │ ← StatusBar (glass)
├─────────────────────────────────────────────────────────┤
│  ┌──┐┌──┐┌──┐┌──┐┌──┐    ┌──┐┌──┐    ┌──────────────┐  │
│  │  ││  ││  ││  ││  │    │  ││  │    │              │  │
│  └──┘└──┘└──┘└──┘└──┘    └──┘└──┘    │  Featured    │  │
│  ┌──┐┌──┐                            │   Card       │  │ ← AppGrid + Featured
│  │  ││  │                            │              │  │
│  └──┘└──┘                            └──────────────┘  │
│  ┌──┐┌──┐                                              │
│  └──┘└──┘                                              │
├─────────────────────────────────────────────────────────┤
│ [Y Edit]  [🎮][🏆][📷][♪][🎬][😀][💬][⋯][⚙]  [A/X]    │ ← Dock (glass)
└─────────────────────────────────────────────────────────┘
```

Сетка — CSS grid 7 колонок × 3 строки, плитки берутся из `library` стора + системные плитки (Achievements, Settings — заглушки, ведут к будущим экранам). Пустые ячейки рендерятся как полупрозрачные квадраты-плейсхолдеры (точно как на скрине).

## 7. Анимации (Framer Motion)

- Появление сетки: `staggerChildren 0.03`, плитки `scale 0.9→1` + fade.
- Hover/focus плитки: spring scale + glow.
- Открытие `ImportDialog`: `AnimatePresence` + scale/blur backdrop.
- Переключение темы: плавный fade фона (через CSS transition по `--background`).

## 8. Пошаговый порядок реализации

1. Установить deps, расширить `styles.css` токенами iiSU + dot-pattern.
2. Сделать `ThemeProvider` (класс `dark` на `<html>`) + `ThemeToggle`.
3. Создать `library` и `ui` сторы + `idb-keyval` персист.
4. `FocusProvider` + `useFocusable` + клавиатурные события.
5. `useGamepad` (poll loop через rAF).
6. Сверстать `StatusBar`, `Dock`, `AppGrid`, `AppTile`, `FeaturedCard`.
7. `ImportDialog` + `rom-metadata` (хеш + платформа по расширению).
8. Сидировать 5–6 демо-плиток при пустой библиотеке, чтобы Home не выглядел голым.
9. Анимации + полировка glass/glow.

## Что НЕ делаем сейчас

- Экраны Achievements и Game Select (договорились — следующими итерациями, но архитектура фокуса/темы готова к ним).
- Запуск эмуляторов / хранение ROM-байтов.
- Бэкенд / синхронизация — всё локально (IndexedDB).