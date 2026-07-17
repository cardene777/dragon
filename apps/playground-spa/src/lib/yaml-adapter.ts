import { load, YAMLException } from "js-yaml";
import { jsonToDiagram, type DragonJson } from "@cardenelabs/dragon";
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
 * 統一 error shape = preview 領域で `YAML parse error: line <N>: <message>` として表示するために
 * `line` と `message` の 2 field を最低限保持する。 `mark` field は js-yaml YAMLException の元 mark を
 * そのまま渡す (追加 test で reason / column を assert する時に便利)。
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
 * multi-line YAML source を `js-yaml.load()` で plain object に変換する。
 * 空文字列 / whitespace 単独は `{ ok: false, error: validation }` として扱う (空 diagram は render 不能)。
 * multi-document YAML (`---` 区切り複数 doc) は最初の 1 doc のみを対象、 anchor / merge key は
 * js-yaml default 挙動を尊重するが本 PR で追加 spec は書かない (spec § out)。
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
    // jsonToDiagram は DragonJson shape を期待、 unknown object の shape 不一致は validation error として throw
    const diagram = jsonToDiagram(parseResult.value as DragonJson, opts);
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
