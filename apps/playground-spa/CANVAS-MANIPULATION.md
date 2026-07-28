# canvas 直接操作 (将来の拡張として保全)

編集画面の **右側 (canvas)** を直接触って図を編集する仕組み。 一旦 release 対象から外し、
本 branch に保全する。

release に含めない判断は 2026-07-29 の user 指示による。

> このエディタで移動させるとかそういうのって本質的じゃないよね？
> 左の入力の部分で位置調整や色味指定できるのは良いが、右の方でドラックアンドドロップとか
> やりすぎな気がしてきた。

現在の release 版は **左の DSL 入力だけ**で編集する。 右は表示専用。

## この branch に入っているもの

| 機能 | 実装 |
|---|---|
| cdl 要素の選択 | click で点線の囲い、 stage-level portal で描画 |
| cdl 要素の drag 移動 | mouseup で DSL に `posX` / `posY` を書く |
| drag 中の live 追従 | 要素 / 矢印 / ラベル / 選択枠を DOM 直接操作で追従 |
| 矢印とラベルの当たり判定 | 細い線に太い透明領域を重ねる |
| 文字の編集 | double click で input、 canvas 上で直接書き換え |
| overlay parts | drop / drag / resize / rotate / 整列 / group / z-order |
| 範囲選択 | rubber band で複数 parts を選択 |
| 図全体の選択 | 図の内側 click で外周に点線 |
| 右クリックメニュー | 複製 / 削除 / 色変更 |

## 主要 file

| file | 役割 |
|---|---|
| `src/components/CdlEditor.tsx` | 操作 handler 全般 (drag / resize / 選択 / 文字編集) |
| `src/lib/cdl-actor-move.ts` | actor の移動を DSL に書く |
| `src/lib/edge-stretch.ts` | drag 中の矢印とラベルの追従 |
| `src/lib/svg-hit-area.ts` | 細い矢印 / ラベルの当たり判定を広げる |
| `src/lib/overlay-dsl.ts` | overlay parts の DSL 読み書き |
| `src/lib/overlay-align.ts` | parts の整列 |
| `src/lib/viewbox-anchor.ts` | 図枠の移動を pan で打ち消す |

## 復活させる場合に注意する点

本 branch までに踏んだ欠陥を、 同じ形で再度踏まないための記録。

**座標系の単位を混ぜない**。 client px と SVG user unit を取り違えると、 箱が 50px 動く間に
矢印が 100px 動いて突き抜ける。 変換は `worldToClient()` (= pan の拡大率 × 図の倍率) に
一本化してある。

**SVG element の `style.transform` は `transform` 属性を上書きする**。 CSS の transform は
presentation attribute より優先されるので、 元の位置指定ごと置き換わって要素が原点付近へ
飛ぶ。 属性側を書き換え、 元の値を退避する。

**矢印のラベルは矢印の `<g>` の外側にある**。 cdl の `render/edges.tsx` が
`data-cdl-edge-label-for` を持つ独立 group を出す。 矢印の中を探しても見つからない。

**drag 中は `diagram` が変わらない**。 DSL 書換は mouseup 1 回なので、 選択枠の bbox は
別 trigger で測り直さないと元の位置に取り残される。

**cdl の viewBox は内容の外接矩形に自動追従する**。 左端の要素を右へ動かすと枠の左端も右へ
寄るため、 補正しないと「動かした要素はその場、 他が左へずれる」 という逆の見え方になる。

## release 版との差分の見方

```
git diff main...experiment/canvas-direct-manipulation
```
