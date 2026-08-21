/**
 * エディタ (CodeMirror) に記法の色を当てる (#1310)。
 *
 * 見本帳やホームは `<span>` に変換するが、CodeMirror は装飾 (`Decoration`) の仕組みを持つ。
 * **分解は同じ分解器が行い**、ここは種類名を class 名に写すだけにする。
 *
 * ## 汎用 YAML 文法と併用しない
 *
 * `cdl` タブは記法なので、YAML 文法が付ける色 (鍵 / 文字列 / 数) と本装飾が重なると、
 * 同じ語に 2 つの色が当たって後勝ちになる。 記法のタブでは本装飾だけを使う。
 *
 * `yaml` タブは記法ではない別形式なので、従来どおり YAML 文法を使う。
 */
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { 記法を分解する } from "@cardenelabs/dragon";

/** 種類ごとの装飾。 色は `styles/syntax.css` が class 名に当てる */
const 装飾 = new Map<string, Decoration>();

function 装飾を引く(種類: string, 色: string | undefined): Decoration {
  const 鍵 = 色 === undefined ? 種類 : `${種類}:${色}`;
  const 既存 = 装飾.get(鍵);
  if (既存 !== undefined) return 既存;
  const d = Decoration.mark({
    class: `tok-${種類}`,
    attributes: 色 === undefined ? undefined : { "data-tone": 色 },
  });
  装飾.set(鍵, d);
  return d;
}

function 本文を装飾する(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const src = view.state.doc.toString();
  // 分解器は開始位置の昇順で重ならない並びを返すため、そのまま積める
  for (const t of 記法を分解する(src)) {
    builder.add(t.開始, t.終わり, 装飾を引く(t.種類, t.色));
  }
  return builder.finish();
}

/**
 * 記法の色分けを行う CodeMirror 拡張 (#1310)。
 *
 * 本文が変わるたびに全体を分解し直す。 記法は行単位で状態を持たないため差分更新の
 * 余地はあるが、エディタで扱う本文は数十行で、実測できる差にならない。
 */
export const 記法の色分け = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = 本文を装飾する(view);
    }

    update(u: ViewUpdate): void {
      if (u.docChanged || u.viewportChanged) this.decorations = 本文を装飾する(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);
