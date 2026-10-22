# dragon

> 動く図を、人は書きやすい記法で、AI は JSON で書く。

[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 今の形

dragon は 0.35.0 で図の書き方と描き方を根本から作り直した。
作り直しで決めたことは [#2982](https://github.com/cardene777/dragon/issues/2982) にまとめている。

今までの記法 (日本語の鍵の YAML と JSON)、`@cardenelabs/cdl` へ渡して描く仕組み、見本帳の図の一覧と編集画面、7 つの意匠は [#2983](https://github.com/cardene777/dragon/issues/2983) で消した。
`@cardenelabs/dragon` は npm で配り、見本帳は記法を書くと動く図になる頁を配る。

| 項目 | 形 |
|---|---|
| 原本 | 共通の骨格と図の種類ごとの欄を持つ JSON。版を持ち、古い版は読む時に変換する |
| 人が書く記法 | 1 行が 1 つの文になる行ごとの記法。JSON と行き来でき、書き戻す時は整えた形で出す。日本語の語でも英語の語でも書ける |
| 描く部品 | `packages/dragon` の中に持つ。cdl には頼らない |
| 描ける図 | 時系列図と構成図 |
| 書き出し | 同じ原本から mp4、GIF、HTML、PNG を書き出す命令 `dragon export` |

## 構成

```
dragon/
├── packages/
│   └── dragon/            ... 図の原本と記法と描画と書き出しの部品を持つ package
├── apps/
│   └── playground-spa/    ... 見本帳 (Vite + React 19)。記法を書くと動く図になる頁
├── test-support/          ... vitest の前処理 (dist が src より古くないかを見る)
├── eslint.config.mjs
└── tsconfig.json          ... solution-style (packages/dragon + apps/playground-spa + test-support)
```

## 開発

型の出力先が 2 つある。
束ねた 1 file (`dist/index.d.ts`、 `tsup` が出す) が package の公開型で、型検査 (`tsc -b`) の出力は `dist-types/` に分ける。
同じ場所に出すと交互に上書きし、 `package.json` の `types` が指す中身が「最後に走った側」 で決まる。

```sh
pnpm install

# 見本帳の開発 server を起動する (localhost:4323)
pnpm dev

# build
pnpm build

# 検証
pnpm verify   # typecheck + build + lint + vitest
```

### 依存の脆弱性を確かめる

`osv-scanner` が `pnpm-lock.yaml` を読んで、既知の脆弱性を持つ版が残っていないかを見る。

```sh
bash scripts/check-dependency-vulnerabilities.sh
```

**依存を上げたら毎回走らせる**。 週に 1 度の監査だけでは追いつかない = 実測で 1 週間に
112 の取り込みがあり、その間に入った新しい 2 package が次の監査まで検出されなかった (`#1642`)。

終了状態で分かれる。

| 状態 | 意味 |
|---|---|
| `0` | 検出なし (受容記録に載せた分は外れている) |
| `1` | 検出あり。 一覧が出力に出る |
| `2` | 走らせられない (`osv-scanner` が無い / 見る場所が無い) |

**`1` と `2` を分けている**。 道具が入っていないだけの時に「脆弱性が見つかった」 と
読まれると、直す先が違う方へ向かう。

**期待は 0 件**。 1 件でも出たら、まず `pnpm install` で lockfile を入れ直す。

**大半はそれで直る**。 検出は「いま脆弱」 を言うだけで、「固定が要る」 とは言っていない。
`#1528` では 41 件のうち 9 package が、入れ直すだけで安全な版に解決された。

入れ直しても残る package だけを `package.json` の `pnpm.overrides` に書く。

書いた後は **1 つずつ外して測る**。 外しても 0 件のままなら、その `overrides` は効いていない。

```sh
# その override を消して入れ直し、再走査して件数を見る
pnpm install && osv-scanner scan source -r . | grep -c '^| https'
```

効いていない `overrides` を残さないのは、`overrides` が下限であると同時に **上限** でもあるため。
上流が新しい patch を出しても、書いた版に固定され続ける。

`overrides` で上げるのは推移依存だけで、直接依存の major は上げない。
major を上げると API が変わり、上げた理由 (脆弱性) と別の理由で壊れる。

同じ package が major 違いで 2 つ入っている時は `package@major` の形で分けて書く。
まとめて 1 行にすると、片方の major に存在しない版へ倒そうとして解決が落ちる。

上げた後は `pnpm build` と `pnpm test` に加えて **`pnpm dev` も起動する**。
build が通っても開発 server だけが落ちることがある = build は rollup が束ね、開発 server は
esbuild が別に束ね直すので、変換先も別に決まる (`#1528` / `#1535` で踏んだ)。

壊れた package があれば、package 名と失敗したコマンドと理由を Issue に書いて別 Issue に
切り出す。 その package の `overrides` は書かず、残った脆弱性の CVSS を記録する。

#### 版を動かせない時は受容記録に残す

上流が版を固定していて上げられないものだけを [osv-scanner.toml](osv-scanner.toml) に書く。
記録が無いと「見落とした」 と「更新できないと決めた」 が区別できず、次の監査で同じ検出を
理由なしに繰り返すことになる。

書く 3 つ。

| 項目 | 中身 |
|---|---|
| `id` | 脆弱性の識別子 (`GHSA-...`) |
| `ignoreUntil` | 再確認の期限。 過ぎると osv-scanner が記録を無視して再び検出する |
| `reason` | 版を動かせない相手を **名指しで** 書く。 加えて、届かない経路があればそれも書く |

`reason` に名指しが要るのは、「更新できない」 という主張を読み手が裏取りできるようにするため。
`packages/dragon/test/dependency-vulnerability-check.test.ts` が、名指しした package と版が
実際に `pnpm-lock.yaml` に居ることまで見る。

期限が来たら、上流が動いたかを見る。 動いていれば更新して記録ごと消す。

### 出力する構文の範囲

`es2022` で揃えている。 指定は 2 箇所あり、**どちらも書かないと片方が既定に落ちる**。

| 経路 | 指定 | 効く先 |
|---|---|---|
| 本番 build | `build.target` | 配信する成果物 |
| 開発 server の依存 | `optimizeDeps.esbuildOptions.target` | 手元の開発 server だけ |

2 つ目を書かないと vite の既定 (`chrome87` / `edge88` / `es2020` / `firefox78` / `safari14`) が
効く。 esbuild 0.28 以降はその範囲へ分割代入を変換できず、開発 server が落ちる (`#1535`)。

**配信する成果物の範囲は `build.target` だけが決める**。 2 つ目は手元にしか出ないので、
揃えても利用者に届く範囲は変わらない。 揃えるのは、開発で通った構文が本番で落ちる形を
作らないため。

`es2022` が動く最小の版。

| ブラウザ | 版 |
|---|---|
| Chrome / Edge | 94 |
| Firefox | 93 |
| Safari | 15.4 |

## license

MIT
