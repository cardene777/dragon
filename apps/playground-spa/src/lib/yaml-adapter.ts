import { load, YAMLException } from "js-yaml";
import { jsonToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * CAR-1678 = YAML tab の parse pipeline bridge。
 * multi-line YAML source (`js-yaml`) を安全に load して plain object にしてから
 * dragon の `jsonToDiagram()` に流し込む。 error は parse (YAMLException) と
 * validation (jsonToDiagram の throw) の 2 段で発生し、 両方を `{ line, message }` の
 * 統一 form に mapping して呼出側 (CdlEditor preview 領域) が inline 表示できる shape で返す。
 *
 * 非目標 = anchor / merge key / multi-document YAML の対応、 CDL 独自 syntax の再現、
 * YAML → text DSL の逆変換。 いずれも本 PR 対象外 (spec § out)。
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
 * 複数行の YAML を `js-yaml` の `load()` で素の値に変換する。
 *
 * 空文字と空白だけの本文は誤り扱いにする (中身の無い図は描けない)。
 *
 * `---` で区切った複数の文書は **非対応**。 `load()` 自身が
 * `expected a single document in the stream` を投げるので、 parse の誤りとして表示される。
 * 別名参照 (anchor / merge key) は `js-yaml` の既定の挙動に任せる。
 */
export function yamlToObject(src: string): YamlObjectResult {
  const trimmed = src.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: {
        line: null,
        message: "YAML source is empty",
        kind: "validation",
        reason: null,
      },
    };
  }
  try {
    const parsed = load(src);
    if (parsed === undefined || parsed === null) {
      return {
        ok: false,
        error: {
          line: null,
          message: "YAML parsed to null / undefined, expected an object",
          kind: "validation",
          reason: null,
        },
      };
    }
    return { ok: true, value: parsed };
  } catch (e) {
    if (e instanceof YAMLException) {
      // js-yaml の mark は 0-origin、 preview 表示は 1-origin に揃える
      const rawLine = e.mark?.line;
      const line = typeof rawLine === "number" ? rawLine + 1 : null;
      // reason は「unexpected end of the stream within a single quoted scalar」 等の短文、
      // message は multi-line で mark position 含む長文になるため reason 優先で 1 行に丸める
      const reason = typeof e.reason === "string" && e.reason.length > 0 ? e.reason : e.message;
      return {
        ok: false,
        error: {
          line,
          message: reason,
          kind: "parse",
          reason,
        },
      };
    }
    return {
      ok: false,
      error: {
        line: null,
        message: e instanceof Error ? e.message : String(e),
        kind: "parse",
        reason: null,
      },
    };
  }
}

/**
 * YAML source を CdlDiagram に変換する full pipeline。 内部で `yamlToObject()` → `jsonToDiagram()` を
 * 順に呼び、 どちらの stage で error が起きても `{ ok: false, error }` で返す。
 * caller は成功時 diagram を CdlDiagramView に流し、 失敗時 error.line / message を preview 上部の
 * error banner に描画する (前回 render は消さない、 spec AC 4 の要件)。
 */
export function yamlToDiagram(
  src: string,
  opts?: { partsCatalog?: Record<string, CdlDiagram> },
): YamlDiagramResult {
  const parseResult = yamlToObject(src);
  if (!parseResult.ok) return parseResult;
  try {
    // jsonToDiagram は unknown を受けて中で形を検査する。 合わない形は throw される
    const diagram = jsonToDiagram(parseResult.value, opts);
    return { ok: true, diagram };
  } catch (e) {
    return {
      ok: false,
      error: {
        line: null,
        message: e instanceof Error ? e.message : String(e),
        kind: "validation",
        reason: null,
      },
    };
  }
}

/**
 * preview 表示用に `YAML parse error: line <N>: <message>` の 1 行 formatting を返す。
 * `line` が null (validation error / empty source) の場合は `YAML error: <message>` に fallback。
 * spec AC 4 の表示 form SSOT、 CdlEditor 側から直接 呼び出す。
 */
export function formatYamlError(err: YamlAdapterError): string {
  if (err.kind === "parse" && err.line !== null) {
    return `YAML parse error: line ${err.line}: ${err.message}`;
  }
  return `YAML error: ${err.message}`;
}
