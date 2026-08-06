/**
 * Text DSL parser
 * 入力: docs/cdl/text-dsl-spec.md 準拠の箇条書きテキスト
 * 出力: DslDocument AST or DslError[]
 */

import type {
  DslDocument,
  DslActor,
  DslStep,
  DslAnimate,
  DslState,
  DslPhase,
  DslError,
  PresetType,
} from "./types";
import type { NodeKind, Tone } from "@cardenelabs/cdl";
import {
  PRESET_NAMES,
  NODE_KIND_ALIAS,
  TONE_ALIAS,
  normalizeArrow,
  resolveHeader,
  resolveAnimSubkey,
  parseDuration,
} from "./keywords";

type Line = { raw: string; trimmed: string; indent: number; lineNo: number };

function indentOf(s: string): number {
  let n = 0;
  for (const c of s) {
    if (c === " ") n += 1;
    else if (c === "\t") n += 2;
    else break;
  }
  return n;
}

function splitLines(src: string): Line[] {
  return src.split("\n").map((raw, i) => {
    // # コメントを除去 (行末まで)
    const noComment = raw.replace(/\s*#.*$/, "");
    return {
      raw,
      trimmed: noComment.trim(),
      indent: indentOf(noComment),
      lineNo: i + 1,
    };
  });
}

function isBlank(l: Line): boolean {
  return l.trimmed === "";
}

/** "key: value" を split */
function splitKv(s: string): [string, string] | null {
  const idx = s.indexOf(":");
  if (idx < 0) return null;
  return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
}

/** 行の "- item (kind)" or "- item" を parse */
function parseListItem(s: string): { name: string; paren?: string } | null {
  const m = s.match(/^-\s*(.+?)(?:\s*\(\s*(.+?)\s*\))?\s*$/);
  if (!m) return null;
  return { name: m[1]!.trim(), paren: m[2]?.trim() };
}

/**
 * Parser 本体
 */
export type ParseResult = { ok: true; doc: DslDocument } | { ok: false; errors: DslError[] };

export function parseTextDsl(src: string): ParseResult {
  const lines = splitLines(src);
  const errors: DslError[] = [];

  let title: string | undefined;
  let type: PresetType | undefined;
  const actors: DslActor[] = [];
  const steps: DslStep[] = [];
  let animate: DslAnimate | undefined;

  let i = 0;
  while (i < lines.length) {
    const l = lines[i]!;
    if (isBlank(l)) { i += 1; continue; }

    // top-level header の検出 (`タイトル:` 等)
    const kv = splitKv(l.trimmed);
    if (kv && l.indent === 0) {
      const header = resolveHeader(kv[0]);
      if (header === "title") {
        title = kv[1];
        i += 1; continue;
      }
      if (header === "type") {
        if (!(PRESET_NAMES as readonly string[]).includes(kv[1].toLowerCase())) {
          errors.push({
            line: l.lineNo,
            message: `未知の種類 "${kv[1]}"`,
            hint: `次から選んでください: ${PRESET_NAMES.join(" / ")}`,
          });
        }
        type = kv[1].toLowerCase() as PresetType;
        i += 1; continue;
      }
      if (header === "actors") {
        // 次のブロック (indent > 0) を全部読む
        i += 1;
        while (i < lines.length && (lines[i]!.indent > 0 || isBlank(lines[i]!))) {
          if (!isBlank(lines[i]!)) {
            const a = parseActor(lines[i]!, errors);
            if (a) actors.push(a);
          }
          i += 1;
        }
        continue;
      }
      if (header === "flow") {
        i += 1;
        while (i < lines.length && (lines[i]!.indent > 0 || isBlank(lines[i]!))) {
          if (!isBlank(lines[i]!)) {
            const s = parseStep(lines[i]!, errors, actors);
            if (s) steps.push(s);
          }
          i += 1;
        }
        continue;
      }
      if (header === "animate") {
        const r = parseAnimate(lines, i + 1, errors);
        animate = r.anim;
        i = r.nextIndex;
        continue;
      }
    }

    // 知らない top-level 行はスキップ (warning に降格、 ignore)
    i += 1;
  }

  // 必須項目チェック
  if (!title) errors.push({ line: 1, message: "タイトル: が見つかりません", hint: "ファイル先頭に `タイトル: <名前>` を追加" });
  if (!type) errors.push({ line: 1, message: "種類: が見つかりません", hint: "ファイルに `種類: sequence` 等を追加" });
  if (actors.length === 0) errors.push({ line: 1, message: "登場人物: ブロックが空または見つかりません", hint: "`登場人物:` の下に `- 名前 (種類)` を追加" });

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    doc: {
      title: title!,
      type: type!,
      actors,
      flow: steps,
      animate,
      pos: { line: 1 },
    },
  };
}

