/**
 * 場面を選ぶとやり取りの順が替わる選べる図 (`try` の `[shape: scenes]`、#3873) の判定。
 *
 * 入力の帯 (`ask`) の欄は名札、場面、送り手、受け手、中身の 5 つをこの順に書き、場面の欄を `choose` で 2 つ以上の値にする。
 * 網 (`route`) の 1 本の道の節がやり取りする物になり、道の順に左から並ぶ。
 * やり取りごとに `item` を 1 つ書き、送り手と受け手が同じ `item` はその物の注記になる。送り手と受け手を書かない `item` がその場面の答えで、
 * 中身の 1 文目 (和文は最初の「。」、欧文は最初の「. 」まで) が答えの一文、残りが理由になる。
 * 段の `ask` はやり取りの `item` の値を写し、書き出しの止め絵は書き手の最後の段の `ask` が選ぶ場面を描く。
 * 原本 (版2、`blocks` に部品とチップを持つ) と描く処理の形 (版1の欄、`try` に持つ) のどちらからも読む。
 * 描けない原本は記法を読む所 (`try-read.ts` と部品のブロック) が行の番号付きの誤りで断るので、ここは読めた原本を組むだけにする。
 * 見本は bitsumi の型の試作 (cardene777/bitsumi. の #878) の判定を写した
 */
import type { DiagramEvent, Step, TryItem, TryPart } from "../../schema";

/** 場面のやり取り 1 つ。`id` は `item` の名札、`label` は中身、`note` は送り手と受け手が同じ注記 */
export interface SceneRow {
  id: string;
  scene: string;
  from: string;
  to: string;
  label: string;
  note: boolean;
}

/** 場面の答え。`head` は答えの一文、`why` は理由 */
export interface SceneAnswer {
  head: string;
  why: string;
}

/** 原本から読んだ場面の図 */
export interface Scenes {
  /** 場面の欄の名前 */
  field: string;
  /** やり取りする物 (道の順) */
  lanes: string[];
  /** 場面 (`choose` の順) */
  scenes: string[];
  /** 全ての場面のやり取り (書いた順) */
  rows: SceneRow[];
  /** 場面ごとの答え */
  answers: Record<string, SceneAnswer>;
  /** 書き手の最後の段の `ask` が選ぶ場面。段が無ければ最初の場面 */
  chosen: string;
}

type Part<T extends TryPart["type"]> = Extract<TryPart, { type: T }>;

/** 答えの中身を、1 文目 (答えの一文) と残り (理由) に分ける。和文は最初の「。」、欧文は最初の「. 」で分ける */
export function splitAnswer(text: string): SceneAnswer {
  const ja = text.indexOf("。");
  if (ja >= 0) return { head: text.slice(0, ja + 1), why: text.slice(ja + 1).trim() };
  const en = text.indexOf(". ");
  return en >= 0
    ? { head: text.slice(0, en + 1), why: text.slice(en + 2).trim() }
    : { head: text.trim(), why: "" };
}

/** 原本 (版2) か描く処理の形 (版1の欄) の部品とチップと段 */
function sourceOf(diagram: unknown): { parts: TryPart[]; items: TryItem[]; steps: Step[] } {
  const d = (diagram ?? {}) as {
    try?: { parts?: TryPart[]; items?: TryItem[] };
    blocks?: { part?: TryPart[]; item?: unknown[] };
    steps?: Step[];
  };
  const model = d.try?.parts !== undefined;
  return {
    parts: (model ? d.try?.parts : d.blocks?.part) ?? [],
    items: ((model ? d.try?.items : d.blocks?.item) ?? []) as TryItem[],
    steps: d.steps ?? [],
  };
}

/** 書き手の最後の段の最後の `ask` */
const lastAsk = (steps: readonly Step[]): Extract<DiagramEvent, { type: "ask" }> | undefined =>
  [...steps]
    .reverse()
    .flatMap((step) => [...step.events].reverse())
    .find((event): event is Extract<DiagramEvent, { type: "ask" }> => event.type === "ask");

/** 読んだ原本 (図の JSON) から場面の図を組む */
export function readScenes(diagram: unknown): Scenes {
  const { parts, items, steps } = sourceOf(diagram);
  const ask = parts.find((p): p is Part<"ask"> => p.type === "ask");
  const route = parts.find((p): p is Part<"route"> => p.type === "route");
  const [, field = "", from = "", to = "", body = ""] = ask?.fields ?? [];
  const scenes = ask?.choices?.[field] ?? [];
  const rows: SceneRow[] = [];
  const answers: Record<string, SceneAnswer> = {};
  for (const item of items) {
    const v = item.values;
    const scene = v[field] ?? "";
    const label = v[body] ?? "";
    const a = v[from];
    const b = v[to];
    // 送り手と受け手を書かない item はその場面の答え。場面ごとに 1 つだけ書く (2 つ目は記法を読む所が断る)
    if (a === undefined && b === undefined) {
      answers[scene] ??= splitAnswer(label);
      continue;
    }
    rows.push({ id: item.id, scene, from: a ?? b ?? "", to: b ?? a ?? "", label, note: a === b });
  }
  const last = lastAsk(steps);
  const picked = rows.find((row) => row.id === last?.values[0])?.scene ?? last?.values[1];
  return {
    field,
    lanes: route?.paths[0] ?? [],
    scenes,
    rows,
    answers,
    chosen: picked !== undefined && scenes.includes(picked) ? picked : (scenes[0] ?? ""),
  };
}

/** 選んだ場面のやり取りを書いた順に並べ、その場面の答えを添える */
export function pickScene(
  scenes: Scenes,
  scene: string,
): { rows: SceneRow[]; answer: SceneAnswer } {
  return {
    rows: scenes.rows.filter((row) => row.scene === scene),
    answer: scenes.answers[scene] ?? { head: "", why: "" },
  };
}
