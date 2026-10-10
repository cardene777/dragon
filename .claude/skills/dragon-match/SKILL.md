---
name: dragon-match
description: 正解の静的 HTML と作った図を 1 図ずつ機械で測り、崩れと見た目を 3 回まで自己確認する skill。 見本帳の図を見本へ合わせる時と、正解を握った新しい図を仕上げる時に使う。
---

# dragon-match — 正解の図と作った図を測って比べる

## 位置付け

図を直した後の確認を、目で読むだけにしない。
正解と作った図から同じ字を探し、字と箱の計算後の値を比べる。
線と字を持たない図形は、色と太さごとの本数を比べる。

本 skill は 1 図ずつ確認する。
全ての図をまとめて直してから長い検査を回すための skill ではない。

## 起動 trigger

正解の頁が決まり、作った図をそこへ合わせる時に使う。

```text
/dragon-match <図の名>
```

引数は結果の置き場に使える短い図の名にする。

## 前提

- 起動 dir は dragon repo root。
- 正解の頁は手元の静的 HTML である。
- 作った図は静的 HTML または見本帳の図である。
- 正解の頁の path、見本帳の図の名前、比べる意匠の一覧が決まっている。

## 段取り

4 段ある。

### 1. 正解を受け取る

正解の頁の path と図を指す CSS selector を受け取る。
selector が無ければ `body` を使う。

作った図が見本帳にある時は、見本帳の base URL、頁の名前、図の名前、意匠の英名を受け取る。
頁の名前は `charts` や `flows` のような catalog の頁名である。
図の名前は一覧の札に出る字か、札の `data-item-id` である。
記法を書き出す時の変数名など、画面に無い名前は使わない。

意匠は順序を持つ一覧として受け取る。
以後の測定と撮影は、この順序を変えない。

正解の頁を作ることと、その頁が正解であると user と握ることは呼ぶ側が持つ。
この段で正解を作り直したり、別案を選んだりしない。

### 2. 自己確認

丸ごとの設定を `.context/match/<図の名>/match.json` に書く。

```json
{
  "comparisons": [
    {
      "label": "図面",
      "expected": {
        "type": "html",
        "path": "docs/design/proposal/static/階層-図面.html",
        "selector": ".fig"
      },
      "actual": {
        "type": "catalog",
        "baseUrl": "<見本帳の base URL>",
        "page": "charts",
        "name": "営業所の階層図",
        "palette": "blueprint"
      }
    }
  ]
}
```

両側とも `html` と `catalog` のどちらでもよい。
静的 HTML は `path` と任意の `selector` を持つ。
見本帳は `baseUrl`、`page`、`name`、`palette` を持つ。

各側には任意で `region` と `ignoreTexts` を書ける。
`region` はその側の図の root 座標で、中心が範囲内にある字・箱・線だけを測り、撮影もその範囲で切り取る。
`ignoreTexts` は測定にも字の有無にも出さない字の配列である。

```json
{
  "expected": {
    "type": "html",
    "path": "docs/design/proposal/static/階層-図面.html",
    "selector": ".fig",
    "region": { "x": 0, "y": 0, "width": 1800, "height": 500 },
    "ignoreTexts": ["tree · 階層図"]
  },
  "actual": {
    "type": "catalog",
    "baseUrl": "<見本帳の base URL>",
    "page": "charts",
    "name": "営業所の階層図",
    "palette": "blueprint"
  }
}
```

階層の見本では、上半分の階層図を `region` の `y: 0, height: 500`、下半分のマインドマップを `y: 500` からの範囲に分ける。
見本だけにある区切りの札は、各側の `ignoreTexts` に書く。

round は 1 から始める。
次の 2 つを同じ出力 dir に対して走らせる。

```bash
node .claude/skills/dragon-match/scripts/measure.mjs \
  .context/match/<図の名>/match.json \
  -o .context/match/<図の名>/round-<N>

node .claude/skills/dragon-match/scripts/shoot.mjs \
  .context/match/<図の名>/match.json \
  -o .context/match/<図の名>/round-<N>
```

