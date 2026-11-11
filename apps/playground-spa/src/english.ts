/**
 * 英語の画面の字と、最初の画面の見本 3 枚 (`intro`、`oauth`、`ccip`) の英語の記法 (#3646)。
 *
 * `text.ts` がこの file を `import()` で読み、build はこの file を 1 つの後から読む塊 (英語の塊) にする。
 * 日本語の字と日本語の見本は最初に読む script が持ち、英語は英語で開いた時と英語に替えた時だけ読む。
 * 頁は英語の塊が届いてから英語で描くので (`text.ts` の `openLang` と `langChanger`)、届く前に日本語の字で代えて描くことは無い。
 * 表の形は日本語の表 (`text.ts` の `Text`) と同じで、鍵の過不足は型で落とす。
 */
import ccipEn from "../../../packages/dragon/examples/ccip.en.dragon?raw";
import introEn from "../../../packages/dragon/examples/intro.en.dragon?raw";
import oauthEn from "../../../packages/dragon/examples/oauth.en.dragon?raw";

import type { FirstScreenKey } from "./examples";
import { type CountedPart, partTexts, shelfTexts, type Text } from "./text";

export const EN_TEXT = {
  title: "dragon — write it as text, get a moving diagram",
  tagline: "Write it as text, get a moving diagram",
  language: "Language",
  palette: "Palette",
  paletteNames: { clear: "Clear", paper: "Paper and ink", night: "Night gauges", arcade: "Arcade screen", sea: "Navy and ecru" },
  site: {
    nav: { home: "Home", catalog: "Catalog", editor: "Editor", docs: "Docs", "release-notes": "Release notes" },
    navLabel: "Main navigation",
    openMenu: "Open navigation",
    closeMenu: "Close navigation",
    openEditor: "Open editor →",
    toDark: "Switch to dark",
    toLight: "Switch to light",
    home: {
      chip: (kinds: readonly string[]) => [...kinds, "step playback"].join(" × "),
      title: ["", "Diagrams", " beyond the template"],
      lead: "Write the boxes and the edges, and move them step by step. Diagrams you gave up on because the template could not hold them now build themselves from plain text.",
      readDocs: "Read the docs",
      features: {
        eyebrow: "Why dragon",
        title: "Turn your writing into diagrams that move.",
        items: [
          { title: "Write it as text", text: "Write boxes, edges and steps one line at a time. No coordinates, no hand-built parts." },
          {
            title: "Motion, step by step",
            text: "Switch steps and envelopes and tags run along the edges while actions play inside the boxes. Order and causality become visible.",
          },
          { title: "Hand it over by URL or file", text: "Put the notation in a URL to share it, or export it to mp4, GIF, HTML or PNG with the CLI." },
        ],
      },
      steps: {
        eyebrow: "3 steps",
        title: "Up and running in a minute.",
        items: [
          { title: "Open the editor", text: "Open the editor in your browser. Nothing to install." },
          { title: "Write the notation", text: "Write boxes, edges and steps one line at a time. The first line picks the diagram kind." },
          { title: "The diagram starts moving", text: "The live view on the right shows a diagram that moves step by step. Share it by URL, or export it to a file." },
        ],
      },
      uses: { eyebrow: "Use cases", title: "Diagrams you can write.", more: "Browse the catalog →" },
      closing: { title: "Write it now, watch it move.", lead: "One notation file is all it takes. A moving diagram is yours a minute later." },
    },
    // カタログの頁だけが使う字は `catalog/text.ts` が持つ
    catalog: {
      parts: partTexts("en"),
      loading: "Loading",
      loadFailed: "Could not load the diagram",
      pageLoadFailed: "Could not load the page",
      reload: "Reload",
    },
    screens: {
      catalog: { title: "Catalog" },
      editor: { title: "Editor", lead: "" },
      docs: { title: "Docs" },
      "release-notes": { title: "Release notes" },
      "not-found": { title: "That page has not been written yet." },
    },
    releaseNotes: {
      crumb: "Breadcrumb",
      // 区切りは `•` にする。`·` は日本語の字の並びに使われ、英語の頁に日本語が残ったように読めるため (前のサイトの #2455)
      eyebrow: (version: string) => `Release log • ${version} is current`,
      accent: "notes",
      lead: "Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",
      changelog: "See the change log on GitHub",
    },
    notFound: {
      em: "That page",
      lead: (entries: number) => `The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${entries} entry points.`,
      catalog: "Browse the catalog",
      docs: "Read the docs",
    },
  },
  notation: "Notation",
  editor: "Diagram notation",
  fold: "Hide",
  unfold: "Show",
  split: { shelf: "Border between the shelf and the notation", code: "Border between the notation and the diagram" },
  readable: (part: CountedPart, count: number, steps: number) =>
    `Reads fine — ${count} ${count === 1 ? part : { box: "boxes", branch: "branches", row: "rows", lane: "lanes", part: "parts", item: "items" }[part]}, ${steps} ${steps === 1 ? "step" : "steps"}`,
  notJson: (message: string) => `Not valid JSON — ${message}`,
  cannotDraw: (message: string) => `Cannot draw — ${message}`,
  kept: "Showing the last diagram that drew",
  exportLead: "Export the same diagram",
  exportTail: "to mp4 / GIF / HTML / PNG",
  shelf: {
    label: "Shelf",
    open: "Open the shelf",
    close: "Close the shelf",
    newFile: "New file",
    tabs: { samples: "Samples", parts: "Parts", notation: "Notation" },
    filter: "Filter…",
    filterLabel: "Filter the list",
    nothing: "Nothing matches",
    kinds: { sequence: "Sequence", architecture: "Architecture", state: "State", git: "Git graph", time: "Time diagram", tree: "Tree diagram", lineup: "Lineup", try: "Try diagram", pipe: "Pipe diagram", chart: "Chart", flow: "Flow diagram", cycle: "Cycle diagram", mind: "Mind map", er: "Table relation diagram" },
    partsHint: "Click to add to the editor. Declarations go before the first step, step lines go to the last step",
    notationHint: "Line shapes, in the words of the notation you are writing",
    parts: shelfTexts("en"),
    // 記法の早見の説明は `editor/syntax-text.ts` が持つ
  },
  code: {
    file: "File name",
    import: "Import a file (.dragon or .json)",
    export: "Export the notation as a .dragon file",
  },
  stage: {
    live: "Live preview",
    fontDown: "Smaller narration text",
    fontUp: "Larger narration text",
    grid: "Show the grid",
    fullscreen: "Full screen",
    fit: "Fit to the frame",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    zoom: "Zoom level",
    phase: (n: number, total: number, title: string) => `Step ${n} / ${total} · ${title}`,
  },
  notices: {
    line: (line: number) => `Line ${line}`,
    count: (n: number) => `${n} ${n === 1 ? "error" : "errors"}`,
    hints: (n: number) => `${n} ${n === 1 ? "notice" : "notices"}`,
    goTo: (line: number) => `Go to line ${line}`,
  },
  overlaps: {
    count: (n: number) => `${n} text ${n === 1 ? "overlap" : "overlaps"}`,
    step: (n: number) => `Step ${n}`,
    goTo: (n: number) => `Go to step ${n}`,
  },
} as const satisfies Text;

/** 最初の画面の見本の英語の記法。正は `packages/dragon/examples` の `.en.dragon` の file */
export const EN_FIRST_EXAMPLES: Readonly<Record<FirstScreenKey, string>> = { intro: introEn, oauth: oauthEn, ccip: ccipEn };
