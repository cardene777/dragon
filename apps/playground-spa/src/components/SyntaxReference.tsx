import { useMemo } from "react";
import { PRESET_TYPES, TONE_ALIAS } from "@cardenelabs/dragon";
import { NODE_KINDS } from "@cardenelabs/cdl";

/**
 * 記法一覧。 editor の左に出して「何が書けるか」 を調べられるようにする。
 *
 * 受け付ける値 (図種 / 箱の種類 / 色名) は記法側の実装から引く。 手書きすると、 記法に値が
 * 増えた時に一覧だけが取り残される。 書式の例だけはここに持つ (実装から生成できないため)。
 */

type Section = {
  title: string;
  lines: Array<{ code: string; note: string }>;
};

/** 書式の例。 実際に動く記述だけを載せる。 */
const FORMS: Section[] = [
  {
    title: "全体",
    lines: [
      { code: 'title: "ログイン"', note: "図の題名" },
      { code: "type: sequence", note: "図種。 一覧は下" },
    ],
  },
  {
    title: "登場人物",
    lines: [
      { code: "  - Client", note: "名前だけ" },
      { code: "  - API: service", note: "名前と種類" },
      { code: "  - DB: database 失敗", note: "名前と種類と色" },
      { code: "  - 決済: 警告", note: "色だけ" },
      { code: '  - Web: { kind: service, subtitle: "本体" }', note: "細かく指定する時" },
    ],
  },
  {
    title: "流れ",
    lines: [
      { code: '  - Client -> API: "要求"', note: "矢印と説明" },
      { code: '  - API -> DB: "検索" (成功)', note: "矢印の色" },
      { code: '  - DB -> API: "結果" (dotted-flow)', note: "点線" },
    ],
  },
  {
    title: "動き (図種により必須)",
    lines: [
      { code: '  - step: "呼ぶ" 1.4s', note: "1 段の長さ" },
      { code: "    focus: [Client, API]", note: "その段で光らせる" },
    ],
  },
  {
    title: "大きさと位置",
    lines: [
      { code: "  - Web: { kind: service, w: 400 }", note: "幅 (高さは h)" },
      { code: "  - Web: { kind: service, posX: 300, posY: 200 }", note: "位置を固定 (両方必要)" },
      { code: "viewport: { scale: 1.5 }", note: "図全体の倍率" },
    ],
  },
];

export function SyntaxReference({ onInsert }: { onInsert?: (code: string) => void }): React.JSX.Element {
  // 実装が受け付ける値をそのまま並べる
  const types = useMemo(() => [...PRESET_TYPES].sort(), []);
  const kinds = useMemo(() => [...NODE_KINDS].sort(), []);
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
              <code className="v4-editor-syntax-code">{l.code}</code>
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
        <div className="v4-editor-syntax-title">色 ({tones.length})</div>
        <div className="v4-editor-syntax-tones" data-testid="editor-syntax-tones">
          {tones.map(([tone, aliases]) => (
            <div key={tone} className="v4-editor-syntax-row">
              <code className="v4-editor-syntax-code">{tone}</code>
              <span className="v4-editor-syntax-note">{aliases.length > 0 ? aliases.join(" / ") : "別名なし"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
