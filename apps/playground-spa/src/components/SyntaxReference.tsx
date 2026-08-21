import { useMemo } from "react";
import { DRAW_WORDS, PRESET_TYPES, TONE_ALIAS } from "@cardenelabs/dragon";
import { NODE_KINDS } from "@cardenelabs/cdl";
import { FORMS } from "@/lib/syntax-forms";
import { SyntaxInline } from "./SyntaxCode";

/**
 * 記法一覧。 editor の左に出して「何が書けるか」 を調べられるようにする。
 *
 * 受け付ける値 (図種 / 箱の種類 / 色名) は記法側の実装から引く。 手書きすると、 記法に値が
 * 増えた時に一覧だけが取り残される。 書式の例は `lib/syntax-forms.ts` が SSOT で、
 * そこに置いた例が実際に図になることを test が確かめる。
 */

export function SyntaxReference({ onInsert }: { onInsert?: (code: string) => void }): React.JSX.Element {
  // 実装が受け付ける値をそのまま並べる
  const types = useMemo(() => [...PRESET_TYPES].sort(), []);
  const kinds = useMemo(() => [...NODE_KINDS].sort(), []);
  // 段の `draw:` が受ける語。 記法の対応表 (`DRAW_TARGETS`) から引く (#1318)
  const draws = useMemo(() => [...DRAW_WORDS].sort(), []);
  const tones = useMemo(() => {
    // 別名表は「別名 → 正式名」 の対応。 正式名ごとに別名をまとめる
    const byTone = new Map<string, string[]>();
    for (const [alias, resolved] of Object.entries(TONE_ALIAS) as Array<[string, string]>) {
      const list = byTone.get(resolved) ?? [];
      if (alias !== resolved) list.push(alias);
      byTone.set(resolved, list);
    }
    return [...byTone.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  return (
    <div className="v4-editor-side-samples-body" data-testid="editor-syntax-panel">
      {FORMS.map((sec) => (
        <div key={sec.title} className="v4-editor-syntax-section">
          <div className="v4-editor-syntax-title">{sec.title}</div>
          {sec.lines.map((l) => (
            <button
              key={l.code}
              type="button"
              className="v4-editor-syntax-row"
              title={onInsert ? "クリックで入力欄の末尾に足す" : undefined}
              onClick={onInsert ? () => onInsert(l.code) : undefined}
              data-syntax-code={l.code}
            >
              {/* 色は分解器と `styles/syntax.css` が持つ (#1310) */}
              <SyntaxInline src={l.code} />
              <span className="v4-editor-syntax-note">{l.note}</span>
            </button>
          ))}
        </div>
      ))}

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">図種 ({types.length})</div>
        <div className="v4-editor-syntax-chips" data-testid="editor-syntax-types">
          {types.map((t) => (
            <code key={t} className="v4-editor-syntax-chip">{t}</code>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">箱の種類 ({kinds.length})</div>
        <div className="v4-editor-syntax-chips" data-testid="editor-syntax-kinds">
          {kinds.map((k) => (
            <code key={k} className="v4-editor-syntax-chip">{k}</code>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">起点から描ける図種 ({draws.length})</div>
        <div className="v4-editor-syntax-chips" data-testid="editor-syntax-draws">
          {draws.map((d) => (
            <code key={d} className="v4-editor-syntax-chip">{d}</code>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">色 ({tones.length})</div>
        <div className="v4-editor-syntax-tones" data-testid="editor-syntax-tones">
          {tones.map(([tone, aliases]) => (
            <div key={tone} className="v4-editor-syntax-row">
              <code className="v4-editor-syntax-code tok-色名" data-tone={tone}>{tone}</code>
              <span className="v4-editor-syntax-note">{aliases.length > 0 ? aliases.join(" / ") : "別名なし"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
