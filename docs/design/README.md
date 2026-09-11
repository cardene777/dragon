# 設計 file

## `app.pen`

画面 9 種を明暗ぶん描いた設計 file。 Pencil で開く。

配色は色変数に集約してあり、 図の側はその変数を参照する。 直書きで残るのは透明だけなので、
**変数を直せば図全体に届く**。

変数がいくつあるか、 どれだけの箇所が参照しているかは `.pen` を JSON として読んで数える
(§ 変数を読む)。 ここに数を書き写すと、 変数を 1 つ足した日から古くなる。

中身は素の UTF-8 JSON で、 `JSON.parse` がそのまま通る。 検査もこれを直接読む。

### 配色を変える時

`.pen` と実装 (`apps/playground-spa/src/styles/globals.css`) の両方を同じ値に直す。

片方だけ直すと `apps/playground-spa/tests/palette-matches-pen.spec.ts` が落ちる。
それが狙いで、 **どちらかが取り残される状態を検知する**。

検査は 2 点を見る。

| 見るもの | 落ちる形 |
|---|---|
| 名前の集合が両側で同じ | 片方にだけ変数を足した |
| 明暗の値が一致 | 片方だけ色を変えた |

`.pen` を Pencil で編集した後は **保存 (Cmd+S) が要る**。 MCP の `execute` は editor 上の
状態を変えるだけで、 disk には書かない。

### 変数を読む

Pencil を開かずに現在の配色を見たい時は、 `.pen` を JSON として読む。

```bash
node -e "const v=JSON.parse(require('fs').readFileSync('docs/design/app.pen','utf8')).variables;
for (const [n,d] of Object.entries(v)) if (d.type==='color')
  console.log(n, d.value.map(x=>x.theme.mode+'='+x.value).join(' '));"
```

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
