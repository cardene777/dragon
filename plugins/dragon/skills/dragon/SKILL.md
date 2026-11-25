---
name: dragon
description: Draw diagrams that play step by step in the dragon notation (@cardenelabs/dragon), and build one HTML page that answers a topic's questions with several diagrams. Use when the user asks for a diagram, a flow, a sequence diagram, an architecture or system diagram, a state machine, a git history (merge, rebase), a timeline, a tree such as a Merkle tree, a pipeline or token flow between contracts, a lineup of queues or bids, cases checked against rules, an explainer page or report made of several diagrams, or an interactive diagram readers can try, when the user wants to define blocks of their own or add one to dragon's shared block collection with a pull request, or when the user mentions dragon or `.dragon` files.
---

# dragon

dragon (`@cardenelabs/dragon`) draws a diagram from a short text notation and plays it one step at a time.
You plan the figures a topic needs, write them in the notation, check them with the `dragon` command, look at them, and show them where the user needs them.
This file is the workflow. Details live in `references/`. Read only the files the task needs.

## 1. Check the setup

Run this before you write a diagram.

```sh
dragon --version
# without a global install
npx @cardenelabs/dragon --version
```

- This plugin has the same version as the npm package `@cardenelabs/dragon`. The plugin version is the `version` field of `.claude-plugin/plugin.json`, two directories above this skill's directory.
- If the command is missing, prints an older version than the plugin, or does not know `dragon check`, follow [setup](references/setup.md) first.
- Take version numbers from the command or the manifest. Never write one from memory.

## 2. Pick the kind

Plan the figures before you write any. One diagram of one kind rarely answers a whole topic.

1. Read [cheatsheet](references/cheatsheet.md) first. It has the smallest form of every kind and part on one page.
2. Split the topic into the questions a reader asks: how it works, what passes and what is blocked, what differs between cases, how one case goes, how much.
3. Look up each question's type in [plan](references/plan.md), and pick 2 to 4 figures for each question with the parts that help: `[note: pop]` cards, scenes, judge tables, gauges. When the user asks for one diagram, the plan is that one figure.
4. Write the plan down before the first figure: each question, and one line per figure saying what it shows. The plan changes with the topic, so do not reach for the same kinds every time.
5. Write the figures one at a time (steps 3 to 6). Open a kind's own file only when the cheatsheet is not enough: [architecture](references/kinds/architecture.md), [cards](references/kinds/cards.md), [chart](references/kinds/chart.md), [checkout](references/kinds/checkout.md), [cycle](references/kinds/cycle.md), [er](references/kinds/er.md), [flow](references/kinds/flow.md), [git](references/kinds/git.md), [judge](references/kinds/judge.md), [lineup](references/kinds/lineup.md), [matrix](references/kinds/matrix.md), [mind](references/kinds/mind.md), [pipe](references/kinds/pipe.md), [sankey](references/kinds/sankey.md), [sequence](references/kinds/sequence.md), [state](references/kinds/state.md), [time](references/kinds/time.md), [tree](references/kinds/tree.md), [try](references/kinds/try.md), [venn](references/kinds/venn.md).

When no kind fits, do not refuse, do not force the explanation into one kind, and do not open an issue yet.
Write down what the diagram must show (the parts, what moves, how many steps), then combine kinds and parts, or write it in the closest kind and add your own blocks where they help (step 8), and run `dragon check` and `dragon check --layout` until they pass.
Export it (`dragon export <file> --format png`; without Chromium, `--format html` writes a page that opens in a browser), show the user the picture, and name the parts it could not draw.
Then the user decides whether it is enough or whether to ask the dragon repo for a new kind of diagram through an issue ([blocks](references/blocks.md)).
Mermaid syntax (`graph TD`, `participant`, `-->|text|`) is not dragon notation. Do not convert it line by line; rewrite it in the notation.

## 3. Write the diagram

Write explanation diagrams with `step` and `say`.

