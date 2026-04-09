import { useMemo } from "react";

/**
 * All available icon names in the icons directory.
 * Use these values for the `name` prop of FancyIcon.
 */
export const ICON_NAMES = [
  "activity",
  "announcement",
  "bag",
  "bookmark",
  "books",
  "brain",
  "btc",
  "calendar",
  "card",
  "chart-square-down",
  "coins",
  "cursor",
  "discount",
  "done",
  "eye",
  "folder",
  "globe",
  "graduation",
  "home",
  "image",
  "key",
  "lamp",
  "mail",
  "moon-sleep",
  "notebook",
  "notification",
  "pencil",
  "pin",
  "ppt",
  "rocket",
  "send",
  "settings",
  "share",
  "shield",
  "sign-out",
  "smile",
  "sun",
  "tag",
  "target",
  "trash",
  "trophy",
  "user",
  "watch",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

// Eagerly load all SVGs as raw strings via Vite's import.meta.glob
const svgModules = import.meta.glob<string>("./*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Build a lookup map: icon name -> raw SVG string
const svgMap: Record<string, string> = {};
for (const [path, raw] of Object.entries(svgModules)) {
  // path looks like "./home.svg" -> extract "home"
  const name = path.replace("./", "").replace(".svg", "");
  svgMap[name] = raw;
}

interface FancyIconProps {
  /** Icon name (filename without .svg) */
  name: IconName;
  /** Icon size in px (applied to width and height). Default: 20 */
  size?: number;
  /** Optional CSS class */
  className?: string;
  /** Override the fill color (default keeps the original #CDC4D8) */
  accentColor?: string;
}

/**
 * Renders an inline SVG icon from the icons directory.
 *
 * - Stroke uses `currentColor` so it inherits the parent text color.
 * - Fill keeps the original accent (#CDC4D8) unless overridden via `accentColor`.
 */
export function FancyIcon({
  name,
  size = 20,
  className,
  accentColor,
}: FancyIconProps) {
  const html = useMemo(() => {
    const raw = svgMap[name];
    if (!raw) return "";

    let processed = raw
      // Replace hardcoded stroke with currentColor
      .replace(/stroke="#1A0C21"/g, 'stroke="currentColor"')
      // Set width/height to requested size
      .replace(/width="24"/g, `width="${size}"`)
      .replace(/height="24"/g, `height="${size}"`);

    // Optionally replace the fill accent color
    if (accentColor) {
      processed = processed.replace(
        /fill="#CDC4D8"/g,
        `fill="${accentColor}"`,
      );
    }

    return processed;
  }, [name, size, accentColor]);

  if (!html) {
    if (import.meta.env.DEV) {
      console.warn(`[FancyIcon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  return (
    <span
      className={className}
      style={{ display: "inline-flex", width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default FancyIcon;
