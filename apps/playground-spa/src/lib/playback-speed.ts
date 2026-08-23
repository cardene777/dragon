import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 見本帳の図の再生速度 (#1355)。
 *
 * 見ている図と、コードタブに出ている記法の **両方に同じ倍率を掛ける**。 別々に計算すると
 * 片方だけ直した時にずれ、写したコードが画面と違う速さで動く。
 *
 * 倍率は「速さ」 で持つ = `2` が 2 倍速。 段の長さはその逆数を掛ける (2 倍速なら半分の長さ)。
 */

/** 画面に出す倍率。 並び順がそのまま押しボタンの並びになる */
export const 速さの選択肢 = [0.5, 1, 2] as const;

export type 速さ = (typeof 速さの選択肢)[number];

/** 既定の速さ。 見本の source に書いた秒数がそのまま出る */
export const 既定の速さ: 速さ = 1;

/**
 * 段の長さに掛ける倍率。
 *
 * 0 と負と NaN は受けない = 掛けると段が消えるか時間が逆走する。 呼出側は選択肢からしか
 * 渡さないが、外から来た値でも壊れない形にしておく。
 */
function 長さの倍率(速さ: number): number {
  if (!Number.isFinite(速さ) || 速さ <= 0) return 1;
  return 1 / 速さ;
}

/**
 * 図の段の長さに倍率を掛ける。
 *
 * **1 倍の時は元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、既定で見ている図が切替えのたびに最初へ戻る。
 */
export function 図の速さを変える(diagram: CdlDiagram, 速さ: number): CdlDiagram {
  const 倍率 = 長さの倍率(速さ);
  if (倍率 === 1) return diagram;
  return {
    ...diagram,
    phases: diagram.phases.map((p) => ({ ...p, duration: Math.round(p.duration * 倍率) })),
  };
}

/** 秒数を書く時の形。 `2.4` は `2.4`、`4.8` は `4.8`、`2` は `2` にする (末尾の 0 を残さない) */
function 秒を書く(v: number): string {
  return String(Number(v.toFixed(3)));
}

/**
 * 記法 (YAML) の段の秒数に倍率を掛ける。
 *
 * 対象は段の見出しに付く秒数だけ (`- step: "計画" 2.4s`)。 本文中に出る他の数は触らない =
 * 状態の初期値や説明の数字まで動かすと、図が別物になる。
 */
function yamlの速さを変える(source: string, 倍率: number): string {
  // **行末の空白に `\s` を使わない**。 `\s` は改行にも当たるため、置換で行の区切りごと
  // 食われて次の行と繋がる (実測 = 末尾の改行が消えた)。 行内の空白だけを見る
  return source.replace(
    /^([ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+)(\d+(?:\.\d+)?)s[ \t]*$/gm,
    (_all, 前, 秒: string) => `${前}${秒を書く(Number(秒) * 倍率)}s`,
  );
}

/**
 * 記法 (JSON) の段の秒数に倍率を掛ける。
 *
 * 対象は `"duration"` の値だけ。 JSON はコメントを書けないため、速さは数字そのものに出す
 * しかない (本 Issue で「反映する」 を選んだ理由の 1 つ)。
 */
function jsonの速さを変える(source: string, 倍率: number): string {
  return source.replace(
    /("duration"\s*:\s*)(\d+(?:\.\d+)?)/g,
    (_all, 前: string, 秒: string) => `${前}${秒を書く(Number(秒) * 倍率)}`,
  );
}

/** 記法の種別。 秒数の書き方が違うので分けて扱う */
export type 記法の種別 = "yaml" | "json";

/**
 * 記法の秒数に倍率を掛ける。
 *
 * **1 倍の時は元の文字列をそのまま返す**。 置換を通すと、たとえ結果が同じでも「触った」 形に
 * なり、書き換えの誤りが既定の表示で見つからなくなる。
 */
export function 記法の速さを変える(source: string, 速さ: number, 種別: 記法の種別): string {
  const 倍率 = 長さの倍率(速さ);
  if (倍率 === 1) return source;
  return 種別 === "yaml" ? yamlの速さを変える(source, 倍率) : jsonの速さを変える(source, 倍率);
}