function parseActor(l: Line, errors: DslError[]): DslActor | null {
  const item = parseListItem(l.trimmed);
  if (!item) {
    errors.push({ line: l.lineNo, message: `登場人物の書式エラー: "${l.trimmed}"`, hint: "`- 名前 (種類)` 形式で書いてください" });
    return null;
  }
  let kind: NodeKind = "actor";
  let kindWritten = false;
  if (item.paren) {
    const resolved = NODE_KIND_ALIAS[item.paren] ?? (item.paren as NodeKind);
    kind = resolved;
    kindWritten = true;
  }
  return { name: item.name, kind, kindWritten, pos: { line: l.lineNo } };
}

function parseStep(l: Line, errors: DslError[], actors: DslActor[]): DslStep | null {
  // "1. ユーザー → API: ログイン情報 (成功)"
  const m = l.trimmed.match(/^(\d+)\.\s*(.+)$/);
  if (!m) {
    errors.push({ line: l.lineNo, message: `流れの書式エラー: "${l.trimmed}"`, hint: "`番号. <from> → <to>: <ラベル>` 形式" });
    return null;
  }
  const no = parseInt(m[1]!, 10);
  const rest = normalizeArrow(m[2]!);
  // "A → B: label (tone)"
  const m2 = rest.match(/^(.+?)\s*→\s*(.+?)\s*:\s*(.+)$/);
  if (!m2) {
    errors.push({ line: l.lineNo, message: `矢印または ラベル なし: "${l.trimmed}"`, hint: "`<from> → <to>: <ラベル>` 形式" });
    return null;
  }
  const from = m2[1]!.trim();
  const to = m2[2]!.trim();
  let labelPart = m2[3]!.trim();

  // tone in () at end
  let tone: Tone | undefined;
  const toneMatch = labelPart.match(/^(.+?)\s*\(\s*(.+?)\s*\)\s*$/);
  if (toneMatch) {
    const resolved = TONE_ALIAS[toneMatch[2]!];
    if (resolved) {
      tone = resolved;
      labelPart = toneMatch[1]!.trim();
    }
  }

  // sub label syntax: "label (sub)" → label, sub の使い分けは tone と曖昧。
  // 仕様 ... 末尾 (...) は tone を優先解釈、 tone エイリアスに一致しなければ sub。
  let sub: string | undefined;
  if (!tone && toneMatch) {
    sub = toneMatch[2];
    labelPart = toneMatch[1]!.trim();
  }

  // actor 名チェック
  const names = new Set(actors.map((a) => a.name));
  if (!names.has(from)) {
    errors.push({ line: l.lineNo, message: `"${from}" が登場人物にいません`, hint: `登場人物: に "- ${from}" を追加` });
  }
  if (!names.has(to)) {
    errors.push({ line: l.lineNo, message: `"${to}" が登場人物にいません`, hint: `登場人物: に "- ${to}" を追加` });
  }

  return { no, from, to, label: labelPart, sub, tone, pos: { line: l.lineNo } };
}

type ParseAnimResult = { anim: DslAnimate; nextIndex: number };

