---
name: dragon-diagram
description: 題材を分けて考え、正解の頁と合わせる一覧を user と握ってから、dragon 記法で animated diagram を作る skill。
---

# dragon-diagram — 正解を先に握って animated diagram を作る

## 位置付け

dragon repo の animation catalog に、題材固有の意味を持つ composite exemplar を追加する。

既存 parts を優先し、登録簿のどれとも異なる shape kind または metaphor が要る時だけ新規 parts を検討する。

作り始める前に正解の頁と合わせる一覧を user と握る。

作った後は dragon-match で 1 回測って撮り、2 枚の絵と一覧の表を user に見せる。

## 起動 trigger

user 明示起動だけで使う。

- /dragon-diagram <theme> で題材を指定する。
- /dragon-diagram だけなら AskUserQuestion で題材を聞く。

## 前提

- 起動 dir は dragon repo root とする。
- 見本帳の dev server を起動しておく。
- Node.js と pnpm を使えることを確かめる。

## Skill 実行 flow

### Step 1. 題材を分けて考える

次の 4 点を決める。

- core message は、この図で伝える 1 つの概念とする。
- story arc は、時間軸で何がどう変わるかとする。
- visual metaphor は、flow、timeline、state machine などから最も直感的な形を選ぶ。
- element 数は、主役 1〜3 個と補助 1〜2 個を目安にする。

### Step 2. Parts catalog を読む

apps/playground-spa/src/topics/catalog/parts.cdl.ts を読む。

この file が parts の登録簿であり、手順書に写しを持たない。

名前と図の題は次の command で調べる。

    grep -n '^export const parts' apps/playground-spa/src/topics/catalog/parts.cdl.ts

各 entry の title と subtitle を読み、題材の visual metaphor を既存 parts だけで組めるか判断する。

### Step 3. 新規 parts の要否を決める

登録簿のどれとも異なる shape kind または metaphor が要る時だけ新規 parts を検討する。

色や大きさだけが違う時は composite 側で調整する。

既存 parts の組合せで表せる時も新規 parts を作らない。

### Step 4. 新規 parts が要る時だけ user に聞く

AskUserQuestion で次の 3 案を示す。

1. 新規 parts を追加し、標準化を話す Issue を起票する。
2. composite 内だけで描き、parts を追加しない。
3. 作業を止め、別の組み方を考える。

user が選ぶまで新規 parts を追加しない。

新規 parts が無ければこの step を飛ばす。

### Step 4.5. 組み方の案を見せて選んでもらう

同じ題材で組み方が 2 通り以上ある時は dragon-propose を起動する。

候補ごとに実寸の図を撮って渡し、選ばれた案で次へ進む。

組み方が 1 通りしか無い時はこの step を飛ばす。

### Step 4.6. 正解の頁と合わせる一覧を握る

この step は Step 4.5 を飛ばした時も必ず通る。

1. 正解の頁は docs/design/proposal/static/ の見本と同じ形の HTML にする。

   箱は位置と大きさを持つ div にし、線は SVG にする。

2. 正解の頁は既定の配色 1 つで作る。

   残りの意匠は、作った後の絵で user に見せる。

3. dragon-match が読む合わせる一覧を user と一緒に作る。

   形、並び、つながりは意匠に依らず 1 つにし、色の項目だけが意匠ごとの note.md の役を指す。

4. 正解の頁は docs/design/proposal/<図の名>.html に置く。

   一覧は docs/design/proposal/<図の名>.checklist.json に置く。

   既存の docs/design/proposal/static/ は変えない。

5. claude.ai の artifact は作らない。

   手元の 2 file を正本にし、直す時も手元の file を直す。

6. 正解の頁の絵と一覧をチャットに貼り、AskUserQuestion で合意を取る。

   user が合意した時に 2 file を commit する。

正解の頁と一覧を握る時は、必ず絵を user に見せる。

正解の頁は動く図の最後の段の絵にする。

dragon-match は見本帳の図を最後の段まで進めてから測る。

数の表示 readout と段の札 badge は図の外に出るため、正解の頁には入れない。

### Step 5. Dragon 記法で composite exemplar を書く

apps/playground-spa/src/topics/catalog/animation.cdl.ts に composite exemplar を追加する。

図は sourceYaml__<export 名> の dragon 記法 YAML で書く。

cdl の組み立て API diagram(...) で同じ図を書かない。

記法で正解の絵に届かない所は、組み立て API や見本帳側の細工で埋めない。

届かない所を一覧の「合わない」に出し、記法を直すか正解を譲るかを user に決めてもらう。

次を守る。

- title は題材名ではなく、図が表す構造を抽象化した名前にする。
- topic は日本語の 1 文にする。
- state 名は id として使える英字にする。
- phase title は data 値ではなく物語の局面名にする。
- phase badge は短い抽象名にする。
- lane gap は 70px 以上を確保する。
- 動く形は記法の shape から指定する。
- 使用 parts を source の comment に残す。
- 主役 parts は 1〜3 個、補助 parts は 1〜2 個にする。
- 4〜5 phase で変化を見せる。

### Step 6. 記法から描いて i18n と export を登録する

見本帳に出す export は textDslToDiagram(sourceYaml__<export 名>) で描く。

animation.cdl.ts の pattern__richPipelineDemo__ゆっくり数えるが同じ形の先例である。

組み立て API で書くと、測るのは cdl の絵になり、利用者が書く記法で正解の絵が描けるかを確かめられない。

記法から描けば、届かない所が記法の穴として一覧の「合わない」に出る。

