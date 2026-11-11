/**
 * 頁の言葉。日本語と英語の 2 つを持ち、上の帯の切り替えで替える (#2995、#3030、#3032、#3033)。
 *
 * 記法の語 (`時系列図` や `帯`) は見本の file が持ち、ここには持たない。
 * 部品の名前と、編集画面の棚の部品の名前はブロックの見本帳の分が持ち、
 * 書き出した一覧 (`catalog/blocks.gen.ts`) から全てのブロックの分を引く。ブロックの名前を手で並べない (#3345、#3350)。
 *
 * この file は最初に読む script に入るので、最初の画面と、後から読む塊が届く前と届かない時に出す字だけを持つ (#3565)。
 * カタログの頁だけが使う字 (図の種類の説明と、一覧と検索と拡大の字) は `catalog/text.ts` が、
 * 編集画面の棚の記法の早見の説明は `editor/syntax-text.ts` が持ち、どちらも後から読む塊に入る。
 * 英語の字は `english.ts` が持ち、英語で開いた時と英語に替えた時に読む英語の塊に入る (#3646)。
 * 頁は英語の塊が届くまで英語で描かない。開く言葉は `openLang`、替える言葉は `langChanger` が、届いてから描く側へ渡す。
 * 図の種類を足す時は、名前をここと `english.ts` の `shelf.kinds` に、説明を `catalog/text.ts` の `kinds` に、早見の説明を `editor/syntax-text.ts` に書く。
 */
import { BLOCK_ORDER, BLOCK_SHELF, BLOCK_TEXT } from "./catalog/blocks.gen";
import type { PartId as ShelfPartId } from "./editor/shelf-items";
import type { FirstScreenKey } from "./examples";
import { laterChunk, whenReady } from "./site/later";

export type Lang = "ja" | "en";

/** 見本帳の一覧の部品の名前。鍵はブロックの名前。説明は部品の頁だけが読み、ここには持たない (#3531) */
type PartTexts = { readonly [K in keyof typeof BLOCK_TEXT]: (typeof BLOCK_TEXT)[K][Lang] };

/** 全てのブロックの、見本帳の一覧の名前 */
export const partTexts = (lang: Lang): PartTexts => Object.fromEntries(Object.entries(BLOCK_TEXT).map(([name, text]) => [name, text[lang]])) as PartTexts;

/** 全てのブロックが棚に置く部品の名前。鍵は棚の部品の id */
export const shelfTexts = (lang: Lang): Readonly<Record<ShelfPartId, string>> =>
  Object.fromEntries(
    BLOCK_ORDER.flatMap((name) => {
      const shelf: Readonly<Record<string, Readonly<Record<Lang, string>>>> | { none: string } = BLOCK_SHELF[name];
      return "none" in shelf ? [] : Object.entries(shelf).map(([id, part]) => [id, part[lang]]);
    }),
  ) as Record<ShelfPartId, string>;

/** 状態の欄で数える図の部品 (#3261)。量の図は項目を数える (#3560) */
export type CountedPart = "box" | "branch" | "row" | "lane" | "part" | "item";

const JA = {
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
  split: { shelf: "棚と記法の欄の境目", code: "記法の欄と図の欄の境目" },
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
    kinds: { sequence: "時系列図", architecture: "構成図", state: "状態遷移図", git: "枝分かれの図", time: "時間軸の図", tree: "木の図", lineup: "列の図", try: "試す図", pipe: "配管の図", chart: "量の図", flow: "手順の図", cycle: "回り続ける図", mind: "考えを広げる地図", er: "表どうしの関係の図", matrix: "2つの軸で置く図", venn: "集合の重なりの図" },
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
    /** 今の図を書き出す釦と、書き出す形を選ぶ窓と、書き出せなかった時の文 (#3644) */
    export: "書き出す",
    exportMenu: "書き出す形",
    exportFailed: (reason: string) => `書き出せない: ${reason}`,
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
} as const;

/** 字の値の型を、字の並び 1 つ 1 つから字の並び全般へ広げる。表の鍵と、関数の引数と、組の長さはそのまま残す */
type Widen<T> = T extends string ? string : T extends (...args: infer A) => infer R ? (...args: A) => Widen<R> : T extends object ? { readonly [K in keyof T]: Widen<T[K]> } : T;

/** 頁の言葉の表の形。日本語の表から作り、英語の表 (`english.ts`) もこの形に合わせる */
export type Text = Widen<typeof JA>;

/** 英語の塊の中身。英語の画面の字と、最初の画面の見本の英語の記法 */
export interface English {
  text: Text;
  examples: Readonly<Record<FirstScreenKey, string>>;
}

/** 英語の塊 (#3646)。英語で開いた時と英語に替えた時に読み、届いた後は頁を移っても持ち続ける */
export const LATER_ENGLISH = laterChunk(() => import("./english").then((loaded): English => ({ text: loaded.EN_TEXT, examples: loaded.EN_FIRST_EXAMPLES })));

/**
 * 頁の言葉の表。英語の表は英語の塊が届いてから読め、届く前に読むと断る。
 * 届く前に日本語の字で代えて描かないよう、頁は `openLang` と `langChanger` が渡した言葉だけで描く
 */
export const TEXT: Readonly<Record<Lang, Text>> = {
  ja: JA,
  get en(): Text {
    const english = LATER_ENGLISH.state();
    if (english.status !== "ready") throw new Error("英語の字がまだ届いていない。英語で描く前に whenText を待つ");
    return english.value.text;
  },
};

/** 言葉の字が届くのを待つ。日本語は最初に読む script が持つので待たない。英語は英語の塊を読み、読めなかった時は断る */
export const whenText = (lang: Lang): Promise<void> => (lang === "ja" ? Promise.resolve() : whenReady(LATER_ENGLISH).then(() => undefined));

/** 端末の言語が日本語なら日本語、それ以外は英語で開く */
export function deviceLang(languages: readonly string[]): Lang {
  return languages[0]?.toLowerCase().startsWith("ja") ? "ja" : "en";
}

/**
 * 頁を開く言葉。`lang` の字が届くまで返さず、頁はこの言葉が返ってから描く。
 * 日本語は待たずに返す。英語の字を読めなかった時は、描けないまま止めず日本語で開く
 */
export async function openLang(lang: Lang, wait: (lang: Lang) => Promise<void> = whenText): Promise<Lang> {
  if (lang === "ja") return lang;
  try {
    await wait(lang);
    return lang;
  } catch {
    return "ja";
  }
}

/**
 * 頁の言葉を替える口を作る。替える先の字が届いてから `apply` に渡し、届くまでは今の言葉のまま描く。
 * 待つ間に別の言葉を頼まれたら、前の頼みは届いても渡さない。字を読めなかった時は替えない
 */
export function langChanger(apply: (lang: Lang) => void, wait: (lang: Lang) => Promise<void> = whenText): (next: Lang) => void {
  let asked: Lang | undefined;
  return (next) => {
    asked = next;
    wait(next).then(
      () => {
        if (asked === next) apply(next);
      },
      () => undefined,
    );
  };
}
