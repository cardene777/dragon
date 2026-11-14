---
name: dragon
description: Draw diagrams that play step by step in the dragon notation (@cardenelabs/dragon). Use when the user asks for a diagram, a flow, a sequence diagram, an architecture or system diagram, a state machine, a git history (merge, rebase), a timeline, a tree such as a Merkle tree, a pipeline or token flow between contracts, a lineup of queues or bids, or an interactive diagram readers can try, when the user wants to define blocks of their own or add one to dragon's shared block collection with a pull request, or when the user mentions dragon or `.dragon` files.
---

# dragon

dragon (`@cardenelabs/dragon`) draws a diagram from a short text notation and plays it one step at a time.
You write the notation, check it with the `dragon` command, and show it where the user needs it.
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

Pick the kind from what the user wants to explain, then read [notation](references/notation.md) and that one kind's reference. Do not read the other kind files.

| Kind | Use it when the explanation is about | Reference |
|---|---|---|
| `sequence` | Messages between parties in time order: requests, API calls, sign-in, protocols | [sequence](references/kinds/sequence.md) |
| `architecture` | The parts of a system, where they live (groups), and what flows between them | [architecture](references/kinds/architecture.md) |
| `state` | One thing moving between states: an order, a ticket, a connection | [state](references/kinds/state.md) |
| `git` | Commits, branches, merges, rebases, cherry-picks, moving refs | [git](references/kinds/git.md) |
| `time` | When events happen on evenly spaced time: slots, epochs, waiting periods | [time](references/kinds/time.md) |
| `tree` | Values that fold up into one root: Merkle trees and proofs | [tree](references/kinds/tree.md) |
| `lineup` | Items that line up and move between lanes: queues, bids, block building | [lineup](references/kinds/lineup.md) |
| `try` | A model the reader drives by typing values and pressing buttons | [try](references/kinds/try.md) |
| `checkout` | Change purchase terms, approve the latest quote and try payment outcomes | [checkout](references/kinds/checkout.md) |
| `pipe` | One transaction through contracts: calls, balances, stored values, reverts | [pipe](references/kinds/pipe.md) |
| `chart` | Comparing the sizes of a few items step by step: shares as a donut, amounts as bars | [chart](references/kinds/chart.md) |
| `flow` | A procedure that branches at yes/no choices: a login check, a review, a deploy gate | [flow](references/kinds/flow.md) |
| `cycle` | Steps that go around again and again and start the next round: a slot, a sprint, a PDCA loop | [cycle](references/kinds/cycle.md) |
| `mind` | Ideas spread out from one topic, branch by branch: features to build, a plan, a brainstorm | [mind](references/kinds/mind.md) |
| `er` | Rows of tables that point at each other by keys, and how one value goes through them: an order total, a loan, a sale | [er](references/kinds/er.md) |
| `matrix` | Items sorted into four areas by two measures: priorities, risks, choosing between options | [matrix](references/kinds/matrix.md) |
| `venn` | How two or three groups overlap and how many fall in each region: how a wallet is used, hobbies, skills | [venn](references/kinds/venn.md) |
| `sankey` | Where one amount goes and how much goes to each place: a token allocation, a fee split, where a salary goes | [sankey](references/kinds/sankey.md) |

When two kinds fit, follow what moves: messages between parties (`sequence`), things flowing between places (`architecture`), one thing changing state (`state`), money and values inside one transaction (`pipe`), how big items are next to each other (`chart`), one case going down a procedure past choices (`flow`), the same steps coming round again (`cycle`), ideas growing out of one topic (`mind`), one value looked up across tables by keys (`er`), items sorted by two measures (`matrix`), how many fall in two or three overlapping groups (`venn`), how one amount splits into where it goes (`sankey`).

When no kind fits, do not force the explanation into one, and do not open an issue yet.
Write down what the diagram must show (the parts, what moves, how many steps), write it in the closest kind, add your own blocks where they help (step 8), and run `dragon check` and `dragon check --layout` until they pass.
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

## 6. Check the layout

A diagram that passes `dragon check` can still look broken once drawn: step numbers piled up, two lines running side by side too close, or a slot or label sticking out of a shaped box.
After the notation is clean, draw it and look for breaks.

```sh
dragon check --layout order.dragon
```

1. Each break is a `warning` line that names the step and the two parts, for example `order.dragon:18:1 warning Step 3: Step number 2 and step number 3 are too close`.
2. Fix what the notation can fix (reorder the boxes, shorten names, use a plain box), one break at a time, and run `dragon check --layout` again. [layout](references/layout.md) lists the kinds and the fixes.
3. Report every break left in your reply by its step number and the parts it names. Do not say the diagram has no breaks unless the command printed none.
4. Attach the step where a break shows: `dragon export order.dragon --format png --step 3`. Exporting needs Chromium; when it is not installed, report in words only.

## 7. Show it

Pick the way the destination supports. Details and code are in [setup](references/setup.md).

| Destination | How |
|---|---|
| A docs site or HTML page that runs scripts | One `<script type="module">` line, plus a `<pre class="dragon">` block or a Markdown ```` ```dragon ```` fence |
| A GitHub README or anywhere scripts do not run | Keep the notation in a `.dragon` file, export an image with `dragon export <file> --format gif` (or `png`), and embed the image |
| An app | `npm install @cardenelabs/dragon`, then `parseNotation` and `renderDiagram`, or the player `mountDiagram` |
| A tool or page that wants the diagram with its bar (Code, Editor, Copy, Export) | One of four ways: `data-header` on the script block, `mountDragon`, `<dragon-diagram>`, or an iframe from `embedUrl`. See [embed](references/embed.md) |
| A file that opens offline | `dragon embed page.html` |

Keep the `.dragon` file next to any exported image so the diagram can be edited and exported again.

## 8. When no block fits

If no existing box, line or icon expresses what the explanation needs, define your own block or use a shared one.
Read [blocks](references/blocks.md). It also covers how to offer a reusable block to the dragon repo, and how to ask it for a new kind of diagram.

## Common mistakes

- Declarations (`box`, `group`, `strip`, `branch`, `scale`, `row`, `item`, `hold`, ...) after the first `step`. Write them before it.
- Lines, `act`, `note` or `set` before the first `step` in a diagram that has steps. Only a state diagram takes lines there, as dotted paths not taken.
- An id on a line that no `box` line declares, in a diagram that declares boxes.
- An arrow other than `->`. `=>`, `-->` and `->>` make the line unreadable.
- An attribute value with `,` or `]` not wrapped in `"`. Write `[tag: "#42, #43"]`.
- A step with no `say`. Only short-form kinds fall back to the line labels.
- Lines that continue a `say` not indented deeper than `say`.
- A color role or icon name that does not exist. See the tables in [notation](references/notation.md).