- One step is one thing the reader should notice. Group the lines that happen together (a call and the check it triggers, a transfer and its event) into one step.
- `say` is one or two sentences that tell what happens and why it matters. Do not repeat the line label.
- `step <title>` names the action in a few words.
- Keep a diagram to about 3 to 12 steps. Split a longer story into two diagrams.
- Declare every box: `box <id> as <name> [note: <caption>]`. Keep ids short ASCII words and put the shown text in the name.

```dragon
sequence Fetch the order list

box browser as Browser [note: opens the order screen, icon: globe]
box api as API server [note: returns the list, color: blue, icon: server]
box db as Order DB [color: violet, icon: db]

step Ask for the list
  say The browser asks the API server for the user's orders.
  browser -> api: GET /orders

step Read and return
  say The API server reads the rows and returns them as JSON with 200 OK.
  api -> db: SELECT orders
  db -> api: 12 rows [side: below]
  api -> browser: 200 OK [side: below]
```

Use the short form only for small diagrams where one line per step is enough, or when the user asks for a quick draft.
The short form works only for `sequence`, `architecture` and `state`: no `box`, `step` or `say` lines, and each `a -> b: text` line becomes a box pair and one step.

```dragon
sequence

browser -> app: GET /login
app -> browser: Return the sign-in page
```

## 4. Write the text in the user's language

Write the text inside the diagram (title, box names, labels, notes, strip fields, `say`) in the same language as the request.
The notation keywords stay English: kind words, `box`, `as`, `step`, `say`, attribute keys such as `note:`, color roles and icon names.
Keep ids ASCII even when the names are in another language.

```dragon
sequence ログインを頼む

box browser as ブラウザ [note: 利用者が操作する, color: slate]
box app as アプリ [note: ログインを求める, color: blue]

step ログインを押す
  say 利用者がアプリのログインのボタンを押す。
  browser -> app: GET /login
```

## 5. Check and fix

After writing, run `dragon check` and fix every `error` line. Re-run until it prints no `error`.

```sh
dragon check order.dragon
dragon check README.md docs/flow.md
cat order.dragon | dragon check -
dragon check --json order.dragon
```

