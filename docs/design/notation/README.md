# dragon 記法の意匠帳

dragon 記法で描ける図の見た目を、決めた端から 1 件ずつ貯める場所。

決めたことがどこにも残らないと、次に同じ議論をやり直すことになる。
ここに残せば、後から引けるだけでなく、engine が動いた時に食い違いを機械で見つけられる。

隣の `../app.pen` はサイトの画面を持つ file で、こことは別の軸。

## 置き方

```
docs/design/notation/
  index.html                走査して作る一覧。 手で書かない
  <群>/
    <図>/
      source.cdl.ts         その見た目を出す記法
      look.svg              決めた時の見た目
      note.md               決めたこと / 見送ったこと
```

## 名前の付け方

名前を新しく考えない。
考えると catalog との対応を人が覚えることになる。

| 階層 | 何を使うか | 例 |
|---|---|---|
| 群 | `apps/playground-spa/src/topics/catalog/` の file 名から `.cdl.ts` を落とす | `presets` |
| 図 | catalog の図の id をそのまま | `er-demo` |

catalog にまだ無い図の意匠を先に決めた時は、その名前を後から catalog 側が引き継ぐ。

## note.md の形

2 節に固定する。

| 節 | 中身 |
|---|---|
| 決めたこと | 寸法 / 余白 / 色 / 線 のうち、この図で決めた点 |
| 見送ったこと | 検討して採らなかった形と、その理由 |

見送りを残すのは、同じ議論を次にもう一度やらないため。

## 一覧を作り直す

```bash
node packages/dragon/scripts/design-index.mjs
```

`<群>/<図>/` を走査して `index.html` を書き直す。
`look.svg` を持たない dir は一覧の末尾に「集められなかった dir」 として出る。
黙って落とすと、一覧に出ないことに気付けない。

## 決め方

`/dragon-design <図の id>` が、吸い出しから納品までを通す。
手順は [`.claude/skills/dragon-design/SKILL.md`](../../../.claude/skills/dragon-design/SKILL.md) が持つ。
