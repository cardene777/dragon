/**
 * 場面を選ぶとやり取りの順が替わる選べる図 (`try` の `[shape: scenes]`、#3873) の検査が共に使う原本と道具。
 *
 * 原本は bitsumi の型の記法をそのまま書く (cardene777/bitsumi. の #878)。
 * `ask` の欄は名札、場面、送り手、受け手、中身の 5 つをこの順に書き、場面の欄を `choose` で選ぶ。
 * やり取りごとに `item` を 1 つ書き、送り手と受け手を書かない `item` がその場面の答えになる。
 * 場面の判定は `src/kinds/try/scenes.ts` が持つ。まだ無い間もこの file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { expect } from "vitest";

/** bitsumi の見本の原本 (頼んだ処理の結果を画面が受け取る3つの方法) に `[shape: scenes]` を足した物 */
export const SAMPLE = [
  "try 頼んだ処理の結果を画面が受け取る方法を比べる [shape: scenes]",
  "",
  "route 頼む: 画面 - サーバ - 待ち列 - 処理の係 [from: 画面, to: 処理の係]",
  "queue やり取り",
  "ask 名札, 返し方, 送り手, 受け手, 中身 [into: やり取り, via: 頼む]",
  "choose 返し方: その場で返す, 後で知らせる, 画面が聞きに行く",
  "",
  "item 返す1 [返し方: その場で返す, 送り手: 画面, 受け手: サーバ, 中身: 処理を頼む]",
  "item 返す2 [返し方: その場で返す, 送り手: サーバ, 受け手: 処理の係, 中身: 処理を渡す]",
  "item 返す3 [返し方: その場で返す, 送り手: 処理の係, 受け手: 処理の係, 中身: 処理を終える]",
  "item 返す4 [返し方: その場で返す, 送り手: 処理の係, 受け手: サーバ, 中身: 結果]",
  "item 返す5 [返し方: その場で返す, 送り手: サーバ, 受け手: 画面, 中身: 結果を返す]",
  "item 返すの答え [返し方: その場で返す, 中身: 画面は、処理が終わるまで次へ進めない。サーバが処理の係の結果を待ってから返すためです。]",
  "",
  "item 知らせる1 [返し方: 後で知らせる, 送り手: 画面, 受け手: サーバ, 中身: 処理を頼む]",
  "item 知らせる2 [返し方: 後で知らせる, 送り手: サーバ, 受け手: 待ち列, 中身: 頼みを積む]",
  "item 知らせる3 [返し方: 後で知らせる, 送り手: サーバ, 受け手: 画面, 中身: 受け付けた印と問い合わせの番号を返す]",
  "item 知らせる4 [返し方: 後で知らせる, 送り手: 待ち列, 受け手: 処理の係, 中身: 頼みを渡す]",
  "item 知らせる5 [返し方: 後で知らせる, 送り手: 処理の係, 受け手: 画面, 中身: 終わったと知らせる]",
  "item 知らせるの答え [返し方: 後で知らせる, 中身: 画面は、受け付けた印を受け取ってすぐ次へ進める。結果は、処理の係が終わった時に画面へ知らせるためです。]",
  "",
  "item 聞く1 [返し方: 画面が聞きに行く, 送り手: 画面, 受け手: サーバ, 中身: 処理を頼む]",
  "item 聞く2 [返し方: 画面が聞きに行く, 送り手: サーバ, 受け手: 待ち列, 中身: 頼みを積む]",
  "item 聞く3 [返し方: 画面が聞きに行く, 送り手: サーバ, 受け手: 画面, 中身: 受け付けた印を返す]",
  "item 聞く4 [返し方: 画面が聞きに行く, 送り手: 画面, 受け手: サーバ, 中身: 終わったかを聞く]",
  "item 聞く5 [返し方: 画面が聞きに行く, 送り手: サーバ, 受け手: 画面, 中身: まだと返す]",
  "item 聞く6 [返し方: 画面が聞きに行く, 送り手: 待ち列, 受け手: 処理の係, 中身: 頼みを渡す]",
  "item 聞く7 [返し方: 画面が聞きに行く, 送り手: 画面, 受け手: サーバ, 中身: もう一度聞く]",
  "item 聞く8 [返し方: 画面が聞きに行く, 送り手: サーバ, 受け手: 画面, 中身: 結果を返す]",
  "item 聞くの答え [返し方: 画面が聞きに行く, 中身: 画面は、結果が出るまで何度もサーバに聞く。処理の係は終わっても知らせず、画面が聞いた時にだけ結果が返るためです。]",
  "",
  "step その場で返すと画面は待つ",
  "  say サーバは、処理の係の結果を受け取ってから画面へ返します。",
  "  ask 返す5, その場で返す, サーバ, 画面, 結果を返す",
  "",
  "step 後で知らせると画面はすぐ進む",
  "  say サーバは受け付けた印だけを先に返し、処理の係が終わった時に画面へ知らせます。",
  "  ask 知らせる5, 後で知らせる, 処理の係, 画面, 終わったと知らせる",
  "",
  "step 画面が聞きに行くと何度も聞く",
  "  say 画面は、結果が出るまでサーバに聞き直します。",
  "  ask 聞く7, 画面が聞きに行く, 画面, サーバ, もう一度聞く",
  "",
].join("\n");

