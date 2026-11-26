# Embedding a diagram with the bar

Use this when the destination wants the diagram with its bar: Code, Editor, Copy, Export and expand.
There are four ways. Pick the first one the destination supports.

| Destination | Way |
|---|---|
| An HTML page or docs site that runs scripts | One script line, with `data-header` on the block |
| An app built with a bundler (Vite, Next.js) | The SDK function `mountDragon` |
| A framework app (React and others) or HTML you write by hand | The Web Component `<dragon-diagram>` |
| A page that cannot run the package (a CMS, a notes service) | An iframe of the gallery's embed page |

All four draw the same diagram from the same notation. Check the notation with `dragon check` before embedding.

## One script line

Add `data-header` to the `<pre class="dragon">` block. Blocks without it stay plain diagrams. Pin the version to `<major>.<minor>` of the installed package.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.82/dist/cdn/dragon.js"></script>

<pre class="dragon" data-header>
sequence Take an order
box shop as Shop
box api as Order API
step Place the order
  shop -> api: Send the order
</pre>
```

## A still figure on a report or explainer page

When the page should show the last step in one picture, such as a chart in a report or a flow in an explainer, add `data-still` to the block instead of `data-header`.
The block becomes an SVG of the last step with no player: no buttons, step numbers, step captions, or progress bar.
A chart shows its values and the diagram title, a flow draws every passed line solid, the fonts fall back to sans-serif, the palette defaults to `clear`, and the colors turn dark with the page's `data-theme="dark"` or the device's dark scheme.

```html
<pre class="dragon" data-still>
chart Sales by product in thousands of yen [shape: bar]
item croissant as Croissant
item melon as Melon bun
step This week
  set croissant: 129
  set melon: 82
</pre>
```

Run `dragon embed page.html` to make a file that reads nothing from outside. A `data-header` block keeps its bar, and the bar's Export menu saves the same seven formats as the jsDelivr page (PNG, SVG, HTML, GIF, MP4, notation, and JSON) without reading anything from outside. The saved HTML draws in the device's sans-serif fonts, like the embedded page. When every block is still, it draws them as SVGs and adds no script. From the package, `renderDiagram(diagram, { figure: true })` returns the same SVG.

Set `--dragon-figure-background` on the figure or an ancestor, for example `.card { --dragon-figure-background: var(--surface); }`, to paint the figure background, the line outlines, and the label plates with the page's color on light and dark pages. A donut wraps a middle name that does not fit the ring onto two lines, and a step band (`cycle` with `[shape: band]`) writes the step names inside the chevrons.

## A figure paused on one step

When the page should open a diagram on one step, add `data-step` with the step number, counting from 1 as the step bar does.
The block does not play when it is placed and waits on the still of that step, and the reader can still play it or move between steps with the bar.
Sequence, architecture, state, and flow diagrams keep the labels of earlier lines in faint gray, so the flow up to that step reads in one picture.
A number larger than the step count pauses on the last step, and a value that is not a whole number from 1 turns the block into an error message.

```html
<pre class="dragon" data-step="2">
sequence Order
box shop as Shop
box bank as Bank
step Ask
  shop -> bank: payment
step Pay
  bank -> shop: paid
step Close
  shop -> bank: closed
</pre>
```

## Write the diagram and the page in HTML

When a report is one HTML file, write its diagrams in HTML too. Each notation line becomes one element: the diagram is `<dg-<kind>>` (`<dg-sequence>`, `<dg-flow>`), a declaration line is the element named after its block (`<dg-box>`, `<dg-choice>`), a step is `<dg-step>`, its `say` line is `<dg-body>`, and a line inside a step is `<dg-edge>`.
The element and attribute names are the field names of the source JSON, so `dragon convert diagram.dragon` shows the HTML form of any notation, and a new notation word gets its element with the next release.
Words and numbers are attributes, a box name or a line label is the element text, and a field that holds one small object is a hyphenated attribute (`carry-kind="coin"`).
Close every element with its end tag. HTML does not close `<dg-box/>`.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.82/dist/cdn/dragon.js"></script>

<dg-sequence title="Take an order">
  <dg-box id="shop">Shop</dg-box>
  <dg-box id="api">Order API</dg-box>

  <dg-step title="Place the order">
    <dg-body>The shop sends the order to the API.</dg-body>
    <dg-edge from="shop" to="api">Send the order</dg-edge>
  </dg-step>
</dg-sequence>
```

The same script line draws a `<dg-...>` diagram where it stands, with the same bar and steps as a `<pre class="dragon">` block, which still works.

A Markdown page for `dragon export` converts to one HTML page in `<dragon-page>`: the front matter becomes its attributes, `##` and `###` become `<section>` with the heading, a quote becomes `<blockquote>`, `<details>` stays `<details>`, a glossary link becomes `<a>`, and a `dragon` fence becomes the HTML form of the diagram.

