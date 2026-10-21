/**
 * 頁の言葉。日本語と英語の 2 つを持ち、頁の上の切り替えで替える (#2995)。
 *
 * 記法の語 (`時系列図` や `帯`) はどちらの言葉でも日本語のまま。英語の語で書けるようにするのは別の課題。
 */
export type Lang = "ja" | "en";

export const TEXT = {
  ja: {
    title: "dragon — 文章で書くと、動く図になる",
    tagline: "文章で書くと、動く図になる",
    language: "言葉",
    palette: "色味",
    paletteNames: { clear: "澄んだ色", paper: "紙と墨", night: "夜の計器" } as Record<string, string>,
    theme: "明暗",
    themes: { auto: "端末", light: "明", dark: "暗" },
    look: "色味と明暗を開く",
    notation: "記法",
    example: "見本を選ぶ",
    examples: { intro: "見本 — 入門 (時系列図)", oauth: "見本 — OAuth 2.0 (時系列図)", ccip: "見本 — CCIP (構成図)" },
    yours: "書いた図",
    editor: "図の記法を書く欄",
    fold: "畳む",
    unfold: "開く",
    readable: (boxes: number, steps: number) => `読めています — 箱 ${boxes} つ、段 ${steps}`,
    lineError: (line: number, message: string) => `${line} 行目 — ${message}`,
    notJson: (message: string) => `JSON として読めない — ${message}`,
    cannotDraw: (message: string) => `描けない — ${message}`,
    kept: "誤りがあるあいだは、最後に描けた図を出しています",
    exportLead: "同じ図を書き出す",
    exportTail: "で mp4 / GIF / HTML / PNG",
  },
  en: {
    title: "dragon — write it as text, get a moving diagram",
    tagline: "Write it as text, get a moving diagram",
    language: "Language",
    palette: "Palette",
    paletteNames: { clear: "Clear", paper: "Paper and ink", night: "Night gauges" } as Record<string, string>,
    theme: "Theme",
    themes: { auto: "Auto", light: "Light", dark: "Dark" },
    look: "Open palette and theme",
    notation: "Notation",
    example: "Choose an example",
    examples: { intro: "Example — Starter (sequence)", oauth: "Example — OAuth 2.0 (sequence)", ccip: "Example — CCIP (architecture)" },
    yours: "Your diagram",
    editor: "Diagram notation",
    fold: "Hide",
    unfold: "Show",
    readable: (boxes: number, steps: number) =>
      `Reads fine — ${boxes} ${boxes === 1 ? "box" : "boxes"}, ${steps} ${steps === 1 ? "step" : "steps"}`,
    lineError: (line: number, message: string) => `Line ${line} — ${message}`,
    notJson: (message: string) => `Not valid JSON — ${message}`,
    cannotDraw: (message: string) => `Cannot draw — ${message}`,
    kept: "Showing the last diagram that drew",
    exportLead: "Export the same diagram",
    exportTail: "to mp4 / GIF / HTML / PNG",
  },
} as const;

/** 端末の言語が日本語なら日本語、それ以外は英語で開く */
export function deviceLang(languages: readonly string[]): Lang {
  return languages[0]?.toLowerCase().startsWith("ja") ? "ja" : "en";
}