apps/playground-spa/src/lib/i18n.ts に export 名と日本語 label を追加する。

export 名は composite の内容を表す動詞句にする。

label は「何がどうなるか」が読める日本語にする。

### Step 7. 1 回測って撮り、user に見せる

最初に次の型検査を通す。

    pnpm --filter dragon-playground-spa exec tsc --noEmit

次に dragon-match を 1 回だけ呼ぶ。

正解の頁の path、合わせる一覧の path、作った図の名前、見せる意匠の一覧を渡す。

dragon-match が出した expected.png、actual.png、checklist.md の表を user に見せる。

最初に作った直後は必ずこの 3 点を見せる。

一覧の全ての升が「合う」なら仕上げを終える。

「測れない」または「cdl 待ち」が残る時は、その内容を添えて user に見せる。

その状態で終えるかは user が決める。

合わない項目または user の絵への指摘があれば、直す内容と対象 file を codex-runner に渡す。

main session は図を直さない。

直すたびに dragon-match を 1 回呼び、2 枚の絵と一覧の表を再び見せる。

回数の上限は置かない。

一覧に無い字体、数 px、cdl で描けない所は、user が絵で指摘した時だけ直す。

### Step 7.5. PR の前に全件の検査を 1 回だけ行う

絵を見せるたびには全件の検査を回さない。

PR の前に、次の 6 command を 1 回ずつ順に実行する。

    pnpm typecheck
    pnpm build
    pnpm lint
    pnpm exec vitest run --exclude '**/dependency-vulnerability-check.test.ts'
    pnpm lint:notation
    pnpm test:screens

全て exit 0 になるまで、落ちた原因を直して同じ command を再実行する。

pnpm test と pnpm run verify は依存の脆弱性検査を含むため使わない。

verify:deps も使わない。

### Step 8. 新規 parts の Issue を起票する

この step は Step 4 で「新規 parts を追加する」を user が選んだ時だけ行う。

Issue 本文の一時 file は .context/dragon-diagram/parts-proposal-<slug>.md に置く。

    mkdir -p .context/dragon-diagram

本文には発生 context、parts spec、既存 parts で代替できない理由、使用実績、次の action を書く。

本文 file は次の形で REST API に渡す。

    gh api -X POST repos/cardene777/dragon/issues \
      -f title="[parts] <parts 名> を parts catalog 標準化検討" \
      -F 'labels[]=parts' \
      -F 'labels[]=enhancement' \
      -F 'body=@.context/dragon-diagram/parts-proposal-<slug>.md' \
      --jq '.number,.html_url'

### Step 9. 完了を報告する

次を user に報告する。

- 生成した composite の export 名と変更 file。
- 使用した parts。
- 新規 parts と Issue の URL。
- 正解の expected.png。
- 作った図の actual.png。
- 最後の checklist.md の表。
- Step 7 の型検査結果。
- Step 7.5 の 6 command の結果。

## 品質保証 principle

- 正解の頁と一覧を user と握ってから実装を始める。
- 1 parts は 1 concept に絞る。
- composite は parts の陳列ではなく、題材固有の story を持たせる。
- 新規 parts は既存 parts で表せない時だけ作る。
- 合否は一覧の升で決め、一覧に無い違いは user の絵への指摘だけを直す。
- 正解の合意時、最初の実装直後、以後の各修正後に絵を見せる。
- 全件の検査は PR の前に 1 回だけ行う。

## Anti-pattern

- 正解の頁と一覧を握らずに composite を作り始めない。
- claude.ai の artifact を正本にしない。
- 既存 parts の色違いまたは大きさ違いを新規 parts にしない。
- title に配列や数の遷移をそのまま書かない。
- 英語だけの label または topic を作らない。
- composite を cdl の組み立て API だけで作らない。
- main session が composite を直接直さない。
- 一覧に無い違いを AI が自動で合否へ足さない。
- 修正回数に上限を置かない。
- user の確認なしに Issue を起票しない。

## 使用例

EIP-1559 の手数料を題材にする場合、まず core message を 3 層の優先度手数料と決める。

組み方が複数あれば dragon-propose で選んでもらう。

次に既定配色の正解 HTML と、3 層の字、縦の並び、層のつながり、色の役を持つ一覧を作る。

絵と一覧を user に見せ、合意後に 2 file を commit する。

composite を作った直後に dragon-match を 1 回呼び、正解と実装の絵と一覧表を見せる。

合わない項目を codex-runner で直し、直すたびに同じ 3 点を再び見せる。

全て合うか、残る「測れない」と「cdl 待ち」を user が受け入れた後、PR 前の全件検査へ進む。

## Known limitations

- cdl が表せない形は cdl待ち として一覧に理由と課題を残す。
- 意匠の note.md が無い色は測れない。
- 一覧に無い字体や数 px の違いは自動判定しない。
- 線の曲がり方と通り道そのものは判定せず、指定した箱への両端の接続だけを見る。

## 統合先 skill

| 関係 | skill | 何を渡すか |
|---|---|---|
| 上流 | 無し | user が /dragon-diagram <題材> で直接起動する |
| 下流 | dragon-propose | 組み方が 2 通り以上ある時の案 |
| 下流 | dragon-match | 正解の頁の path、一覧の path、作った図の名前、意匠の一覧 |

## 責務外

- dragon-match は図を直さない。
- 図を直す作業は呼ぶ側が codex-runner に渡す。
- 案を並べて選んでもらうことは dragon-propose が持つ。
- 採点役の agent 自体は変えない。
- dragon-propose の頁を公開する方法は変えない。