```html
<dragon-page title="How an order arrives" layout="guide">
  <section>
    <h2>Take the order</h2>
    <section>
      <h3>Which orders does the shop take?</h3>
      <blockquote>
        <p>Only orders for items in stock. See <a href="glossary.md#order">order</a>.</p>
      </blockquote>
    </section>
  </section>
</dragon-page>
```

| Command | What it does |
|---|---|
| `dragon convert diagram.dragon` | Prints the HTML form of the diagram |
| `dragon convert page.md` | Prints the `<dragon-page>` HTML page |
| `dragon convert page.html` | Prints the notation of the first `<dg-...>` diagram, or the Markdown page of a `<dragon-page>` |
| `dragon check page.html` | Checks every `<dg-...>` diagram and `<pre class="dragon">` block, and names the HTML line and element of each error |

Add `--out <file>` to write a file instead. Converting back gives tidied notation with the same source JSON; blank lines and indentation are not kept.
From the package, `notationToHtml`, `htmlToNotation`, `markdownToHtml`, and `htmlToMarkdown` do the same.

## Find the box that was pressed

Every drawn box and group carries its notation id in `data-node`.
For example, `box api as API server` draws an element with `data-node="api"`.
To show something when a box is pressed, read the id from the pressed element with `closest('[data-node]')`.
A box inside a group returns the box, not the group, and lines and labels carry no id.

```html
<script>
document.addEventListener("click", (event) => {
  const node = event.target.closest('[data-node]');
  if (node) showNote(node.getAttribute("data-node"));
});
</script>
```

## The SDK function

```ts
import { mountDragon } from "@cardenelabs/dragon/embed";

const source = await (await fetch("order.dragon")).text();
const host = document.getElementById("figure");
if (host === null) throw new Error("#figure not found");
const embed = mountDragon(host, source, {
  lang: "en",
  look: { colors: { accent: "#2563eb" }, radius: "6px", frame: { border: "1px solid #e5e7eb" } },
  buttons: ["code", "copy", "export", { id: "log", label: "Log", onClick: (placed) => console.log(placed.source) }],
});
host.addEventListener("dragon-export", (event) => console.log(event.detail.format));
```

Settings, all optional:

| Setting | What it does |
|---|---|
| `look` | Fits the bar and frame to the page: `colors`, `font`, `fontSize`, `radius`, `height`, `frame` (`border`, `background`) |
| `buttons` | The bar buttons in order (`code`, `editor`, `copy`, `export`, `expand`). Left-out built-ins are dropped. An object `{ id, label, icon, onClick }` adds a button; `onClick` receives the placed diagram |
| `header` | `false` puts only the diagram. The returned object still has `export`, `openEditor` and `copy` |
| `lang` | `ja` or `en` for the bar. Without it, the nearest `lang` attribute above the element, then English |
| `nonce` | Put on the style element made for browsers without `adoptedStyleSheets` |

The element sends four events with `bubbles` and `composed`:

| Event | `detail` |
|---|---|
| `dragon-render` | `{ ok, errors? }` drawn or not |
| `dragon-step` | `{ step }` the step changed (from 0) |
| `dragon-export` | `{ format }` exported |
| `dragon-share` | `{ via, kind? }` copied (`via: "copy"`, with `kind`) or opened the editor (`via: "editor"`) |

## The Web Component

`defineDragonElement()` registers `<dragon-diagram>`. The text inside is the notation. `header="false"` drops the bar, `nonce` passes the setting, and the bar follows the nearest `lang` attribute. The same four events reach the page.

```html
<script type="module">
  import { defineDragonElement } from "@cardenelabs/dragon/embed";
  defineDragonElement();
</script>

<dragon-diagram>
  sequence Take an order
  box shop as Shop
  box api as Order API
  step Place the order
    shop -> api: Send the order
</dragon-diagram>
```

## An iframe

`embedUrl(source, { lang })` from `@cardenelabs/dragon` returns the gallery's embed page URL with the notation after `#`, which is not sent to any server. The page posts the four events as `{ source: "dragon", type, detail }`. Allow `clipboard-write` for the Copy button.

```html
<iframe id="figure" title="Take an order" allow="clipboard-write" style="width: 100%; height: 560px; border: 0"></iframe>

<script type="module">
  import { embedUrl } from "@cardenelabs/dragon";

  const source = await (await fetch("order.dragon")).text();
  const frame = document.getElementById("figure");
  frame.src = await embedUrl(source, { lang: "en" });
  addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || event.data?.source !== "dragon") return;
    console.log(event.data.type, event.data.detail);
  });
</script>
```