測る道具は字と箱の違い、線の本数の違い、測れない所、cdl 待ち、崩れを一度に調べる。
崩れは箱どうしの重なり、字のはみ出し、図の枠の外の 3 種である。

撮る道具は `expected.png` と `actual.png` を device scale factor 2 で作る。
複数意匠は設定の順に縦へ並び、両方の各段の上へ同じ和名の札が付く。
正解と作った図は root 座標の 1 単位を同じ px にして並べる。
`region` があれば、その範囲だけを同じ物差しで並べる。
加えて `parts/` の下へ、意匠ごとの組を `expected-<英名>.png` と `actual-<英名>.png` で作る。
見本帳の意匠は `palette` の英名を使い、英名の無い静的 HTML は札の字を使う。
意匠ごとの組も、全体の 2 枚と同じ物差しで撮る。

`parts/` の意匠ごとの組と `diffs.md` を `dragon-diagram-reviewer` 1 つへ渡す。
縦に連結した 2 枚は縮小表示を避けるため採点役へ渡さず、段 4 で user に見せる時だけ使う。
採点役には次の形で頼む。

```text
意匠ごとの expected / actual の組と diffs.md を照合してください。
見るのは次の 2 つだけです。
1. 機械では測れない見た目の崩れ: 影・光・枠の質感・余白の釣り合い・目立ち方・見本に無い飾り
2. 表に出た違いのうち、絵で見て重いもの
ignoreTexts で外した字: <設定にある字を側ごとに列挙>。これらが無いことは指摘に数えないでください。
返答は 600 字以内で、最初に High / Medium / Low の件数、次に指摘ごとに
[High|Medium|Low] 意匠 — 何が見本とどう違うか
の 1 行、最後に「合格条件: High が 0」を満たすかを書いてください。file は書かず、この返答だけを返してください。
```

1 回の自己確認は 10 分以内に収める。
見本帳の階層図を 7 意匠で確認した実測は、測る 17 秒、撮る 19 秒、採点役 115 秒、合わせて約 2 分 31 秒である。
最後に実際の開始時刻、終了時刻、所要時間を round の記録へ残す。

合格の条件は 3 つ全てを満たすことである。

1. `result.json` の測った違いが 0 件である。
2. `result.json` の崩れが 0 件である。
3. `dragon-diagram-reviewer` の High が 0 件である。

組にした箱の幅の比の中央値を、作った図 / 正解の「全体の倍率」とする。
倍率が 1 から 1% を超えて離れた時は、全体の倍率 1 件を違いにする。
位置・大きさ・字の大きさ・線の太さ・枠の太さは、原点の差を引き、全体の倍率で割ってから比べる。
位置と大きさは差 2 まで、字の大きさは差 0.25 まで、線と枠の太さは差 0.1 までを許す。倍率が 1 の時も同じ許容幅を使う。
色、字の太さ、書体は一致を求める。
書体は CSS の候補の並びではなく、CDP が返す `familyName` のうち実際に最も多くの字形を描いた名前を使う。末尾の太さの名前 (`Thin` / `ExtraLight` / `Light` / `Regular` / `Medium` / `SemiBold` / `Bold` / `ExtraBold` / `Black` / `Heavy`) を外してから比べ、外す前の名前も JSON に残す。取得できなければ測れない所へ残し、CSS の候補は JSON の参考値として残す。
`path` の線は `d` の `M` / `m` ごとに 1 本として数え、`line` と `polyline` は要素ごとに 1 本として数える。枠の色と太さの組ごとの本数を比べる。
字を囲む一番小さい箱ではなく、他の字の箱とも中心と大きさが近くない図形は「字を持たない図形」として数える。
字を持たない図形は地の色・枠の色・枠の太さごとに本数を比べる。
地は「一色」「線形の階調」「他の階調」「模様」の塗り方も比べる。片側だけが階調か模様なら「地の塗り方」の違いにする。
両側が線形の階調なら、CSS の `linear-gradient(...)` は最初と最後の色、SVG の `linearGradient` は最初と最後の `stop` の色を `stop-opacity` 込みで比べる。向きは違いに数えず、JSON の参考値に残す。
円の階調、模様、読めない地を両側で比べる場合は、測れない所として表へ残し、違いにも一致にも数えない。

