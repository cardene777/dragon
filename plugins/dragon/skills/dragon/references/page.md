# Build one HTML page

Put the figures of a plan ([plan](plan.md)) on one HTML page that answers the questions in order.
Workflow: [SKILL.md](../SKILL.md).

## Write a guide page

Write the page in Markdown with `layout: guide` between `---` lines at the top.

| Write | Becomes |
|---|---|
| `# <title>` | The page title |
| Text before the first `##` | The opening, shown at the top of the page. Text after the overview fence is shown under the overview figure instead |
| A ```` ```dragon ```` fence before the first `##` | The overview at the top of the page, followed by the topics in order |
| `## <topic>` | A topic. Put related questions under one topic. A page with one topic shows every section on one page. A page with two or more topics splits into an overview page and one page per topic, with the menu on the left to open each page |
| `### <question>` | A section numbered `<topic>-<question>`, such as `2-1`. The menu on the left lists every question. On a page with one topic, a click scrolls to the section. On a page split into topic pages, each question is its own page, and a click shows only that question |
| `[menu: <short name>]` at the end of a `###` | The short name the menu shows for a long question |
| `> <answer>` right after a `###` | The one-sentence answer, shown under the question |
| A ```` ```dragon ```` fence | A figure. Write one sentence before it that says what to look at |
| `<details>` with a `<summary>` | A check question whose answer opens on a click |
| `note: pop` at the top | Every box note becomes a card that opens on a click ([cheatsheet](cheatsheet.md)) |
| An image line `![Terms]` that points at a terms file such as `glossary.md`, before the first `##` | A Terms topic at the end of the page from that file, where each `###` is a term with its meaning and a `>` example |

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

The screenshots show the first page. When the page has two or more topics, open the page in a browser at the same two widths and open each topic and question from the menu on the left to look at them.
Fix figures that break, text that sticks out of its box, and sections whose answer or figure says little, before you hand the page over.

The worked examples are [Library loans](example-library-loans.md) and [Support desk](example-support-desk.md).

A page can also be written in the HTML form that [#3908](https://github.com/cardene777/dragon/issues/3908) adds.
