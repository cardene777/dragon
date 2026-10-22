# dragon の目的と利用者

## 目的

- dragon は、文字で書いて動く SVG の図を描く道具である (`README.md`)。
- 書いた図は、段ごとに線が光り、点が進む動きを持つ (`README.md`、#2982)。
- 古い記法と描画は #2983 で消し、作り直した記法の読み書き (`parser.ts`、`printer.ts`)、描画 (`render/`)、再生 (`player.ts`)、書き出し (`export/`) を `packages/dragon/src` に持つ (#2982)。
- 描ける図の種類は時系列図 (`sequence`) と構成図 (`architecture`) の 2 つ (`packages/dragon/src/schema.ts`)。

## 利用者

- 人は 1 行が 1 つの文になる行ごとの記法で書く。語は日本語でも英語でも書ける (`packages/dragon/src/parser.ts`、#2997)。
- AI は原本の JSON で書き、schema で形を確かめる (`packages/dragon/src/schema.ts`、`packages/dragon/src/schemas`)。
- 利用者の数と、どこで使われているかは不明。

## 配り方

- package は `@cardenelabs/dragon` の名前で、使用許諾は MIT (`packages/dragon/package.json`、`LICENSE`)。
- 作り直した版を 0.35.0 と 0.35.1 として npm に出した (#3019、#3021)。
- 見本帳は GitHub Pages (`gh-pages` の枝) に配る (`apps/playground-spa/package.json` の `deploy:pages`)。上の帯と 7 画面 (概要、カタログの一覧、カタログの分類、編集画面、使い方、更新履歴、見つからない頁) を持つサイトで、#3029 で前のサイトの構成に作り直している (`apps/playground-spa/src/main.tsx`)。`vercel.json` も残る。
