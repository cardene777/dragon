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
<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.74/dist/cdn/dragon.js"></script>

<pre class="dragon" data-header>
sequence Take an order
box shop as Shop
box api as Order API
step Place the order
  shop -> api: Send the order
</pre>
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
