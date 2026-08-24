import type { DslDocument } from "./types";

/**
 * 図を組み立てる前に、 大きすぎる入力を止める (#1005)。
 *
 * 組み立てにかかる時間は要素数の 2 乗で伸びる。 実測 (要素だけを並べた形)。
 *
 * | 要素 | 組み立て |
 * |---|---|
 * | 1,000 | 104ms |
 * | 2,000 | 346ms |
 * | 5,000 | 1,647ms |
 * | 10,000 | 7,622ms |
 *
 * 待機 (500ms) の後に同じ流れの中で走るため、 この間 editor は操作を受け付けない。
 * 貼ってしまうと tab を閉じるまで戻らない。
 *
 * 見本 (catalog) は 1 図あたり平均 4 要素、 最も多い file でも平均 7 要素。 実用の規模と
 * 1 秒の境界 (約 3,000 要素) は桁が 2-3 つ違うため、 上限を置いても正当な図には当たらない。
 *
 * 既にある `dom-complexity-budget` (400 要素) とは別物。 あちらは組み立てた**後**に
 * 「見やすさ」 の観点で警告を出すだけで、 組み立て自体は走る。 こちらは組み立てる**前**に
 * 「固まらない」 ために止める。 400-2,000 の範囲は従来どおり警告が出て図も描ける。
 */

/** 組み立てを止める要素数。 1 秒を明確に下回る水準に置く (2,000 要素で約 350ms) */
export const MAX_INPUT_ELEMENTS = 2000;

/**
 * 組み立てを止める本文の大きさ (byte)。
 *
 * 要素数だけでは、 1 要素に極端に長い文字列を持つ形を捉えられない。 読み取り自体は速い
 * (10,000 要素 98,936 byte で 2ms) ので、 実用の余裕を大きく取って置く。
 */
export const MAX_INPUT_BYTES = 512 * 1024;

/** 数えた結果。 超過した時に何がどれだけ超えたかを画面に出すために使う */
export interface InputSize {
  elements: number;
  bytes: number;
}

/**
 * 記法の解析結果から要素数を数える。
 *
 * 数えるのは組み立ての重さに効くもの = 要素 / 流れ / 段 / 状態 / 段組み。
 * 図の題名や表示の設定は数に入れない (何件あっても重さが変わらない)。
 *
 * **段の中身 (光らせる相手 / 遷移 / 即時変更) も数える**。 段の数だけを見ると、
 * 1 段に 1,000 件の相手を書いた形が 1 件として通る。 実測ではこの形が組み立ての中で
 * 約 100 万件に展開され、 呼び出しの深さが上限を超えて落ちた。
 *
 * **他の値から決まる値 (`values:`) も数える** (#1162)。 これらは毎 frame 解かれるので、
 * 数に入れないと上限をすり抜けた本文が描画のたびに重さを持つ。
 */
export function countDocElements(doc: DslDocument): number {
  const phases = doc.animate?.phases ?? [];
  const phaseChildren = phases.reduce(
    (acc, p) => acc + (p.highlight?.length ?? 0) + (p.tweens?.length ?? 0) + (p.sets?.length ?? 0),
    0,
  );
  return (
    doc.actors.length +
    doc.flow.length +
    phases.length +
    phaseChildren +
    (doc.animate?.states.length ?? 0) +
    (doc.values?.length ?? 0) +
    // 値を見せる部品も描画時に 1 widget ずつ展開される (#1374)。 数えないと、 actors が
    // 少ないまま readouts だけを大量に並べた入力が組み立て前の上限をすり抜ける。
    (doc.readouts?.length ?? 0) +
    (doc.groups ? Object.keys(doc.groups).length : 0) +
    (doc.lanes ? Object.keys(doc.lanes).length : 0)
  );
}

/**
 * 組み立て済みの図から要素数を数える。
 *
 * 記法を通らない入口 (本文に埋め込んだ図の定義) 用。 解析結果が無いため、 図の側で数える。
 *
 * **段の中身と読み取り部品も数える**。 段を 1 件として数えるだけだと、段の中に 10,000 件の
 * 光らせる指定を持つ図が「1 要素」 と判定されて素通りする (実測)。 記法側の数え方
 * (`countDocElements`) は段の中身を足しているので、こちらも揃える。
 */