/** `[shape: scenes]` を書かない同じ原本。今の選べる図の見た目 (網と待ち列) で描く */
export const SAMPLE_PLAIN = SAMPLE.replace(" [shape: scenes]", "");

/** 見本の物 (道の順) */
export const SAMPLE_LANES = ["画面", "サーバ", "待ち列", "処理の係"];

/** 見本の場面 */
export const SAMPLE_SCENES = ["その場で返す", "後で知らせる", "画面が聞きに行く"];

/** 見本の場面ごとのやり取りの名札 (書いた順) */
export const SAMPLE_ROWS: Record<string, string[]> = {
  その場で返す: ["返す1", "返す2", "返す3", "返す4", "返す5"],
  後で知らせる: ["知らせる1", "知らせる2", "知らせる3", "知らせる4", "知らせる5"],
  画面が聞きに行く: ["聞く1", "聞く2", "聞く3", "聞く4", "聞く5", "聞く6", "聞く7", "聞く8"],
};

/** 見本の場面ごとの答えの一文と理由 */
export const SAMPLE_ANSWERS: Record<string, { head: string; why: string }> = {
  その場で返す: {
    head: "画面は、処理が終わるまで次へ進めない。",
    why: "サーバが処理の係の結果を待ってから返すためです。",
  },
  後で知らせる: {
    head: "画面は、受け付けた印を受け取ってすぐ次へ進める。",
    why: "結果は、処理の係が終わった時に画面へ知らせるためです。",
  },
  画面が聞きに行く: {
    head: "画面は、結果が出るまで何度もサーバに聞く。",
    why: "処理の係は終わっても知らせず、画面が聞いた時にだけ結果が返るためです。",
  },
};

/** 場面の欄の名前 */
export const SCENE_FIELD = "返し方";

/** 場面のやり取り 1 つ */
export interface SceneRow {
  /** `item` の名札 */
  id: string;
  scene: string;
  from: string;
  to: string;
  /** 中身 (矢印の字) */
  label: string;
  /** 送り手と受け手が同じ時、その物の注記になる */
  note: boolean;
}

/** 原本から読んだ場面の図 */
export interface Scenes {
  /** やり取りする物 (道の順) */
  lanes: string[];
  scenes: string[];
  /** 全ての場面のやり取り (書いた順) */
  rows: SceneRow[];
  /** 場面ごとの答えの一文と理由 */
  answers: Record<string, { head: string; why: string }>;
}

/** 場面の判定の処理 (`src/kinds/try/scenes.ts`) */
export interface ScenesModule {
  /** 読んだ原本 (図の JSON) から場面の図を組む */
  readScenes: (diagram: unknown) => Scenes;
  /** 選んだ場面のやり取りを書いた順に並べ、その場面の答えを添える */
  pickScene: (
    scenes: Scenes,
    scene: string,
  ) => { rows: SceneRow[]; answer: { head: string; why: string } };
}

const SCENES_MODULE = "../src/kinds/try/scenes";

/** 場面の判定の処理。無ければ置き場を名指して落とす */
export async function scenesModule(): Promise<ScenesModule> {
  const mod = (await import(/* @vite-ignore */ SCENES_MODULE).catch(() => undefined)) as
    Partial<ScenesModule> | undefined;
  expect(mod?.readScenes, `場面の図を組む readScenes が ${SCENES_MODULE} に無い`).toBeTypeOf(
    "function",
  );
  expect(mod?.pickScene, `場面を選ぶ pickScene が ${SCENES_MODULE} に無い`).toBeTypeOf("function");
  return mod as ScenesModule;
}

/**
 * 描けない原本の形を作る元の、小さな場面の図。物は 3 つ、場面は 2 つ。
 * 行の番号は 1 から数え、下の `BAD_SOURCES` の `at` はこの番号で書く
 */