- It takes `.dragon` files, `.md` and `.markdown` files (only the ```` ```dragon ```` fences are checked, and the line numbers point into the original file), or `-` for stdin.
- Each problem is one line on stdout: `<file>:<line>:<column> error <message>` or `<file>:<line>:<column> warning <message>`.
- `--json` prints an array of `{ file, line, column, severity, message }`. `--lang ja|en` picks the message language (default `en`).
- Exit code: `0` when there is no error (warnings allowed), `1` when there is an error, `2` for a usage error (no file, a missing file, an unsupported extension).

Repeat this loop.

1. Read the first `error` line. Go to that line and column and fix what the message says.
2. Re-run `dragon check`. One fix can clear several lines, so do not batch blind edits.
3. When only `warning` lines are left, read them. A warning about two similar box names (`apq differs from app by one character`) means two boxes will be drawn. Fix it when it is a typo. Keep it when the two boxes are really different.
4. Stop when the command exits `0` and every warning is understood.

In code, `parseNotation(text, { lang: "en" })` returns the same problems: `errors` (each with `line`, `column`, `message`) and `notices` for the warnings.

## 6. Check the layout and look at it

A diagram that passes `dragon check` can still look broken once drawn: step numbers piled up, two lines running side by side too close, or a slot or label sticking out of a shaped box.
After the notation is clean, draw it, look for breaks, and then look at it yourself 728px and 390px wide.

```sh
dragon check --layout order.dragon
dragon export order.dragon --format html --out shots
npx playwright-core screenshot --viewport-size 728,900 --full-page shots/order.html shots/order-728.png
npx playwright-core screenshot --viewport-size 390,900 --full-page shots/order.html shots/order-390.png
```

1. Each break is a `warning` line that names the step and the two parts, for example `order.dragon:18:1 warning Step 3: Step number 2 and step number 3 are too close`.
2. Fix what the notation can fix (reorder the boxes, shorten names, use a plain box), one break at a time, and run `dragon check --layout` again. [layout](references/layout.md) lists the kinds and the fixes.
3. Look at both screenshots, which show the player as a reader sees it on a wide screen and on a phone. Fix breaks, text that sticks out of its box, and thin explanations (a `say` that repeats the line label, a figure that answers no question of the plan) before you hand them over. Take the narrow picture from the HTML: the PNG export is the same picture at any `--width`.
4. Report every break left in your reply by its step number and the parts it names. Do not say the diagram has no breaks unless the command printed none.
5. Attach the step where a break shows: `dragon export order.dragon --format png --step 3`. Exporting and screenshots need Chromium (`playwright-core`, see [setup](references/setup.md)); when it is not installed, report in words only.

## 7. Show it

When the plan has several figures, put them on one HTML page: write a guide page in Markdown with `layout: guide`, one `###` per question with its figures under it, and run `dragon export page.md`, which writes `page.html`.
Check the page with `dragon check --layout page.md`, and take screenshots of it 728px and 390px wide as with one figure. See [page](references/page.md).

For one figure, pick the way the destination supports. Details and code are in [setup](references/setup.md).

| Destination | How |
|---|---|
| A docs site or HTML page that runs scripts | One `<script type="module">` line, plus a `<pre class="dragon">` block or a Markdown ```` ```dragon ```` fence |
| A GitHub README or anywhere scripts do not run | Keep the notation in a `.dragon` file, export an image with `dragon export <file> --format gif` (or `png`), and embed the image |
| An app | `npm install @cardenelabs/dragon`, then `parseNotation` and `renderDiagram`, or the player `mountDiagram` |
| A tool or page that wants the diagram with its bar (Code, Editor, Copy, Export) | One of four ways: `data-header` on the script block, `mountDragon`, `<dragon-diagram>`, or an iframe from `embedUrl`. See [embed](references/embed.md) |
| A report or explainer page that shows the last step as one picture | `data-still` on the `<pre class="dragon">` block, then `dragon embed page.html`, which draws it as an SVG with no player. See [embed](references/embed.md) |
| A file that opens offline | `dragon embed page.html` |
| Many diagrams split into pages and tabs rather than questions | Write it in Markdown (`#` title, `##` groups, `###` items, `####` tabs) with `layout: sidebar` or `layout: tabs` at the top, and run `dragon export notes.md`. See the package README |

Keep the `.dragon` file next to any exported image so the diagram can be edited and exported again.

## 8. When no block fits

If no existing box, line or icon expresses what the explanation needs, define your own block or use a shared one.
Read [blocks](references/blocks.md). It also covers how to offer a reusable block to the dragon repo, and how to ask it for a new kind of diagram.

## Contents other skills follow

Other skills follow this skill's files through musubi, by the content names in `musubi.json`.
The contents `notation`, `cheatsheet`, `plan`, `page`, `embed`, `layout`, `blocks`, and `setup` are the files of the same name linked above, and `example-library-loans` and `example-support-desk` are the worked examples [plan](references/plan.md) links.
Each kind is a content named after it, and its file is the one linked in step 2: `architecture`, `cards`, `chart`, `checkout`, `cycle`, `er`, `flow`, `git`, `judge`, `lineup`, `matrix`, `mind`, `pipe`, `sankey`, `sequence`, `state`, `time`, `tree`, `try`, and `venn`.

## Common mistakes

- Declarations (`box`, `group`, `strip`, `branch`, `scale`, `row`, `item`, `hold`, ...) after the first `step`. Write them before it.
- Lines, `act`, `note` or `set` before the first `step` in a diagram that has steps. Only state and flow diagrams take lines there, as dotted paths not taken.
- An id on a line that no `box` line declares, in a diagram that declares boxes.
- An arrow other than `->`. `=>`, `-->` and `->>` make the line unreadable.
- An attribute value with `,` or `]` not wrapped in `"`. Write `[tag: "#42, #43"]`.
- A step with no `say`. Only short-form kinds fall back to the line labels.
- Lines that continue a `say` not indented deeper than `say`.
- A color role or icon name that does not exist. See the tables in [notation](references/notation.md).
