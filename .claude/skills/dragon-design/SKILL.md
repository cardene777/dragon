---
name: dragon-design
description: dragon 記法で描ける図 1 つの見た目を artifact で詰め、固まった形を docs/design/notation/ に一覧として納める skill。 段ごとの SVG と明暗の色変数を dev server から吸い出し、明暗を並べて自動再生する頁を組んで user と往復する。 決まったら記法 / 見た目 / 決めたこと の 3 file を repo に置き、一覧を作り直す。 トリガー — 「意匠を決めたい」「この図の見た目を詰めたい」「figure の意匠帳に納めたい」「明暗を並べて見たい」 等の自然文依頼、 `/dragon-design <図の id>` 明示起動。
---

# dragon-design — 図の見た目を決めて残す

## 位置付け

図の見た目は決めた端から消える。
決めた覚えがあっても、どの値でなぜそうしたかを引ける場所が無いと、次に同じ議論をやり直すことになる。

本 skill は詰める場 (artifact) と残す場 (repo) を繋ぐ。
残す形に記法を含めるので、engine が動いた時に食い違いを機械で見つけられる。

## 起動 trigger

user 明示起動のみ。

```
/dragon-design er-demo
/dragon-design shape-file
```

引数は catalog の図の id。
無ければ AskUserQuestion で聞く。

## 前提

- 起動 dir = dragon repo root
- dev server 起動中 (`pnpm dev` → `http://localhost:4323`)
- 対象の id が catalog のどれかの `*.cdl.ts` に存在する

## 完成形の定義

出力は 2 つある。

1 つは詰めるための頁 `.context/design/<図>/look.html`。
明暗 2 面 / 段の自動再生 / 実測した寸法 / 使っている色 / 記法 を持ち、そのまま Artifact に publish する。

図を押すと覆いが開き、その面のまま画面いっぱいで見られる。
覆いの中の図も段の書き換え先に入るので、開いている間も止まらない。

もう 1 つは納める entry `docs/design/notation/<群>/<図>/`。
`source.cdl.ts` (記法) と `look.svg` (決めた時の見た目) と `note.md` (決めたこと / 見送ったこと) の 3 file で、
併せて `docs/design/notation/index.html` を作り直す。

## 統合先 skill

上流は `/dragon-diagram` で、図そのものを作る。
本 skill はその図の見た目を決めて残す。
下流は `/dragon-review` で、出来た図を採点する。

既に catalog にある図の意匠を決め直す時は、上流を経由せず単体で起動する。

## 責務外

cdl の実装は直さない。
値を決めて記録するところまでが範囲で、engine 側を合わせるのは別の作業になる。

catalog への図の追加もしない。
まだ catalog に無い図の意匠を先に決めた時は、その名前を後から catalog 側が引き継ぐ。

図の中身 (何を描くか) の考案もしない。
扱うのは既にある図の見た目だけで、題材を決めるのは `/dragon-diagram` の役割。

## 手順

### Step 1. 吸い出す

```bash
node apps/playground-spa/scripts/design-export.mjs <図の id>
```

dev server を開いて段ごとの SVG と `:root` の色変数を控え、`.context/design/<図>/` に置く。
群は catalog の file 名から取るので、引数は id だけでよい。

段が 1 つも取れなかった時は止まる。
dev server が動いているか、id が一覧に出ているかを確かめてから やり直す。

### Step 2. 頁を出す

`.context/design/<図>/look.html` を Artifact で publish する。
題名は図の id に揃える = session を跨いだ時、その名前で引き戻せる。

publish の前に `artifact-design` skill を読む。

**生かすのは 1 枚だけ**。
いま詰めている図の artifact を 1 枚持ち、別の図に移る前に前の図のものを捨てる。

artifact は作業台で、記録の場所ではない。
URL は repo に書けず (外部 link 禁止)、消えることがあり、群でも名前でも並ばない。
図は catalog に 280 件あるので、1 図 1 枚を残していくと探せなくなる。

### Step 3. 往復する

user の指示で直す時は、直す先を間違えない。

