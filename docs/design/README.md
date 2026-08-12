# 設計 file

## `app.pen`

画面 9 種を明暗ぶん描いた設計 file。 Pencil で開く。

配色は 28 個の色変数に集約してあり、 図の側は 3231 箇所が変数を参照する。
直書きは透明 2 箇所だけなので、 **変数を直せば図全体に届く**。

## `palette.tsv`

`app.pen` の色変数の写し。 `名前 / 明 / 暗` の 3 列 (tab 区切り)。

`.pen` は暗号化されていて検査から読めないため、 実装との一致を機械で見るために置いている。
`apps/playground-spa/tests/palette-matches-pen.spec.ts` が写しと `globals.css` を突き合わせ、
名前の集合と値の両方が一致することを見る。

**手で編集しない**。 写しが `.pen` からずれると検査が嘘をつく。

### 更新手順

配色を変えたら、 `.pen` を直してから写しを書き出し直す。

1. Pencil で `app.pen` を開く
2. MCP の `execute` で下の script を流し、 出力を得る
3. 出力を `palette.tsv` の 4 行目以降に貼る (先頭 3 行の `#!` は残す)

```js
const v = GetVariables().variables;
for (const n of Object.keys(v).sort()) {
  const d = v[n];
  if (d.type !== "color") continue;
  const m = {};
  for (const x of d.value) m[x.theme.mode] = String(x.value).toLowerCase();
  Print(`${n}\t${m.light}\t${m.dark}`);
}
```

書き出したら実装側 (`apps/playground-spa/src/styles/globals.css`) も同じ値に直す。
片方だけ直すと検査が落ちる = それが狙いで、 **どちらかが取り残される状態を検知する**。

## 設計と実装がずれた経緯 (#1124)

`globals.css` の冒頭は「値の出どころは `docs/design/app.pen` の variables」 と宣言していたが、
それを確かめる経路が無かったため 14 箇所ずれていた。

| 出どころ | 内容 |
|---|---|
| `#1112` / `#1113` | 暗い側が沈みすぎていたので面の段を付け直した (13 箇所) |
| `#1116` | 明るい側の薄い文字が暗い側と非対称だったので揃えた (1 箇所) |

どちらも user の判断で実装を動かしたもので、 `.pen` が取り残されていた。
`#1124` で `.pen` を実装に追随させ、 以後は上の検査が食い違いを検知する。

## `specs/screens.md`

設計を起こす時に使った画面の仕様。 経路 / 構成 / 文言を実測して書いたもので、 配色は持たない。
