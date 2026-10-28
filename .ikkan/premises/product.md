# dragon の目的と利用者

## 目的

- dragon は、文字で書いて動く SVG の図を描く道具である (`README.md`)。
- 書いた図は、段ごとに線が光り、点が進む動きを持つ (`README.md`、#2982)。
- 古い記法と描画は #2983 で消し、作り直した記法の読み書き (`parser.ts`、`printer.ts`)、描画 (`render/`)、再生 (`player.ts`)、書き出し (`export/`) を `packages/dragon/src` に持つ (#2982)。
- 描ける図の種類は時系列図 (`sequence`) と構成図 (`architecture`) と状態遷移図 (`state`、#3163) の 3 つ (`packages/dragon/src/schema.ts`)。

## 利用者

- 人は dragon記法で書く。行の頭の英語の語 (`sequence` や `box` や `step`) が行の役目を決め、段の中の行は字下げして書く。記法の語は英語だけで、名前と本文の字は何語でもよく、誤りの文の言葉は呼ぶ側が渡す (既定は日本語) (`packages/dragon/src/parser.ts`、#3137)。
- AI は原本の JSON で書き、schema で形を確かめる (`packages/dragon/src/schema.ts`、`packages/dragon/src/schemas`)。
- 利用者の数と、どこで使われているかは不明。

## 配り方

- package は `@cardenelabs/dragon` の名前で、使用許諾は MIT (`packages/dragon/package.json`、`LICENSE`)。
- 作り直した版を 0.35.0 と 0.35.1 として npm に出した (#3019、#3021)。記法を dragon記法に作り直した版を 0.36.0 として出し、日本語の誤りの文の呼び方を直した版を 0.36.1 として出した (#3141、#3143)。再生の部品の設定の型 `PlayerOptions` を入口から出した版を 0.36.2 として出した (#3147)。描いた結果の中身の型 (`SceneBox` や `Span` など) も入口から出した版を 0.36.3 として出した (#3149)。図を頁に置く書き方と字の入口を README に書いた版を 0.36.4 として出した (#3153)。状態遷移図と絵柄 `undo`、`yen` を足し、使い方と README に書き方を載せた版を 0.37.0 として出した (#3163、#3171、#3172)。描いた結果が字の重なりを返し、運ぶ物に置き場を設け、時系列図を縦に詰めた版を 0.38.0 とした (#3175、#3176、#3177、#3182)。0.38.0 は npm にも見本帳にもまだ出していない。
- 見本帳は GitHub Pages (`gh-pages` の枝) に配る (`apps/playground-spa/package.json` の `deploy:pages`)。上の帯と 8 画面 (概要、カタログの一覧、カタログの分類、カタログの部品、編集画面、使い方、更新履歴、見つからない頁) を持つサイトで、#3029 で前のサイトの構成に作り直した (#3030 から #3035、`apps/playground-spa/src/main.tsx`)。カタログは部品、図の種類だけの部品、図の 3 段に並び、部品の表は `apps/playground-spa/src/catalog/parts.ts` が持つ (#3166)。`vercel.json` も残る。