### 3. 直す

合格せず、round が 3 より小さい時だけ直す。

`diffs.md` と採点役の High と、直す対象の file を `codex-runner` へ渡す。
直す内容は `codex-runner` が決めて実装する。
main session は図を直さない。

直しが終わったら round を 1 増やし、段 2 へ戻る。
自己確認は最大 3 回で止める。

### 4. 見せる

合格した時、または 3 回目でも合格しなかった時に user へ見せる。

チャットへ正解の `expected.png` と作った図の `actual.png` を 1 枚ずつ貼る。
続けて `diffs.md` の表を貼る。
`diffs.md` の冒頭には、意匠ごとの違い・測れない・cdl 待ち・崩れの件数と、項目ごとの違いの件数を意匠の列で並べた 2 つのまとめを置く。その後に意匠ごとの細かい表を置く。
表には正解の値、今の値、cdl 待ちか、測れないかを残す。

機械の合格は user の判断を代わりに行うものではない。
最後の合否は user が決める。

## cdl 待ち

dragon 側では直せず cdl の変更を待つ差は `.context/match/<図の名>/cdl-wait.json` に書く。
file は項目の配列にする。

```json
[
  {
    "字": "東京",
    "項目": "箱.幅",
    "理由": "dragon 側から箱の内幅を指定できない",
    "cdl の課題": "課題番号または手元の識別子"
  }
]
```

同じ字が複数の意匠にあり、一部だけ待つ時は `意匠` も書く。
`項目` は `diffs.md` に出た字をそのまま写す。

cdl 待ちは違いの件数から外す。
ただし表から消さず、判定を「cdl 待ち」にして理由と cdl の課題を残す。

## 結果の置き場

1 回分を `.context/match/<図の名>/round-<N>/` に置く。

| file | 中身 |
|---|---|
| `result.json` | 違い、測れない所、cdl 待ち、全体の倍率、原点の差、補正前の測定値、崩れ、件数 |
| `diffs.md` | user と採点役へ見せる違いの表 |
| `expected.png` | 正解の絵 |
| `actual.png` | 作った図の絵 |
| `parts/expected-<英名>.png` | 採点役へ渡す意匠ごとの正解の絵 |
| `parts/actual-<英名>.png` | 採点役へ渡す意匠ごとの作った図の絵 |

設定は `.context/match/<図の名>/match.json` に置く。
cdl 待ちは `.context/match/<図の名>/cdl-wait.json` に置く。

## 完成形の定義

1 図につき、最大 3 round の機械測定と崩れ検査と採点を終えている。
各 round は同じ意匠順の正解と作った図、機械可読な結果、読める表を持つ。

合格した時は 3 条件を満たした round を user へ見せる。
3 回で合格しなかった時は、残った違いを隠さず 3 回目の成果物を user へ見せる。

## 統合先 skill

| 関係 | skill | 何を渡すか |
|---|---|---|
| 上流 | `dragon-diagram` | 正解の頁の path、作った図の名前、意匠の一覧 |
| 上流 | 見本帳の図を見本に合わせる作業 | 静的な見本、見本帳の頁と図の名前、意匠の一覧 |
| 下流 | `dragon-diagram-reviewer` | 意匠ごとの正解と作った図の組、違いの表、`ignoreTexts` |
| 下流 | `codex-runner` | 残った違いの表、High、直す対象の file |

## 責務外

- 正解の頁を作ることと user と正解を握ることは呼ぶ側が持つ。
- 候補を並べて選んでもらうことは `dragon-propose` が持つ。
- 画面の検査の全件と `/verify` は、全ての図が合格した後に呼ぶ側が 1 回行う。
- 直す中身を決めて書くことは `codex-runner` が持つ。
- 線の曲がり方や通り道の突き合わせは行わない。