function parseAnimate(lines: Line[], startIdx: number, errors: DslError[]): ParseAnimResult {
  const states: DslState[] = [];
  const phases: DslPhase[] = [];
  const anim: DslAnimate = { states, phases, pos: { line: startIdx + 1 } };

  let i = startIdx;
  while (i < lines.length) {
    const l = lines[i]!;
    if (isBlank(l)) { i += 1; continue; }
    // animate ブロックは indent > 0 が前提、 indent=0 なら top-level に戻る
    if (l.indent === 0) break;

    const kv = splitKv(l.trimmed);
    if (kv) {
      // kv[0] は "ステップ「送信」 1.5 秒" のような形 もあり得るので prefix 一致で resolve
      // 「ステップ」 「step」 で始まる → "step"、 それ以外は exact match
      let sub: ReturnType<typeof resolveAnimSubkey> = null;
      const head = kv[0].trim();
      if (/^(ステップ|step|STEP)/i.test(head)) sub = "step";
      else sub = resolveAnimSubkey(head);
      if (sub === "state") {
        // "状態: 残高 = 100"
        const m = kv[1].match(/^(.+?)\s*=\s*(.+)$/);
        if (!m) {
          errors.push({ line: l.lineNo, message: `状態 書式エラー: "${kv[1]}"`, hint: "`状態: <名前> = <初期値>`" });
        } else {
          const name = m[1]!.trim();
          const raw = m[2]!.trim();
          const num = parseFloat(raw);
          const initial = isNaN(num) ? raw.replace(/^["']|["']$/g, "") : num;
          states.push({ name, initial, pos: { line: l.lineNo } });
        }
        i += 1; continue;
      }
      if (sub === "step") {
        // "ステップ「送信」 1.5 秒" or "step \"submit\" 1.5s"
        // kv[0] には keyword + 「name」 + duration、 kv[1] は空 (`ステップ「送信」 1.5 秒:` の場合)
        // ただし resolveAnimSubkey は kv[0] の最初の単語 (ステップ) だけ見るので、
        // 残りは kv[0] 全体から keyword を除去して name + duration を抽出する。
        const afterKeyword = kv[0]
          .replace(/^(ステップ|step|STEP)\s*/i, "")
          .trim();
        const nameMatch = afterKeyword.match(/^[「"](.+?)[」"]\s*(.+)$/);
        if (!nameMatch) {
          errors.push({ line: l.lineNo, message: `ステップ 書式エラー: "${kv[0]}"`, hint: `\`ステップ「<名前>」 <時間>:\` 形式` });
          i += 1; continue;
        }
        const phaseName = nameMatch[1]!;
        const durStr = nameMatch[2]!.trim();
        const durMs = parseDuration(durStr);
        if (durMs === null) {
          errors.push({ line: l.lineNo, message: `時間 解釈不能: "${durStr}"`, hint: "`1.5 秒` / `1500ms` / `2s` 等" });
          i += 1; continue;
        }
        const phase: DslPhase = { name: phaseName, durationMs: durMs, pos: { line: l.lineNo } };
        // sub block を読む
        i += 1;
        const phaseBaseIndent = l.indent;
        while (i < lines.length && (lines[i]!.indent > phaseBaseIndent || isBlank(lines[i]!))) {
          if (!isBlank(lines[i]!)) {
            applyPhaseSubLine(lines[i]!, phase, errors);
          }
          i += 1;
        }
        phases.push(phase);
        continue;
      }
    }
    i += 1;
  }

  return { anim, nextIndex: i };
}

function applyPhaseSubLine(l: Line, phase: DslPhase, errors: DslError[]): void {
  const kv = splitKv(l.trimmed);
  if (!kv) return;
  const sub = resolveAnimSubkey(kv[0]);
  if (sub === "highlight") {
    phase.highlight = kv[1].split(",").map((s) => s.trim()).filter(Boolean);
    return;
  }
  if (sub === "tween") {
    // "残高: 100 → 90"
    const rest = normalizeArrow(kv[1]);
    const m = rest.match(/^(.+?)\s*:\s*([\d.]+)\s*→\s*([\d.]+)$/);
    if (!m) {
      errors.push({ line: l.lineNo, message: `遷移 書式エラー: "${kv[1]}"`, hint: "`遷移: <state>: <from> → <to>`" });
      return;
    }
    phase.tweens = phase.tweens ?? [];
    phase.tweens.push({
      state: m[1]!.trim(),
      from: parseFloat(m[2]!),
      to: parseFloat(m[3]!),
      pos: { line: l.lineNo },
    });
    return;
  }
  if (sub === "set") {
    // "ステータス: 完了"
    const m = kv[1].match(/^(.+?)\s*:\s*(.+)$/);
    if (!m) {
      errors.push({ line: l.lineNo, message: `切替 書式エラー: "${kv[1]}"`, hint: "`切替: <state>: <値>`" });
      return;
    }
    const raw = m[2]!.trim();
    const num = parseFloat(raw);
    const value = isNaN(num) ? raw : num;
    phase.sets = phase.sets ?? [];
    phase.sets.push({ state: m[1]!.trim(), value, pos: { line: l.lineNo } });
    return;
  }
  if (sub === "body") {
    phase.body = kv[1];
    return;
  }
  if (sub === "badge") {
    phase.badge = kv[1];
    return;
  }
}
