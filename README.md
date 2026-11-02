# dragon

> Animated diagrams that people write in a plain notation and AI writes as JSON.

[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[日本語](README.ja.md)

dragon draws a diagram that plays step by step from a short text file.
It draws boxes, the lines between them, and what travels along those lines, and each step moves the story forward.
People write a diagram in the dragon notation, and AI can write the same diagram as JSON.
The same source plays on a web page and exports to MP4, GIF, HTML, and PNG.

The catalog, with every kind of diagram and an editor that plays what you type, is at <https://cardene777.github.io/dragon/>.

## Install

```sh
npm install @cardenelabs/dragon
```

## A first diagram

```dragon
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate]
box app as App [note: asks for sign-in, color: blue]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
```

Paste it into the editor on the catalog to watch it play.
To put it on your own page, parse it with `parseNotation` and pass the result to `mountDiagram` (see [Put it on a page](packages/dragon/README.md#put-it-on-a-page)).

## What it does

| Part | What it is |
|---|---|
| Source | JSON with a shared skeleton and fields for each kind of diagram. It carries a format version, and older versions are converted when read |
| Notation | The dragon notation, where the first English word of each line decides its kind. It converts to and from JSON, and names and text can be in any language |
| Renderer | Draws the source on a page and plays it one step at a time |
| Diagram kinds | Sequence diagram, architecture diagram, state diagram, git graph, time diagram, tree diagram |
| Export | The `dragon export` command writes MP4, GIF, HTML, and PNG from the same source |

## Notation

Every line follows these four rules.

1. The first English word of a line decides its kind. Only arrow lines start with a box id
2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

Every line form is in the [notation guide](packages/dragon/examples/quick-start.en.md), and a full example of each kind of diagram is in [`packages/dragon/examples`](packages/dragon/examples).

## Documentation

| Read | For |
|---|---|
| [`packages/dragon/README.md`](packages/dragon/README.md) | Putting a diagram on a page, loading diagram kinds on demand, the notation for each kind, and exporting |
| [Notation guide](packages/dragon/examples/quick-start.en.md) | Every line form and attribute |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed in each version, and how to rewrite diagrams written for older versions (in Japanese) |

## Contributing

Issues and pull requests are welcome.
See [`CONTRIBUTING.md`](CONTRIBUTING.md) (mostly in Japanese) for how to build and test.

## License

MIT
