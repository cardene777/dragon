/**
 * 頁の言葉。日本語と英語の 2 つを持ち、上の帯の切り替えで替える (#2995、#3030、#3032、#3033)。
 *
 * 記法の語 (`時系列図` や `帯`) は見本の file が持ち、ここには持たない。
 * 部品の名前と、編集画面の棚の部品の名前はブロックの見本帳の分が持ち、
 * 書き出した一覧 (`catalog/blocks.gen.ts`) から全てのブロックの分を引く。ブロックの名前を手で並べない (#3345、#3350)。
 *
 * この表は最初に読む script に入るので、最初の画面と、後から読む塊が届く前と届かない時に出す字だけを持つ (#3565)。
 * カタログの頁だけが使う字 (図の種類の説明と、一覧と検索と拡大の字) は `catalog/text.ts` が、
 * 編集画面の棚の記法の早見の説明は `editor/syntax-text.ts` が持ち、どちらも後から読む塊に入る。
 * 図の種類を足す時は、名前をここの `shelf.kinds` に、説明を `catalog/text.ts` の `kinds` に、早見の説明を `editor/syntax-text.ts` に書く。
 */
import { BLOCK_ORDER, BLOCK_SHELF, BLOCK_TEXT } from "./catalog/blocks.gen";
import type { PartId as ShelfPartId } from "./editor/shelf-items";

export type Lang = "ja" | "en";

/** 見本帳の一覧の部品の名前。鍵はブロックの名前。説明は部品の頁だけが読み、ここには持たない (#3531) */
type PartTexts = { readonly [K in keyof typeof BLOCK_TEXT]: (typeof BLOCK_TEXT)[K][Lang] };

/** 全てのブロックの、見本帳の一覧の名前 */
const partTexts = (lang: Lang): PartTexts => Object.fromEntries(Object.entries(BLOCK_TEXT).map(([name, text]) => [name, text[lang]])) as PartTexts;

/** 全てのブロックが棚に置く部品の名前。鍵は棚の部品の id */
const shelfTexts = (lang: Lang): Readonly<Record<ShelfPartId, string>> =>
  Object.fromEntries(
    BLOCK_ORDER.flatMap((name) => {
      const shelf: Readonly<Record<string, Readonly<Record<Lang, string>>>> | { none: string } = BLOCK_SHELF[name];
      return "none" in shelf ? [] : Object.entries(shelf).map(([id, part]) => [id, part[lang]]);
    }),
  ) as Record<ShelfPartId, string>;

/** 状態の欄で数える図の部品 (#3261)。量の図は項目を数える (#3560) */
export type CountedPart = "box" | "branch" | "row" | "lane" | "part" | "item";