const BASE = [
  "try 返し方を比べる [shape: scenes]", // 1
  "", // 2
  "route 頼む: 画面 - サーバ - 処理の係 [from: 画面, to: 処理の係]", // 3
  "queue やり取り", // 4
  "ask 名札, 返し方, 送り手, 受け手, 中身 [into: やり取り, via: 頼む]", // 5
  "choose 返し方: その場で返す, 後で知らせる", // 6
  "", // 7
  "item 返す1 [返し方: その場で返す, 送り手: 画面, 受け手: サーバ, 中身: 処理を頼む]", // 8
  "item 返す2 [返し方: その場で返す, 送り手: サーバ, 受け手: 画面, 中身: 結果を返す]", // 9
  "item 返すの答え [返し方: その場で返す, 中身: 画面は待つ。サーバが処理を終えてから返すためです。]", // 10
  "item 知らせる1 [返し方: 後で知らせる, 送り手: 画面, 受け手: サーバ, 中身: 処理を頼む]", // 11
  "item 知らせる2 [返し方: 後で知らせる, 送り手: 処理の係, 受け手: 画面, 中身: 終わったと知らせる]", // 12
  "item 知らせるの答え [返し方: 後で知らせる, 中身: 画面はすぐ進む。結果は後で届くためです。]", // 13
  "", // 14
  "step 後で知らせると画面はすぐ進む", // 15
  "  say 処理の係が終わった時に知らせる。", // 16
  "  ask 知らせる2, 後で知らせる, 処理の係, 画面, 終わったと知らせる", // 17
] as const;

/** 描ける小さな場面の図。`dragon check` が誤りを出さない */
export const GOOD_SOURCE = BASE.join("\n");

/** 描けない原本の形 1 つ */
export interface BadSource {
  /** bitsumi の手順書の描けない原本の表の誤りの名前 */
  name: string;
  /** 原本 */
  text: string;
  /** 誤りを出す行 (1 から数える) */
  at: number;
  /** 誤りの文が名指す語 (日本語の原本の語)。無ければ文が形ごとに違うことだけを見る */
  names?: string;
}

const lines = (): string[] => [...BASE];
const replaced = (at: number, line: string): string[] =>
  lines().map((text, i) => (i === at - 1 ? line : text));
const inserted = (after: number, line: string): string[] => [
  ...lines().slice(0, after),
  line,
  ...lines().slice(after),
];
const removed = (...ats: number[]): string[] => lines().filter((_, i) => !ats.includes(i + 1));

/** bitsumi の手順書 (`docs/design/figures/scenes/spec.md`) の描けない原本の表の形を、1 つずつ書いた原本 */
export const BAD_SOURCES: BadSource[] = [
  {
    name: "not-try",
    text: replaced(1, "flow 返し方を比べる [shape: scenes]").join("\n"),
    at: 1,
    names: "scenes",
  },
  { name: "part-not-allowed", text: inserted(4, "log 控え").join("\n"), at: 5, names: "控え" },
  { name: "no-ask", text: lines().slice(0, 4).join("\n"), at: 1, names: "ask" },
  {
    name: "ask-fields",
    text: replaced(5, "ask 名札, 返し方, 送り手, 中身 [into: やり取り, via: 頼む]").join("\n"),
    at: 5,
    names: "5",
  },
  { name: "scene-without-choices", text: removed(6).join("\n"), at: 5, names: "返し方" },
  {
    name: "route-shape",
    text: replaced(
      3,
      "route 頼む: 画面 - サーバ - 処理の係, 画面 - 処理の係 [from: 画面, to: 処理の係]",
    ).join("\n"),
    at: 3,
    names: "頼む",
  },
  {
    name: "lane-count",
    text: replaced(
      3,
      "route 頼む: 画面 - サーバ - 待ち列 - 処理の係 - 記録の係 [from: 画面, to: 記録の係]",
    ).join("\n"),
    at: 3,
    names: "5",
  },
  {
    name: "via-not-route",
    text: replaced(5, "ask 名札, 返し方, 送り手, 受け手, 中身 [into: やり取り]").join("\n"),
    at: 5,
    names: "via",
  },
  {
    name: "into-not-queue",
    text: replaced(5, "ask 名札, 返し方, 送り手, 受け手, 中身 [into: 返し方, via: 頼む]").join(
      "\n",
    ),
    at: 5,
    names: "into",
  },
  {
    name: "item-fields",
    text: replaced(
      12,
      "item 知らせる2 [返し方: 後で知らせる, 送り手: 処理の係, 中身: 終わったと知らせる]",
    ).join("\n"),
    at: 12,
    names: "知らせる2",
  },
  {
    name: "item-scene-unknown",
    text: replaced(
      12,
      "item 知らせる2 [返し方: すぐ返す, 送り手: 処理の係, 受け手: 画面, 中身: 終わったと知らせる]",
    ).join("\n"),
    at: 12,
    names: "すぐ返す",
  },
  {
    name: "item-lane-unknown",
    text: replaced(
      12,
      "item 知らせる2 [返し方: 後で知らせる, 送り手: 倉庫, 受け手: 画面, 中身: 終わったと知らせる]",
    ).join("\n"),
    at: 12,
    names: "倉庫",
  },
  {
    name: "scene-without-rows",
    text: removed(11, 12, 14, 15, 16, 17).join("\n"),
    at: 6,
    names: "後で知らせる",
  },
  { name: "scene-without-answer", text: removed(13).join("\n"), at: 6, names: "後で知らせる" },
  {
    name: "scene-answers",
    text: inserted(13, "item 知らせるの答え2 [返し方: 後で知らせる, 中身: 画面は進む。]").join(
      "\n",
    ),
    at: 14,
    names: "後で知らせる",
  },
  {
    name: "event-not-ask",
    text: inserted(16, "  line やり取り: 知らせる1").join("\n"),
    at: 17,
    names: "line",
  },
  {
    name: "ask-values",
    text: replaced(17, "  ask 知らせる2, 後で知らせる, 処理の係, 画面").join("\n"),
    at: 17,
  },
  {
    name: "step-item-unknown",
    text: replaced(17, "  ask 知らせる9, 後で知らせる, 処理の係, 画面, 終わったと知らせる").join(
      "\n",
    ),
    at: 17,
    names: "知らせる9",
  },
  {
    name: "step-disagrees",
    text: replaced(17, "  ask 知らせる2, 後で知らせる, サーバ, 画面, 終わったと知らせる").join(
      "\n",
    ),
    at: 17,
    names: "知らせる2",
  },
];