export function countDiagramElements(diagram: {
  nodes?: unknown[];
  edges?: unknown[];
  lanes?: unknown[];
  states?: unknown[];
  phases?: unknown[];
  readouts?: unknown[];
  inputs?: unknown[];
  formulas?: unknown[];
  scrollTriggers?: unknown[];
  eventBindings?: unknown[];
  derived?: unknown[];
}): number {
  const phases = Array.isArray(diagram.phases) ? diagram.phases : [];
  const phaseChildren = phases.reduce((acc: number, p) => {
    const ph = p as {
      activate?: unknown[];
      highlight?: unknown[];
      tweens?: unknown[];
      sets?: unknown[];
    };
    return (
      acc +
      (Array.isArray(ph?.activate) ? ph.activate.length : 0) +
      (Array.isArray(ph?.highlight) ? ph.highlight.length : 0) +
      (Array.isArray(ph?.tweens) ? ph.tweens.length : 0) +
      (Array.isArray(ph?.sets) ? ph.sets.length : 0)
    );
  }, 0);
  return (
    (diagram.nodes?.length ?? 0) +
    (diagram.edges?.length ?? 0) +
    (diagram.lanes?.length ?? 0) +
    (diagram.states?.length ?? 0) +
    phases.length +
    phaseChildren +
    // 図が持てる並びは全部数える。 1 つでも外すと、そこに寄せた図が素通りする
    (diagram.readouts?.length ?? 0) +
    (diagram.inputs?.length ?? 0) +
    (diagram.formulas?.length ?? 0) +
    (diagram.scrollTriggers?.length ?? 0) +
    (diagram.eventBindings?.length ?? 0) +
    // 他の値から決まる値 (#1162)。 記法側 (`countDocElements`) が数えるので、こちらも揃える
    (diagram.derived?.length ?? 0)
  );
}

/** 本文の大きさを byte で数える (文字数ではなく実際の大きさ) */
export function countBytes(src: string): number {
  // Node にも browser にもある形で数える。 `Buffer` は browser に無い
  return new TextEncoder().encode(src).length;
}

/**
 * 大きすぎる入力なら、 その旨を伝える文を返す。 収まっていれば `null`。
 *
 * 投げるのではなく文を返すのは、 呼出側が「誤りとして表示する」 か「別の扱いにする」 かを
 * 選べるようにするため。
 *
 * `bytes` に 0 を渡すと大きさの検査を飛ばす (要素数だけを見たい合流点で使う)。
 */
export function describeOversize(size: InputSize): string | null {
  if (size.elements > MAX_INPUT_ELEMENTS) {
    return `要素が ${size.elements.toLocaleString()} 件あります。 ${MAX_INPUT_ELEMENTS.toLocaleString()} 件までにしてください (これ以上は組み立てに時間がかかり、 画面が止まります)`;
  }
  if (size.bytes > MAX_INPUT_BYTES) {
    // KB の整数で出す。 MB 小数 1 桁だと、 1 byte 超えただけの時に「0.5MB / 上限 0.5MB」 と
    // 同じ数字が並び、 制限内なのに拒まれたように読める
    const kb = Math.ceil(size.bytes / 1024);
    const limitKb = Math.floor(MAX_INPUT_BYTES / 1024);
    return `本文が ${kb.toLocaleString()}KB あります。 ${limitKb.toLocaleString()}KB までにしてください (これ以上は読み取りだけで待たされ、 記憶も大きく使います)`;
  }
  return null;
}

/**
 * 本文が大きすぎるなら、 その旨を伝える文を返す。 収まっていれば `null`。
 *
 * **読み取る前に呼ぶ**。 要素数の上限は読み取った後にしか分からないため、 巨大な本文を
 * 渡された時の読み取り自体 (11.9MB で記憶 200MB) を防げない。
 */
export function describeOversizeSource(src: string): string | null {
  return describeOversize({ elements: 0, bytes: countBytes(src) });
}
