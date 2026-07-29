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

/**
 * 書式の例。 実際に動く記述だけを載せる。
 *
 * 値は空白で並べる。 `{ }` も `( )` も要らない。 引用符付きは補足、 角括弧は行、 色名は色、
 * 残りが種類として読まれる。 形が違うので順番は自由。
 */
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
      { code: "  - API: service", note: "種類" },
      { code: '  - Web: service "APIサーバー"', note: "種類と補足" },
      { code: "  - DB: database 失敗", note: "種類と色" },
      { code: '  - LB: cloud "振り分け" 警告', note: "並べる順番は自由" },
      { code: "  - 決済: 失敗", note: "色だけ" },
      { code: '  - 表: storage ["id: PK", "name: 文字列"]', note: "行を持つ箱" },
      { code: "  - 保存: s3", note: "固有名でも書ける (storage になる)" },
    ],
  },
  {
    title: "項目が多い時",
    lines: [
      { code: "  - Web:", note: "名前だけ書いて改行" },
      { code: "      kind: service", note: "項目を縦に並べる" },
      { code: '      補足: "APIサーバー"', note: "日本語の項目名でもよい" },
      { code: "      色: 失敗", note: "色は 色: にまとめた" },
    ],
  },
  {
    title: "パーツ",
    lines: [
      { code: "  - 時計: alarm-clock", note: "パーツの名前を種類に書く" },
      { code: "  - 実績:", note: "変えられる値があれば縦に並ぶ" },
      { code: "      kind: achievement", note: "" },
      { code: '      色: "#f59e0b"', note: "色を変えたい時はここを書き換える" },
    ],
  },
  {
    title: "流れ",
    lines: [
      { code: '  - Client -> API: "要求"', note: "矢印と説明" },
      { code: '  - API -> DB: "検索" 成功', note: "矢印の色" },
      { code: '  - DB -> API: "結果" 成功 dotted-flow', note: "色と線の種類" },
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
    title: "図全体",
    lines: [
      { code: "viewport: { scale: 1.5 }", note: "図全体の倍率" },
      { code: "viewport: { laneWidth: 400 }", note: "縦列の幅" },
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