| 直す対象 | どこを直すか |
|---|---|
| 図そのもの (寸法 / 色 / 線) | cdl か catalog を直し、Step 1 からやり直す |
| 頁の見せ方 | `design-export.mjs` の組み立て部分を直す |

同じ file path で publish し直せば URL は変わらない。

### Step 4. 納める

固まったら 3 file を置く。

```bash
mkdir -p docs/design/notation/<群>/<図>
cp .context/design/<図>/phase-<最後>-<段>.svg docs/design/notation/<群>/<図>/look.svg
cp .context/design/<図>/source.cdl.ts        docs/design/notation/<群>/<図>/source.cdl.ts
```

納め終えたら、その図の artifact は捨てる。
中身は 3 file と一覧に入っているので、消えても失うものは無い。

`note.md` は会話から書く。
artifact に打ち込む欄は置かない = 決めたことは往復の中に出ているので、user に二度書かせない。

先頭に決めた日を書く。 一覧がこれを読み、いつの記録かを card に出す (#1538)。

```yaml
---
decided: 2026-08-30
---
```

**file の更新日は使わない**。 綴りの直しや別の図の作業でも動くので、「いつ決めたか」 を
表さない。 書き手が書いた値だけを見る。

節は 2 つに固定する。

| 節 | 中身 |
|---|---|
| 決めたこと | 寸法 / 余白 / 色 / 線 のうち、この図で決めた点 |
| 見送ったこと | 検討して採らなかった形と、その理由 |

寸法は `.context/design/<図>/meta.json` の `spec` に実測値が入っている。
宣言値ではなく実際に描かれた値なので、そのまま写す。

**行は図ごとに違う**。 表は図に在る役割から組むので、箱で組む図には箱の行が出て、
時系列の図には縦線と帯の行が出る (#1540)。 出ていない行は「その図が持たない」 を意味する。

値が `測れなかった (N 件)` の行は写さない。 それは決めた値ではなく、測り方が届かなかった印で、
`note.md` に書くと「決めた」 ことになってしまう。 出ていたら測る側 (`design-export.mjs`) を直す。

`18 (6 件中 5 件で測れた)` のように母数が添う行は、値だけを写す。
一部が測れないのは、その形が角や太さを持たないため = 図の意匠としては 1 つの値で決まっている。

**色は変数の名前で書く**。 16 進の値を書くと、engine の配色を変えた時にそこだけ古い値が残る。
`#1531` で茶墨に変えた時、`er-demo` の `note.md` に書いてあった 4 値が全て古くなった。

変数の名前 (`--d-surface` / `--d-bg` 等) なら、指す先が変わっても記述は正しいまま。
値そのものは `apps/playground-spa/src/styles/globals.css` を見る。

寸法は逆で、実測値をそのまま書く = 寸法は図ごとに決めた値で、変数を共有していない。

### Step 5. 一覧を作り直す

```bash
node packages/dragon/scripts/design-index.mjs
```

`look.svg` を持たない dir は一覧の末尾に「集められなかった dir」 として出る。
出ていたら納め損ねているので、Step 4 に戻る。

### Step 6. 検査を通す

```bash
pnpm vitest run design-index
```

## 段の動きを差し替えで作らない

段は SVG を丸ごと差し替えるのではなく、1 本の SVG の変わった属性だけを書き換えて送る。

engine は `transition` を要素の inline style に持たせている
(箱が `opacity 120ms` と `transform 200ms`、線が `stroke 280ms` と `stroke-width 280ms`)。
差し替えるとその宣言ごと捨てるので、動かずに切り替わるだけになる。

書き換えの対応付けは `data-cdl-node` / `data-cdl-role` / `data-cdl-row-index` で行う。
`design-export.mjs` が組む頁が既にこの形になっているので、頁の見せ方を直す時に壊さない。

## 名前を新しく考えない

| 階層 | 何を使うか | 例 |
|---|---|---|
| 群 | catalog の file 名から `.cdl.ts` を落とす | `presets` |
| 図 | catalog の図の id をそのまま | `er-demo` |

考えると catalog との対応を人が覚えることになる。
置き方の詳細は [`docs/design/notation/README.md`](../../../docs/design/notation/README.md) が持つ。
