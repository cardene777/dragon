import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * YAML 欄の誤りの形と、 画面に出す時の整形 (#1007)。
 *
 * **`js-yaml` に依存しない**。 読み取りの実装 (`yaml-adapter.ts`) は YAML 欄を開いた時だけ
 * 読み込むため、 誤りの表示までその到着を待つと帯が 1 拍遅れて出る。 型と整形は軽いので
 * ここに分けて、 画面から直接読む。
 */

/**
 * 誤りの形を 1 つに揃える。 画面は `YAML parse error: line <N>: <message>` の 1 行にするので、
 * 行番号と本文の 2 つがあれば足りる。
 *
 * `reason` は js-yaml が返す短い理由をそのまま持つ (test で理由まで確かめたい時に使う)。
 * js-yaml の `mark` (行 / 列 / 抜粋) は保持しない = 画面に出す形が決まっており、
 * 使う予定のない値を持つと「使えるはず」 と読まれる。
 */
export interface YamlAdapterError {
  /** 1-origin 行番号、 parse error は YAMLException.mark.line + 1、 validation error は null */
  line: number | null;
  /** user 向け表示 message、 「YAML parse error: line <N>: ...」 の後半部分 */
  message: string;
  /** 元 error kind、 UI 側で 「parse」 vs 「validation」 で区別するのに使う */
  kind: "parse" | "validation";
  /** parse error 時の元 YAMLException reason (test / debug 用)、 validation error 時は null */
  reason: string | null;
}

/** yamlToObject 成功 = plain object、 失敗 = adapter error */
export type YamlObjectResult =
  | { ok: true; value: unknown }
  | { ok: false; error: YamlAdapterError };

/** yamlToDiagram 成功 = CdlDiagram、 失敗 = adapter error (parse / validation 両方) */
export type YamlDiagramResult =
  | { ok: true; diagram: CdlDiagram }
  | { ok: false; error: YamlAdapterError };

/**
 * preview 表示用に `YAML parse error: line <N>: <message>` の 1 行 formatting を返す。
 * `line` が null (validation error / empty source) の場合は `YAML error: <message>` に fallback。
 */
export function formatYamlError(err: YamlAdapterError): string {
  if (err.kind === "parse" && err.line !== null) {
    return `YAML parse error: line ${err.line}: ${err.message}`;
  }
  return `YAML error: ${err.message}`;
}
