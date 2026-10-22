/**
 * 頁の言葉。日本語と英語の 2 つを持ち、上の帯の切り替えで替える (#2995、#3030)。
 *
 * 記法の語 (`時系列図` や `帯`) は見本の file が持ち、ここには持たない。
 */
export type Lang = "ja" | "en";

export const TEXT = {
  ja: {
    title: "dragon — 文章で書くと、動く図になる",
    tagline: "文章で書くと、動く図になる",
    language: "言葉",
    palette: "色味",
    paletteNames: { clear: "澄んだ色", paper: "紙と墨", night: "夜の計器" } as Record<string, string>,
    site: {
      nav: { home: "概要", catalog: "カタログ", editor: "編集画面", docs: "使い方", "release-notes": "更新履歴" },
      navLabel: "行き先",
      openMenu: "行き先を開く",
      closeMenu: "行き先を閉じる",
      openEditor: "編集画面を開く →",
      toDark: "暗い表示にする",
      toLight: "明るい表示にする",
      screens: {
        home: { title: "文章で書くと、動く図になる", lead: "記法を書くと、その場で図が動く。" },
        catalog: { title: "カタログ", lead: "今の記法で書いた見本を、図の種類ごとに並べる。" },
        category: { title: "カタログの分類", lead: "この分類の見本を並べる。" },
        editor: { title: "編集画面", lead: "" },
        docs: { title: "使い方", lead: "記法の書き方と、図の書き出し方。" },
        "release-notes": { title: "更新履歴", lead: "版ごとの変更。" },
        "not-found": { title: "そこは、まだ書かれていない。", lead: "お探しの頁は移動したか、削除されたか、はじめから無い。" },
      },
      backHome: "概要へ戻る",
    },
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
    site: {
      nav: { home: "Home", catalog: "Catalog", editor: "Editor", docs: "Docs", "release-notes": "Release notes" },
      navLabel: "Main navigation",
      openMenu: "Open navigation",
      closeMenu: "Close navigation",
      openEditor: "Open editor →",
      toDark: "Switch to dark",
      toLight: "Switch to light",
      screens: {
        home: { title: "Write it as text, get a moving diagram", lead: "Write the notation and the diagram moves right away." },
        catalog: { title: "Catalog", lead: "Examples written in the current notation, grouped by diagram kind." },
        category: { title: "Catalog category", lead: "The examples in this category." },
        editor: { title: "Editor", lead: "" },
        docs: { title: "Docs", lead: "How to write the notation and export diagrams." },
        "release-notes": { title: "Release notes", lead: "Changes in each version." },
        "not-found": { title: "That page has not been written yet.", lead: "The page you are looking for was moved, deleted, or never existed." },
      },
      backHome: "Back to home",
    },
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
