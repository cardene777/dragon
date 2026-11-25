# Build one HTML page

Put the figures of a plan ([plan](plan.md)) on one HTML page that answers the questions in order.
Workflow: [SKILL.md](../SKILL.md).

## Write a guide page

Write the page in Markdown with `layout: guide` between `---` lines at the top.

| Write | Becomes |
|---|---|
| `# <title>` | The page title |
| Text before the first `##` | The opening, shown above the tabs |
| `## <topic>` | A topic tab. Put related questions under one topic |
| `### <question>` | A numbered section. The top of each tab lists its questions, and a click scrolls to the section |
| `> <answer>` right after a `###` | The one-sentence answer, shown under the question |
| A ```` ```dragon ```` fence | A figure. Write one sentence before it that says what to look at |
| `<details>` with a `<summary>` | A check question whose answer opens on a click |
| `note: pop` at the top | Every box note becomes a card that opens on a click ([cheatsheet](cheatsheet.md)) |
| An image line `![Terms]` that points at a terms file such as `glossary.md`, before the first `##` | A Terms tab from that file, where each `###` is a term with its meaning and a `>` example |

Follow the plan: one `###` per question, its answer, then its 2 to 4 figures in the order the plan gives.

````md
---
layout: guide
note: pop
---

# <title>

<one or two sentences on what the page answers>

## <topic>

### <question>?

> <the answer in one sentence>

<what to look at in the first figure>

```dragon
sequence <title>

box a as <name>
box b as <name>

step <title>
  say <what happens and why it matters>
  a -> b: <label>
```

<details>
<summary><a check question></summary>

<its answer>

</details>
````

## Check and export it

```sh
dragon check page.md
dragon check --layout page.md
dragon export page.md
dragon embed page.html
```

- `dragon check` and `dragon check --layout` read every `dragon` fence in the page. Fix every line they print, as for a single figure.
- `dragon export page.md` writes `page.html` next to it (`--out <dir>` picks the folder, `--lang ja|en` the language of the words the page adds).
- `dragon embed page.html` writes `page.offline.html`, which carries the scripts and opens offline.

## Look at it

Take screenshots of the page 728px wide and 390px wide.

```sh
npx playwright-core screenshot --viewport-size 728,900 --full-page page.offline.html page-728.png
npx playwright-core screenshot --viewport-size 390,900 --full-page page.offline.html page-390.png
```

The screenshots show the first tab. Open the page in a browser at the same two widths to look at the other tabs.
Fix figures that break, text that sticks out of its box, and sections whose answer or figure says little, before you hand the page over.

The worked examples are [Library loans](example-library-loans.md) and [Support desk](example-support-desk.md).

A page can also be written in the HTML form that [#3908](https://github.com/cardene777/dragon/issues/3908) adds.