/**
 * 原本の語を英語に置き換える表。英語の誤りの文が仮名と漢字を含まないことを、英語の名札の原本で確かめる。
 * 長い語から置き換えるので、短い語が長い語の一部でも崩れない
 */
const ENGLISH: Record<string, string> = {
  返し方を比べる: "Compare reply ways",
  "処理の係が終わった時に知らせる。": "The worker says when it is done.",
  後で知らせると画面はすぐ進む: "Notify lets the screen move on",
  "画面は待つ。サーバが処理を終えてから返すためです。":
    "The screen waits. The server returns only after it finishes.",
  "画面はすぐ進む。結果は後で届くためです。": "The screen moves on. The result comes later.",
  "画面は進む。": "The screen moves on.",
  終わったと知らせる: "Say it is done",
  知らせるの答え2: "notifyAnswer2",
  知らせるの答え: "notifyAnswer",
  返すの答え: "waitAnswer",
  その場で返す: "wait",
  後で知らせる: "notify",
  処理を頼む: "Send the request",
  結果を返す: "Return the result",
  知らせる1: "notify1",
  知らせる2: "notify2",
  知らせる9: "notify9",
  処理の係: "worker",
  記録の係: "logger",
  すぐ返す: "instant",
  やり取り: "talk",
  返す1: "wait1",
  返す2: "wait2",
  返し方: "reply",
  送り手: "sender",
  受け手: "receiver",
  待ち列: "backlog",
  サーバ: "server",
  頼む: "path",
  画面: "screen",
  名札: "tag",
  中身: "content",
  控え: "copy",
  倉庫: "store",
};

/** 日本語の名札の原本を英語の名札の原本にする */
export function toEnglish(text: string): string {
  let out = text;
  for (const word of Object.keys(ENGLISH).sort((a, b) => b.length - a.length))
    out = out.split(word).join(ENGLISH[word]);
  return out;
}

/** 原本の語を英語に置き換えた語 (誤りの文が名指す語を英語の原本で探す時に使う) */
export const englishOf = (word: string): string => ENGLISH[word] ?? word;

/** 描けない原本を 1 つずつ図の囲いに入れた Markdown。囲いの中の行の番号から file の行の番号を引く表を添える */
export function badMarkdown(sources: { name: string; text: string }[]): {
  markdown: string;
  startOf: Record<string, number>;
} {
  const out: string[] = [];
  const startOf: Record<string, number> = {};
  for (const source of sources) {
    out.push(`## ${source.name}`, "", "```dragon");
    // 囲いの中の 1 行目は、ここまでの行の数 + 1 の行
    startOf[source.name] = out.length + 1;
    out.push(...source.text.split("\n"), "```", "");
  }
  return { markdown: out.join("\n"), startOf };
}

/** `dragon check` の 1 行 (`<file>:<line>:<column> <severity> <message>`) */
export interface CheckLine {
  line: number;
  severity: string;
  message: string;
}

/** `dragon check` の出力を行ごとに読む */
export function checkLines(output: string): CheckLine[] {
  return output
    .split("\n")
    .map((text) => /^.*?:(\d+):\d+ (error|warning) (.*)$/u.exec(text))
    .filter((found): found is RegExpExecArray => found !== null)
    .map((found) => ({
      line: Number(found[1]),
      severity: found[2] ?? "",
      message: found[3] ?? "",
    }));
}