export const TEXT = {
  ja: {
    title: "dragon — 文章で書くと、動く図になる",
    tagline: "文章で書くと、動く図になる",
    language: "言葉",
    palette: "色味",
    paletteNames: { clear: "澄んだ色", paper: "紙と墨", night: "夜の計器", arcade: "アーケードの画面", sea: "紺と生成り" } as Record<string, string>,
    site: {
      nav: { home: "概要", catalog: "カタログ", editor: "編集画面", docs: "使い方", "release-notes": "更新履歴" },
      navLabel: "行き先",
      openMenu: "行き先を開く",
      closeMenu: "行き先を閉じる",
      openEditor: "編集画面を開く →",
      toDark: "暗い表示にする",
      toLight: "明るい表示にする",
      home: {
        chip: (kinds: readonly string[]) => [...kinds, "段ごとの再生"].join(" × "),
        /** 見出しを強める語の前と、強める語と、後ろ */
        title: ["より自由な", "図", "を"],
        lead: "箱と線を書き、段ごとに動かす。型に合わせて諦めていた図が、文章のまま組み上がる。",
        readDocs: "使い方を読む",
        features: {
          eyebrow: "なぜ dragon か",
          title: "書く手間を、動く成果に。",
          items: [
            { title: "文章で書ける", text: "箱と線と段を 1 行ずつ書くだけ。座標も図の部品も組まない。" },
            { title: "段ごとに動き出す", text: "段を切り替えると、線の上を封筒や札が走り、箱の中の処理が進む。順序と因果が目に見える。" },
            { title: "URL と file で渡せる", text: "書いた記法は URL に載せて共有できる。CLI で mp4、GIF、HTML、PNG にも書き出せる。" },
          ],
        },
        steps: {
          eyebrow: "3 手順",
          title: "1 分で走り出す。",
          items: [
            { title: "編集画面を開く", text: "ブラウザで編集画面を開く。導入作業は要らない。" },
            { title: "記法を書く", text: "箱と線と段を 1 行ずつ書く。最初の行で図の種類を選ぶ。" },
            { title: "図が動き出す", text: "右の実況表示に、段ごとに動く図が出る。URL で共有でき、file にも書き出せる。" },
          ],
        },
        uses: { eyebrow: "使いどころ", title: "こんな図が書ける。", more: "カタログで図を見る →" },
        closing: { title: "今すぐ、書いて動かす。", lead: "記法を 1 つ書くだけ。動く図を 1 分後に手に入れる。" },
      },
      // カタログの頁だけが使う字は `catalog/text.ts` が持つ。ここには頁の題が使う部品の名前と、待ちの一言と、塊を読めなかった時の案内だけを置く
      catalog: {
        parts: partTexts("ja"),
        loading: "読み込み中",
        loadFailed: "図を読み込めませんでした",
        pageLoadFailed: "頁を読み込めませんでした",
        reload: "読み直す",
      },
      screens: {
        catalog: { title: "カタログ" },
        editor: { title: "編集画面", lead: "" },
        docs: { title: "使い方" },
        "release-notes": { title: "更新履歴" },
        "not-found": { title: "そこは、まだ書かれていない。" },
      },
      releaseNotes: {
        crumb: "道筋",
        eyebrow: (version: string) => `公開の記録 · ${version} が最新`,
        /** 見出しの終わりの差し色の語 */
        accent: "履歴",
        lead: "dragon の今の版を示す。版ごとの詳しい変更は GitHub 上の CHANGELOG.ja.md で読める。",
        changelog: "変更の記録を GitHub で見る",
      },
      notFound: {
        /** 見出しの頭の強める語 */
        em: "そこは",
        lead: (entries: number) => `お探しの頁は移動または削除されたか、そもそも存在しません。dragon の ${entries} つの入口から探してみてください。`,
        catalog: "カタログを見る",
        docs: "使い方を読む",
      },
    },
    notation: "記法",
    editor: "図の記法を書く欄",
    fold: "畳む",
    unfold: "開く",
    readable: (part: CountedPart, count: number, steps: number) =>
      `読めています — ${{ box: `箱 ${count} つ`, branch: `枝 ${count} 本`, row: `印の列 ${count} 本`, lane: `列 ${count} 本`, part: `部品 ${count} つ`, item: `項目 ${count} つ` }[part]}、段 ${steps}`,
    notJson: (message: string) => `JSON として読めない — ${message}`,
    cannotDraw: (message: string) => `描けない — ${message}`,
    kept: "誤りがあるあいだは、最後に描けた図を出しています",
    exportLead: "同じ図を書き出す",
    exportTail: "で mp4 / GIF / HTML / PNG",
    shelf: {
      label: "棚",
      open: "棚を開く",
      close: "棚を閉じる",
      newFile: "新規ファイル",
      tabs: { samples: "見本", parts: "部品", notation: "記法" },
      filter: "絞り込む…",
      filterLabel: "一覧を絞り込む",
      nothing: "当てはまる物が無い",
      kinds: { sequence: "時系列図", architecture: "構成図", state: "状態遷移図", git: "枝分かれの図", time: "時間軸の図", tree: "木の図", lineup: "列の図", try: "試す図", pipe: "配管の図", chart: "量の図" },
      partsHint: "押すと書く欄に足す。宣言の行は最初の段の前、段の中の行は最後の段に入る",
      notationHint: "行の形。書く欄の記法と同じ言葉の語で出す",
      parts: shelfTexts("ja"),
      // 記法の早見の説明は `editor/syntax-text.ts` が持ち、記法の見出しが後から読む
    },
    code: {
      file: "書類名",
      import: "file を取り込む (.dragon か .json)",
      export: "今の記法を .dragon の file に書き出す",
    },
    stage: {
      live: "実況表示",
      fontDown: "語りの字を小さくする",
      fontUp: "語りの字を大きくする",
      grid: "格子を出す",
      fullscreen: "全画面で見る",
      fit: "全体に合わせる",
      zoomOut: "縮小する",
      zoomIn: "拡大する",
      zoom: "表示の倍率",
      phase: (n: number, total: number, title: string) => `段 ${n} / ${total} · ${title}`,
    },
    notices: {
      line: (line: number) => `${line} 行目`,
      count: (n: number) => `誤り ${n} 件`,
      /** 図を描いたまま出す知らせの数 (#3438) */
      hints: (n: number) => `知らせ ${n} 件`,
      goTo: (line: number) => `${line} 行目へ移る`,
    },
    overlaps: {
      count: (n: number) => `字の重なり ${n} 件`,
      step: (n: number) => `段 ${n}`,
      goTo: (n: number) => `段 ${n} へ移る`,
    },
  },
  en: {
    title: "dragon — write it as text, get a moving diagram",
    tagline: "Write it as text, get a moving diagram",
    language: "Language",
    palette: "Palette",
    paletteNames: { clear: "Clear", paper: "Paper and ink", night: "Night gauges", arcade: "Arcade screen", sea: "Navy and ecru" } as Record<string, string>,
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
      kinds: { sequence: "Sequence", architecture: "Architecture", state: "State", git: "Git graph", time: "Time diagram", tree: "Tree diagram", lineup: "Lineup", try: "Try diagram", pipe: "Pipe diagram", chart: "Chart" },
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
  },
} as const;

/** 端末の言語が日本語なら日本語、それ以外は英語で開く */
export function deviceLang(languages: readonly string[]): Lang {
  return languages[0]?.toLowerCase().startsWith("ja") ? "ja" : "en";
}
