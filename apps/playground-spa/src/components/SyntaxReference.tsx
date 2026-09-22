import { useMemo } from "react";
import { DIRECTION_ALIAS, DRAW_WORDS, PRESET_TYPES, TONE_ALIAS } from "@cardenelabs/dragon";
import { NODE_KINDS } from "@cardenelabs/cdl";
import { FORMS } from "@/lib/syntax-forms";
import { SyntaxInline } from "./SyntaxCode";
import { useLocale } from "@/lib/useLocale";
import { 編集画面の字 } from "@/lib/editor-text";

/**
 * 記法一覧。 editor の左に出して「何が書けるか」 を調べられるようにする。
 *
 * 受け付ける値 (図種 / 箱の種類 / 色名) は記法側の実装から引く。 手書きすると、 記法に値が
 * 増えた時に一覧だけが取り残される。 書式の例は `lib/syntax-forms.ts` が SSOT で、
 * そこに置いた例が実際に図になることを test が確かめる。
 */

/**
 * 別名表 (`別名 → 正式名`) を、正式名ごとに別名をまとめた形へ直す。
 *
 * **色と向きで 2 度書かない** (#1850)。 まとめ方を 2 つ持つと、表の向きが変わった日に
 * 片方だけ直って食い違う。 正式名そのものも鍵に入っている (引く側が別名かを気にせず
 * 1 度で解決できるようにするため) ので、別名の並びからは外す。
 */
function 正式名ごとの別名(表: Record<string, string>): [string, string[]][] {
  const 束 = new Map<string, string[]>();
  for (const [別名, 正式名] of Object.entries(表)) {
    const 並び = 束.get(正式名) ?? [];
    if (別名 !== 正式名) 並び.push(別名);
    束.set(正式名, 並び);
  }
  return [...束.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function SyntaxReference({ onInsert }: { onInsert?: (code: string) => void }): React.JSX.Element {
  const [locale] = useLocale();
  const 字 = 編集画面の字(locale);
  // 実装が受け付ける値をそのまま並べる
  const types = useMemo(() => [...PRESET_TYPES].sort(), []);
  const kinds = useMemo(() => [...NODE_KINDS].sort(), []);
  // 段の `draw:` が受ける語。 記法の対応表 (`DRAW_TARGETS`) から引く (#1318)
  const draws = useMemo(() => [...DRAW_WORDS].sort(), []);
  const tones = useMemo(() => 正式名ごとの別名(TONE_ALIAS), []);
  // 図の並ぶ向き (`direction:`) が受ける値。 色と同じく別名表から引く (#1850)
  const directions = useMemo(() => 正式名ごとの別名(DIRECTION_ALIAS), []);

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
              title={onInsert ? 字.押すと末尾に足す : undefined}
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
        <div className="v4-editor-syntax-title">{字.図種} ({types.length})</div>
        <div className="v4-editor-syntax-chips" data-testid="editor-syntax-types">
          {types.map((t) => (
            <code key={t} className="v4-editor-syntax-chip">{t}</code>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">{字.箱の種類} ({kinds.length})</div>
        <div className="v4-editor-syntax-chips" data-testid="editor-syntax-kinds">
          {kinds.map((k) => (
            <code key={k} className="v4-editor-syntax-chip">{k}</code>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">{字.起点から描ける図種} ({draws.length})</div>
        <div className="v4-editor-syntax-chips" data-testid="editor-syntax-draws">
          {draws.map((d) => (
            <code key={d} className="v4-editor-syntax-chip">{d}</code>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">{字.色} ({tones.length})</div>
        <div className="v4-editor-syntax-tones" data-testid="editor-syntax-tones">
          {tones.map(([tone, aliases]) => (
            <div key={tone} className="v4-editor-syntax-row">
              <code className="v4-editor-syntax-code tok-色名" data-tone={tone}>{tone}</code>
              <span className="v4-editor-syntax-note">{aliases.length > 0 ? aliases.join(" / ") : 字.別名なし}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="v4-editor-syntax-section">
        <div className="v4-editor-syntax-title">{字.向き} ({directions.length})</div>
        <div className="v4-editor-syntax-tones" data-testid="editor-syntax-directions">
          {directions.map(([dir, aliases]) => (
            <div key={dir} className="v4-editor-syntax-row">
              <code className="v4-editor-syntax-code" data-direction={dir}>{dir}</code>
              <span className="v4-editor-syntax-note">{aliases.length > 0 ? aliases.join(" / ") : 字.別名なし}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
