# Changelog

The main changes to dragon, newest first.
The format follows Keep a Changelog, and versions follow Semantic Versioning.
The same record in Japanese is in [`CHANGELOG.ja.md`](CHANGELOG.ja.md).

## [Unreleased]

## [0.67.0] - 2026-11-08

### Added

- **Boxes and groups can use the free Tabler outline icons with `icon: tabler:<name>`** (#3493)

  dragon draws 38 icons of its own, so a box that needed another picture had to fall back to a block's shape. `icon:` on a box or group line now also takes `tabler:` and the name of one of the 5,184 Tabler outline icons, such as `[icon: tabler:building-bridge-2]`. The build moves each icon from Tabler's 24 x 24 grid onto the 20 x 20 grid of dragon's own icons, so it draws with the same class, scale and line width. A name Tabler does not have stops reading at the `icon` attribute and names the closest Tabler name, and `validateDiagram` refuses it at the `icon` field of the JSON. The default entry carries all the icons. The light entry reads them as one chunk only for a diagram that writes `tabler:`, when you await `loadFor`; reading such a diagram before that stops with an error that says to await `loadFor`, and `iconSetLoaded("tabler")` tells whether the chunk is in. An exported HTML page and a page written by `dragon embed` carry only the icons their diagrams use. The Tabler license (MIT) ships in `THIRD_PARTY_NOTICES.md`.

- **`dragon check` checks a block definitions file, and `--blocks <file>` checks diagrams with the definitions in that file** (#3508)

  A file whose first line after any comments is `blocks 1`, such as a shared block in `packages/dragon/blocks/`, is now read as block definitions instead of a diagram. A correct file prints nothing and exits 0, and an error prints its line and column and exits 1. Before, every such file stopped at `Start the first line with sequence or ...`. `dragon check --blocks vault.dragon example.dragon` reads the definitions and checks `example.dragon` with them, so a diagram that uses a block the installed `dragon` does not know yet can be checked without building dragon again. With `--layout`, it also draws the diagram with those definitions, and `checkLayoutText` now passes its `blocks` option to the drawing as well. Passing a missing file or a diagram to `--blocks` stops with exit code 2 and names the file. The skill's steps for offering a shared block to the dragon repo now check the definition and its example this way, and say to write in the pull request when `pnpm verify` could not run.

- **A block definition based on a box can give its boxes an icon** (#3489)

  Write `icon <name>` between `block +<name>` and `end` in a definition based on `box`, such as `icon tabler:building-bridge-2`, and every box of that block draws the icon in its icon slot. The line takes the same names as `icon:` on a box line, a hand-drawn icon or `tabler:<name>`, and an icon written on the box line wins over the definition's. A definition based on `edge` or `icon` that writes `icon` stops at that line, and an unknown name stops at that line and names the closest one. The JSON `define` field takes `icon` too, `validateDiagram` refuses a Tabler name it does not have at `/define/blocks/<n>/icon`, and printing writes the line back. The light entry reads the Tabler chunk when you await `loadFor` for a diagram whose definitions write `icon tabler:`, or that uses a shared block with a Tabler icon. Drawing such a diagram before that stops with an error that says to await `loadFor`.

- **The skill draws a diagram that no kind fits in the closest kind and shows it before asking the dragon repo for a new kind** (#3513)

  When none of the nine kinds fits what the user wants to explain, the skill now writes down what the diagram must show, writes it in the closest kind with its own blocks where they help, passes `dragon check` and `dragon check --layout`, exports it with `dragon export` (as an HTML page with `--format html` when Chromium is not installed) and shows the user the picture with the parts it could not draw. The user then decides whether that is enough or whether to ask the dragon repo for a new kind. The new section of `references/blocks.md` says to ask the user first and to open the issue with `gh issue create` and a `feat:` title, with what the diagram must show, the notation that was tried in a `dragon` fence, and what it could not draw. Before, the skill only said to ask for a new kind, with no drawing first and nothing about what the issue carries. The eval case `new-kind-issue` asks for a pie chart, which no kind can draw as slices, and checks the agent exports before it opens the issue.

- **Eight more shared blocks: `+wallet`, `+contract`, `+oracle`, `+validator`, `+queue`, `+cache`, `+gateway` and `+async`** (#3522)

  The shared block collection had only `+bridge`, `+relay` and `+key`, so diagrams the skill wrote stood in for wallets, contracts and queues with other icons or blocks of their own. Four Web3 parts (`+wallet`, `+contract`, `+oracle`, `+validator`) and three parts of general systems (`+queue`, `+cache`, `+gateway`) are rounded boxes told apart by a Tabler icon and a color role. They keep the box shape, so no text sticks out of a shape. `+async` is a dashed violet line for a message sent without waiting for an answer, told apart from the dashed amber `+relay` by its color. Each block has one example in `packages/dragon/blocks/examples/` that passes `dragon check` and `dragon check --layout` with no breaks, and the skill's `references/blocks.md` lists every shared block with what it is for. Like `+bridge`, the light entry draws the new boxes after you await `loadFor`, which reads the Tabler chunk.

### Changed

- **The dotted slot in a box shows only while a carried item sits in it** (#3518)

  Architecture and state diagrams that carry items (`[carry: coin]` or `[tag: ...]`) gave every box that sends or receives one a dotted slot right of its icon, drawn from the first step to the last. The slot filled only while an item sat in it, so the last step showed empty dotted squares in most boxes and the diagram looked unfinished. The dotted frame now fades in when an item settles in the slot or waits there before it leaves, and fades out shortly after the item leaves. Boxes keep their width and the icon stays where it was, so nothing in a box moves while the diagram plays. `dragon check --layout` reports a slot that sticks out of a shaped box at the first step an item sits in it, and no longer reports a slot no item ever sits in. The SVG fingerprints of 18 examples, 16 test fixtures and 78 catalog part figures changed with the drawing.

- **The catalog no longer loads the descriptions of every part on its first screen** (#3531)

  The script the catalog loads first carried the description of every part in both languages, 104 texts, because the page text read the whole `BLOCK_TEXT` table, though only a part's own page shows its description. Each block folder now keeps the description in its own `gallery/desc.ts`, next to the name in `gallery/text.ts`, and the build writes the descriptions to `blocks-desc.gen.ts`, which only the part page reads. A part page shows the same description as before. The script and CSS loaded first went from 186,249 to 179,131 bytes gzipped.

- **Opening the catalog's home page no longer loads the Tabler icon table (about 225KB gzipped) in the background** (#3505)

  In 0.67.0, when the catalog loaded the later examples in the background after drawing the first screen, it saw `icon tabler:` in the bridge example's definition and loaded the Tabler table too. Visitors who never opened the bridge example or the guide page loaded the table anyway. The example notation still loads in the background, and the table now loads when you open the editor or a catalog page, or when the guide page draws the figure in its "Adding blocks" section. The script and CSS loaded first went from 186,341 to 186,327 bytes gzipped.

- **The shared `+bridge` block is a rounded box with a stone bridge icon instead of an arch** (#3489)

  The shared `+bridge` drew its box as an arch. The arch left the icon slot, the box name and the step number outside the drawn shape, so `dragon check --layout` found breaks in every bridge example. `+bridge` now keeps the rounded box every other box uses (corner radius 12) and draws the Tabler stone bridge `tabler:building-bridge-2` in the icon slot, in the same `violet` role. The parsed JSON of a diagram that uses `+bridge` carries the new definition in `define`. A diagram that wants the arch can still define its own block with `shape path` at its head.

### Fixed

- **The arrow of a choice field keeps its size on pages that size every SVG** (#3499)

  In 0.66.1 dragon drew the arrow of a choice field as an SVG and sized it with a rule that a page's own CSS overrides. A page that gives every SVG inside the figure `display: block; width: auto; height: auto` made the arrow 121px wide and 73px high, over the field label and the chosen value. The arrow is now drawn with CSS borders on a `span`, not an SVG, so rules a page writes for SVGs do not reach it. It keeps the same size, and its right end stays as far from the right border as the text is from the left border.

- **A `side` row of a try diagram can place a log next to a queue, and the log shows only as many records as fit on one line** (#3506)

  A log written on a `side` row, as in `side passed, rejects`, stopped reading with an error, although the README already said a `side` row places the log. The row now takes a log too: the queue keeps the width its chips need, and the log gets the rest and lays out as many records side by side as fit in that width. A log in a `side` row shows only one line of records and folds older ones into the `N older records` label, so the row no longer grows taller and leaves space under the queue as records arrive. A log with no records yet keeps only its title instead of leaving one empty record's height. A narrow frame stacks the parts as before.

- **Japanese text that a try diagram writes no longer puts spaces between Japanese and Latin letters or numbers** (#3509)

  The step text written after a send, the record numbers, the queue hint and the stopped-at row put a space around every name or number written in Latin letters or digits, as in `送金E が送信経路を通って全体の列に入った。`, `記録 1` and `次は上から 1 件`. They now read `送金Eが送信経路を通って全体の列に入った。`, `記録1` and `次は上から1件`. English text keeps its spaces, and the layout warnings that the CLI shows to authors are unchanged. The fingerprints of the 20 examples that draw a try diagram in Japanese changed with the text.

- **Japanese text in diagrams other than try diagrams no longer puts spaces between Japanese and Latin letters or numbers** (#3517)

  The side-path note of a state diagram, the times and the numbers after scale and period names in a time diagram, the amounts before token names in a pipe diagram and the screen-reader name of the step list put a space around every number or Latin name, as in `3 つの状態から入れる`, `12 秒`, `スロット 3200`, `10 ポイント` and `注文の流れ の段`. They now read `3つの状態から入れる`, `12秒`, `スロット3200`, `10ポイント` and `注文の流れの段`. A space between a Latin name and a number, as in `slot 3200` and `100 USDC`, stays, English text keeps its spaces, and the layout warnings that the CLI shows to authors are unchanged. The fingerprints of the 46 examples that draw a state diagram with a side path or a time diagram in Japanese changed with the text.

- **`dragon export` and `exportDiagram` draw the text dragon adds in the diagram's own language when no language is passed** (#3516)

  Without `--lang` (or `lang` for `exportDiagram`), an export drew the text dragon adds to a diagram in English, so a Japanese state diagram showed `Side path`, `Not taken this time`, `Start` and `End`. The skill asks for the diagram text in the user's language but does not pass `--lang`, so this happened every time it exported a Japanese diagram. The export now draws that text in Japanese when the diagram's title or a `say` line has kana or kanji, and in English otherwise, in the PNG, MP4, GIF and HTML (including the page's `lang` attribute, the names read aloud and the overview label). A `--lang` you pass still decides. The command's own messages (usage, errors, the refusals when it cannot draw or has no Chromium, and the wording of the overlap lines) stay in English without `--lang`, and the overlap lines quote the text as it was drawn. `dragon check --layout`, `renderDiagram`, `mountDiagram` and `checkLayoutText` still default to English.

- **A tag on a line to or from the leftmost or rightmost box stays inside the diagram, and `dragon check --layout` warns when a part sticks out of the diagram** (#3515)

  A carried tag rests on the far side of the lifeline it reaches and waits on the near side of the lifeline it leaves. Next to the leftmost or rightmost box that place is outside the box, and the diagram width did not count it, so `api -> browser: 200 OK [tag: session id]` with `browser` on the left drew the tag cut at the left edge as `ession id`. Sequence and state diagrams now count where tags, envelopes and coins rest and wait, and keep the same 14px margin around them as around box names and labels. The fingerprints of the figures whose carried things sat inside that margin changed: `oauth`, the Japanese `payment`, and the state figures of the `link`, `source` and `start-finish` parts, whose envelope waited 12.5px from the top. `dragon check --layout` also reports a new kind, `part-outside-frame`, when a text, tag, step number, icon or line sticks out of an edge of the diagram, and names the step, the part and the edge, as in `Step 5: "session id" sticks out of the left edge of the diagram frame`. A part that only rests there while the steps play, such as a tag waiting to leave, is reported at the step it shows in. None of the examples has such a part. The skill's layout reference describes the kind and how to fix it in the notation.

- **The needle, the end dot and the tick labels of a time diagram stay inside the time axis panel, and `dragon check --layout` names a time axis part that reaches the panel's edge** (#3527)

  The time axis ended 2px inside the right edge of its panel. When the needle reached the right end, its head and the dot on the axis line crossed the panel border, and the right-most tick label and tick touched it, as in steps 9 and 10 of `finality` and every step of `withdraw`. The axis now ends 14px inside the panel, the same inset as the row names on the left, and starts 12px further left, so it keeps its length of 594px and the spacing of its ticks. A diagram whose long row names push the axis to the right gets a shorter axis instead. `dragon check --layout` now also checks the needle, the axis line and its ticks, the tick and period labels and the point labels of a time diagram. When one crosses the panel border or comes closer than 4px to it, the check warns with the kind `panel-edge` and names the step where it first shows and the part, as in `Step 2: "受け取った資産" reaches the edge of the time axis panel`. The fingerprints of the time diagram examples and catalog figures changed with the drawing.

- **A long line name and the amount chip of a pipe flow stay next to their line, and `dragon check --layout` reports one drawn away from its line** (#3528)

  In an architecture diagram, a line name longer than the gap between two boxes in neighboring columns was drawn above both boxes, about 50px from its line, because the gap stopped widening at 160px. The gap now widens until the name fits, as state and sequence diagrams already did, so the name sits just above its line. In a pipe diagram, the amount chip of the Router to Pool1 flow in step 4 of the `swap-retry` example was drawn about 110px below the flow and outside the housing, because the balance text under the tank and the value plate blocked the spots beside the pipe. The chip now slides along the pipe in 4px steps before it moves away, and it avoids the text under a tank by the width of each line (the balance, then the change and the state) instead of one band. `dragon check --layout` adds the kind `label-off-line`: it names the step, the text and the line when a line name or an amount chip is farther from its line than the spot dragon tries first plus the chip's own height. Amount chips now carry the `flow` they name in the layout, so the layout fingerprints of the pipe examples changed, and the drawing of `swap-retry` changed.

- **Request and reply lines between the same two boxes are drawn apart, and their step numbers no longer crowd each other** (#3521)

  In architecture and state diagrams, a request and its reply between the same two boxes, drawn in different steps, ran only 10px apart, so `dragon check --layout` reported the two lines running too close and their step numbers too close. When the two lines took the same bent path, they were drawn on top of each other and each step number covered the other line's arrowhead, and the check did not report it. The two lines are now drawn apart by the check's lower bound for side-by-side lines plus the width of a lit line, on straight and bent paths alike, and each label goes on the outer side of its own line. A step number on a line keeps at least the check's distance from the step numbers placed before it, and when the line has no free spot it moves to the side of the line, further along if needed. The drawing and the check take these distances from the same values, so they cannot disagree. `dragon check --layout` now also reports two lines between the same two boxes in opposite directions that run on top of each other. The skill no longer tells the AI to turn a reply into a note to avoid the break. Step numbers 7 and 9 of the time diagram example `finality`, which were too close, are now apart. The fingerprints of 43 figures with request and reply lines or moved step numbers changed.

- **Lines in a try diagram's network no longer run across node names, and `dragon check --layout` reports a line that crosses text** (#3524)

  In the `tx-block` example, the line of the path `node-1 - node-3` ran straight down across the node name `node-1` and through the circle and name of `node-2`. The network placed each node only by its position in a path, so when a path did not start at the sender, the node after its first node landed in the same column. Each node now sits in a column to the right of the node before it in every path, and a column whose nodes stack up and down is ordered by the average row of the nodes they link to on the left. At the default width and at phone widths (390 and 324), the lines of `tx-block` no longer cross node names or each other. `dragon check --layout` reports a new kind, `line-crosses-text`, when a line runs across a text with no label behind it, in any kind of diagram, and names the line's two ends and the text. The lines of a try network now also show in the overlap lines that `dragon export` prints. The fingerprints of the four `tx-block` examples (notation and JSON, Japanese and English) changed with the lines.

## [0.66.1] - 2026-11-08

### Fixed

- **Choice fields draw their own arrow, and wrapped fields keep their width and their label** (#3492)

  A choice field in the input strip used the browser arrow, which Chromium draws about 8px from the right border, closer than the 12px before the text. Since 0.65.3 a choice field moved to the next row grew up to its longest choice plus the base width, so the text and the arrow drifted apart. A choice field now hides the browser arrow and dragon draws its own arrow as far from the right border as the text is from the left border. Fields moved to the next row keep the width of their longest choice (or the base width, whichever is wider), and fields on the first row still grow to fill the row. The least width of a choice field also covers its label, so a long label such as `確かめるNodeのView` is not cut with an ellipsis on a field that does not grow.

## [0.66.0] - 2026-11-08

### Added

- **A pipe diagram in a narrow frame can start zoomed in so box names are readable** (#3483)

  In a frame narrower than 600px the player fits the whole pipe diagram to the frame width, so at a phone width of 390 the box names came out about 3px high and the reader had to press the zoom button to read them. Pass `zoom: "readable"` to `mountDiagram` and the diagram starts at the zoom where the smallest party name shows at 10.5px or larger, drawn with the same layout as in a wide frame. The frame grows to the height of the zoomed diagram and pans only sideways, and moving through the steps pans to the parties in each step. When those parties do not fit in the frame, the leftmost one is placed at the left edge. The zoom-out button returns to the whole diagram fitted to the frame width. When the frame width changes the zoom is worked out again, and in a frame 600px or wider the diagram is drawn at full size. Without `zoom`, and for other kinds of diagram, nothing changes.

- **`dragon check --layout` reports layout breaks per step** (#3484)

  `dragon check` reads the notation without drawing it, so a diagram could pass it and still look broken once drawn. `dragon check --layout` draws the diagram at the default width and at a phone width of 390 and reports five kinds of breaks as warnings: two step numbers too close (`badges-close`), two lines running side by side too close (`lines-close`), a step number on the rectangle of a shaped box that floats away from the shape (`badge-off-shape`), and a carry slot or a box text sticking out of a shaped box (`slot-outside-shape`, `text-outside-shape`). Each break is one line at the `step` line of the first step where it shows, with the two parts it involves, and `(at width 390)` when it shows only at the phone width. `--json` adds a `layout` object with the kind, the step, the width and the two parts. Breaks are warnings, so the exit code stays `0`. Pairs meant to touch are not reported: a line and the boxes at its ends, a group and its boxes, a step number on the corner of its box, and a step number at the start of a line next to the box it leaves. The package exports `checkLayoutText` and `describeBreak`. `dragon check` without `--layout` does not draw and prints the same lines as before.

- **`dragon export --step <n>` writes the PNG of one step** (#3484)

  The PNG was always a still of the last step, so a break that showed in an earlier step could not be exported. `--step <n>` picks the step the PNG shows, counted from 1. A step the diagram does not have exits `2` before Chromium starts. Without `--step` the PNG is the last step as before.

- **The plugin skill checks the layout and reports what is left** (#3484)

  After `dragon check` passes, the skill runs `dragon check --layout`, fixes the breaks the notation can fix (reordering boxes, shortening text, using a plain box), and names every break left by its step number in the reply, with the PNG of that step when Chromium is installed. The new reference `layout.md` lists the kinds and the fixes, and `blocks.md` tells how to send a break that only dragon's drawing can fix to the dragon repo. The plugin carries two eval cases, `layout-bridge` and `layout-payment`, and the results of running them are kept with a fingerprint of each case in `plugins/dragon/evals/record.json`.

## [0.65.3] - 2026-11-08

### Fixed

- **Choice fields in the input strip no longer clip their values** (#3485)

  The input strip of a try diagram put every field on one row and let each shrink from the same base width of 110, so a choice field with a long choice clipped the chosen value. With six fields on a 740 frame, `順序付けの遅れ` showed only its first five characters. A choice field now never gets narrower than its longest choice plus the side padding, the arrow and the border, and a field that does not fit on the row moves to the next row. A choice field also stops growing at that width (or the base width, whichever is wider) plus the base width, so a field moved to the next row stays beside the send button. Text fields still shrink as before, and the narrow two-column grid is unchanged.

## [0.65.2] - 2026-11-08

### Fixed

- **Gate records keep a try diagram within its width** (#3478)

  A gate record put `Stopped at <node>` and the error name on one row, and the record was as wide as that row. A long error name such as `SEQUENCER_REQUEST_FAILED` widened the record, so a try diagram with gate records grew past the wide width of 740 and the narrow width of 324. On a page, the first send widened the figure from 740. A gate record now puts the stopped node and the error name on separate rows, and the record is as wide as the longer of the two. The wide form places as many records side by side as fit in the width the other parts set, and wraps the rest to the next row, so sending more values does not change the figure width. In the narrow form, a route node label that comes closer than the label gap to the label on its left is drawn above its node, and a route with such labels moves its nodes down by one label row, so the labels of a five-node route no longer overlap. Try diagrams without gates, and routes whose labels do not collide, draw as before.

## [0.65.1] - 2026-11-08

### Changed

- **A pipe diagram with an opened box draws faster** (#3472)

  Finding the routes of the pipes took most of the time to draw a pipe diagram with an opened box. The route search now reuses its work arrays and its heap across searches, keeps lists only for grid edges that an obstacle or a laid line touches, works out the distance estimate once per grid point, and skips heap entries that a cheaper entry for the same state has replaced. Every pipe keeps the same route. The layouts of 28 cases (the six pipe examples in both languages at widths 1280 and 390, and `aggregator` with box 2 opened) match fingerprints recorded before the change. Drawing `aggregator` with box 2 opened at width 390 took 1.74 to 1.82 seconds of CPU time in English and 1.35 to 1.39 seconds in Japanese, and now takes 1.16 to 1.37 seconds and 1.03 to 1.08 seconds.

## [0.65.0] - 2026-11-07

### Added

- **A try diagram can stop a chip at a gate on a route node** (#3476)

  A route node let every chip through, so a try diagram could not show a transaction refused at one stage for one reason. Write `check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]` before the first step to put a gate on a node of the shortest path of the route that `ask` sends through. A sent chip checks the gates of each node it reaches in the written order and stops at the first gate it fails. The stopped chip enters no queue, its path ends at that node, the node gets a stop mark, and the `into` log gains one record with the chip, the node, the error and a mark: retryable for a gate with `retry`, and fix and resend for a gate without it. A number value compares the field as a number, and a field that is not a number fails. Other values are compared as text with `==` and `!=`. Chips that pass every gate enter their queue as before. The JSON holds the gates in `blocks.check` in the written order. A node off the shortest path, a field not in `ask`, an `into` that is not a log or has `all`, and `>=`, `<=`, `>` or `<` on a value that is not a number are refused with the line and column. A `check` inside a step of a try diagram is still refused as a pipe diagram line. Try diagrams without gates draw as before.

## [0.64.0] - 2026-11-07

### Added

- **A pipe diagram step can carry a key point** (#3464)

  A pipe diagram does not show the step body under the figure, so a point told only in the body was lost from the screen. Write `gist <key point>` in a step of a pipe diagram, at most one per step, and the player shows a note with the label "Key point" and the text after the step's arrows, in the same form at every frame width. The step list that screen readers read shows it too. In the JSON a step holds it as `gist`, and a step without one has no `gist` field. A `gist` line in another kind of diagram, a second `gist` in one step and an empty `gist` are refused with the line and column, and a `gist` field on a step of another kind of diagram is refused with its JSON pointer. Five of the six pipe examples carry key points, such as on the steps where changes stay provisional or become final.

## [0.63.2] - 2026-11-07

### Fixed

- **`dragon check` shows the shape of an edge line when its arrow has no target** (#3468)

  An edge line whose arrow lost its target (`B -> : answer`, `B ->`, or `a +relay : send` with a shared edge block) fell through to the message for an unknown line head, `A line cannot start with B`. The line rightly starts with a box id, so that message did not say what to fix. Such a line now gets the edge line message, `Write a line as <id> -> <id>: <label> [<attributes>]`, at the column after the arrow where the target goes. Lines without an arrow and edge lines that name their target keep their messages. The plugin marketplace now has a description, so `claude plugin validate` passes without a warning.

## [0.63.1] - 2026-11-07

### Fixed

- **A try diagram shows chip names whole, and its typed fields take at most 12 characters** (#3458)

  A try diagram cut a chip's name, the value of the first field, to the 4 characters of a column diagram's `item` label, so a choice `Alice` showed as `Alic` in queue chips and in the rows of log records. Names the author writes in `choose` lines, `item` lines and `ask` lines of example steps now show whole, and chips, queues, blocks and records grow to fit the name. Fields without a `choose` line in the input strip, and the field that edits a chip, take at most 12 characters, and a name the reader types shows whole too. Fields with a `choose` line stay select boxes, and the 4-character limit of a column diagram's `item` label does not change. Try diagrams whose names have 4 characters or fewer draw as before.

## [0.63.0] - 2026-11-07

### Added

- **A skill that teaches AI to write dragon diagrams, and `dragon check`** (#3455)

  The repository is a Claude Code plugin marketplace. `/plugin marketplace add cardene777/dragon` and `/plugin install dragon@dragon` install the `dragon` skill, which tells an AI agent how to pick a kind of diagram, write it in the notation with `step` and `say`, check it, and show it on a docs site, in a README as an exported image, or in an app. Other agents can copy `plugins/dragon/skills/dragon`. The plugin version matches the npm version. The new command `dragon check <file>` reads `.dragon` files, the `dragon` fences of Markdown files, or stdin (`-`) without drawing, and prints each problem as `<file>:<line>:<column> error|warning <message>`. It exits with 1 when there is an error, 0 when there are only warnings, and 2 for a missing file or an unsupported extension. `--json` prints the problems as JSON. `dragon --version` prints the version.

- **Shared blocks** (#3455)

  Blocks in `packages/dragon/blocks/` (one definition per file) can be used as `+name` without a definition at the head of the diagram. The first ones are `+bridge`, `+relay` and `+key`. A definition at the head of the diagram wins over a shared one with the same name, and a parsed diagram copies the shared definitions it used into `define`. Add a shared block with a pull request that adds one definition file and one example.

- **The script entry draws Markdown fences** (#3455)

  The one script line also replaces `<pre><code class="language-dragon">`, the HTML that Markdown renderers make from a ```dragon fence.

### Fixed

- **Pipe diagrams read on a phone** (#3450)

  In a frame narrower than 600, a pipe diagram is laid out no narrower than the width at which balance text shows at 10.5px, and the part wider than the frame scrolls sideways. With every box open, the `aggregator` example in a frame of width 390 shows balances at 10.5px instead of 7.25px. Under the diagram, a band shows the step number and title, and below it each movement of the step as one arrow from the sender, with the amount, to the receiver. A check step shows its label and expression in one framed line, and a revert step shows the reason once and the path the revert traveled in one frame. The four-column call table is replaced by a folded call results list that shows the transaction first and the returned calls below it in three columns.

## [0.62.0] - 2026-11-07

### Added

- **A try diagram can limit the names a queue takes and gather one chip from each of several queues** (#3453)

  Write `accept` on a queue line, `queue <name> [order: <field>, accept: <name>]`, and the input strip sends only chips with those names into the queue. Wrap two or more names as `accept: "<name>, <name>"`, and the JSON holds them as an array. A chip with a name not written is not sent, and no queue changes. On the page the send button cannot be pressed, and the reason names the queue and the name. An `ask` in the author's example steps that sends a name the queue does not accept, and a name in `accept` that is not a choice of the first field when that field has a `choose` line, are refused with the line and column. Write two or more queues in a button's `from` as `from: "<queue>, <queue>"`, and pressing it gathers the top `take` chips of each, in the written order, into one block or record, and the `all` mark of a log is decided by every chip gathered. While any of those queues holds fewer than `take` chips, the press is refused naming that queue, and the button cannot be pressed on the page. In the JSON, `from` stays a single id for one queue and becomes an array of ids for two or more. Diagrams without `accept` or two or more queues in `from` draw as before.

## [0.61.0] - 2026-11-07

### Changed

- **Stepping through a diagram reuses the figure** (#3445)

  The player no longer copies the whole SVG each time it moves to another step. It changes the step variables on the same figure and rewinds every animation in it to the start with Web Animations, so each step still plays from its beginning. Where `getAnimations` is missing, such as jsdom, the player skips the rewind and still moves to the step. In the `aggregator` example with every box open, one step in Chromium went from a median of 25.0ms to 12.4ms. Focus on a box link inside the figure stays when the step changes.

### Fixed

- **Pipe diagrams keep parts and lines apart** (#3418)

  A pipe diagram drew parts and lines on top of each other, and its pipes tangled. The layout now follows a table of rules: the space between parts, where a line may pass a part, how far lines keep apart and how they cross, at most four bends on a line, and no segment shorter than 16. No example or generated diagram breaks any of them. Value pipes that end at the same pool for the same token share one trunk, and the layout leaves room around valves. In the `aggregator` example with every box open, crossings between call pipes and value pipes fell from 26 to 14, and crossings between call pipes fell from 25 to 8. At a width of 390 the diagram fits the frame and shows the balances and the current step title larger. The full entry exports the rule table `PIPE_RULES` and `pipeViolations`, which counts the rules a laid-out pipe diagram breaks. The scene types `PipeCallout` and `PipeTone` were removed, and `PipeChip`, `PipeCrossing`, `PipePort`, `PipeStub` and `PipeValuePipe` were added.

## [0.60.0] - 2026-11-07

### Added

- **A try diagram can route chips by a chosen value and gather them into a `log` without a chain** (#3441)

  When the input strip's `into` names a field, a sent chip enters the queue whose name matches the value chosen for that field. Give that field a `choose` line and place a queue named after each choice. A field without a `choose` line, and a choice with no queue of the same name, are refused with the line and column. The new part `log <name> [all: <field> = <value>, yes: <mark>, no: <mark>]` is a log, and when a button's `into` names it, the button gathers the top `take` chips of its queue into one numbered record. A record holds only its number and the names and field values of its chips, and unlike a chain it has no `prev` or `hash`. With `all`, a record shows the `yes` mark when that field of every chip in it has the value, and the `no` mark when even one differs. Diagrams without a log draw as before.

## [0.59.0] - 2026-11-07

### Added

- **The short form leaves out declarations and steps** (#3438)

  Sequence, architecture and state diagrams can be written as just the diagram kind on the first line and lines joining boxes with `->`. A diagram with no `box` line makes a box of each name on the lines in the order the names appear, and a diagram with no `step` line makes each line one step, lit in the order written. A step without `say` uses the line label as its body, and a line without a label uses the box names joined by an arrow. When two box names in a diagram without box declarations differ by one character, `parseNotation` still reads the diagram and puts a notice in `notices` of its result, the editor shows it where errors appear, and the export command prints it to standard error. Names that differ only in digits are not pointed out. A line outside the steps of a diagram that has steps, and a name that is not declared in a diagram with at least one `box` line, are still errors. Printing JSON back to the notation leaves out what can be left out. The README and the notation guide now have AI write the notation too and fix it from the parser's error messages.

## [0.58.0] - 2026-11-07

### Changed

- **A try diagram puts the step caption and progress right under the figure** (#3437)

  A try diagram now stacks the figure, the step caption with its progress bar, and then the input strip. The caption tells what changed in the figure after the reader pressed a button, so it sits directly under the figure instead of below the input strip. In an exported HTML page, the bottom margin moved from the caption bar to the player, so the input strip at the bottom keeps the same distance from the window's bottom edge. Diagrams other than try diagrams keep their order and spacing.

## [0.57.0] - 2026-11-07

### Added

- **Parts of a try diagram can sit side by side** (#3429)

  Write `side <part>, <part>` before the first step, and when the frame is wide, the named route, queue, and chain parts sit on one row, left to right in the written order. A queue on the row takes only the width its chips and title need, and the route and chain share the rest, so a try diagram with a route and a queue on one row is lower than the same parts stacked. When the row would shrink the text below a readable size, the parts stack as they do without the line. A `side` line stops with an error naming the line and column when it names a part the diagram lacks, the input strip, or a button, when it has fewer than two parts, when a part is already on another `side` line, or when it comes after the first step.

## [0.56.0] - 2026-11-06

### Added

- **Fields of a try diagram's input strip can offer choices** (#3422)

  Write `choose <field>: <value>, <value>` before the first step, one line per field, and the reader picks that field's value from the choices in the written order instead of typing it. The field opens with the first choice selected, the first field (the chip's name) takes choices too, and changing that field of a chip inside a block picks from the same choices. A `choose` line for a field the strip lacks, a second `choose` for the same field, fewer than two choices, and an `item` or a step's `ask` with a value outside the choices stop with an error naming the line and column. Fields without choices stay free text as before.

### Changed

- **The player controls take a new layout in every kind of diagram, and pipe diagrams are redrawn** (#3398)

  The player now shows the step number and a large step title, a short description under the title, the restart, previous, named play, and next buttons, and a progress bar split by step. When the strip is 640px or wider, the title and the buttons share one row; narrower strips stack them. Pipe diagrams are laid out again from tanks, value pipes, token boxes, and valves: water levels move, liquid flows through the pipes, valve handles turn, and gauge needles swing. A pipe diagram wider than its frame scrolls sideways inside the frame with a thin line showing where you are, instead of shrinking. The new palette `sea` (navy and ecru) keeps the call, confirm, check, and cancel colors apart for color-blind readers too. In `arcade`, the boxes of a pipe diagram have cut corners. Exported HTML carries the unfolded source, so a reader can press a box to open its inner steps.

## [0.55.1] - 2026-11-06

### Fixed

- **A try diagram read from notation can be placed with the light entry and the script entry** (#3416)

  Since 0.54.0, placing a try diagram read with `parseNotation` through the light entry or the script entry stopped with an error that the schema check was not loaded, even after awaiting `loadFor`. `mountDiagram` copies a try diagram to start from the writer's first step and copies it again each time the reader sends a value or presses a button, and the copies lost the mark that lets a diagram read from notation skip the check. The copies now keep the mark, so the page places the diagram and redraws it without loading the schema check. A try diagram built from JSON still asks you to await `loadFor` first.

## [0.55.0] - 2026-11-06

### Added

- **The playground shows how to add your own blocks** (#3407)

  The docs page has an "Adding blocks" section after pipe diagrams, with an example that adds a box, a line, and an icon, and the code for reading definitions from a page's `<link rel="dragon-blocks">` and with `readBlocks`. The same example is in the editor's samples under architecture.
  The light entry exports `definesBlocks`, which tells whether notation has block definitions, so a page knows to await `loadReadings` or `loadFor` before reading it.

### Fixed

- **The editor draws notation with block definitions when it is opened directly** (#3407)

  Opening the editor with such notation in its link, or typing a `blocks 1` line, showed an error until something else had loaded the definition reader. The editor now waits for the reader and reads the notation again when it arrives.

- **Chips in a place with no order sit on a grid** (#3408)

  A place written `box <name> [order: none]` shifted each chip by up to 4px up or down and 6px sideways, so the tops of chips in the same row did not line up and the place looked broken rather than unordered. Chips now take the width of the widest chip and sit on a grid, with their tops aligned in each row and their left edges aligned in each column.
  The dashed outline and the "No order" text under the name still show that the place has no order. The room kept for the shift is gone, so the place is 8px shorter.

## [0.54.0] - 2026-11-06

### Changed

- **A page that draws notation loads less script first** (#3400)

  A diagram read from notation with `parseNotation` skips the schema check when it is drawn, because the parser only builds diagrams the check accepts. Values that go into the SVG and the page as they are (the `path` of an added block, the `link` of a box, and the `url` of a source) are still checked, so a parsed diagram rewritten with an unsafe value is refused.
  The light entry and the script entry no longer load the schema check up front. `loadFor` loads it when you pass JSON, and `loadKind` and the new `loadValidator` load it as well. Reading or drawing JSON with the light entry before that stops with an error that tells you to await `loadFor`. The script entry's first load is about 68KB gzipped, down from about 95KB.

## [0.53.0] - 2026-11-06

### Added

- **You can add your own blocks in your own project** (#3399)

  Base a block on a box, a line, or an icon and change its shape and color role. Write the definition after a `blocks 1` line from `block +<name>` to `end`, or as JSON with `"format": 1`, and write `+<name>` in place of `box`, in place of `->`, or as `[icon: +<name>]`.
  A shape is a named shape (`round`, `circle`, `cylinder`, `diamond`, `hexagon` for boxes, `solid`, `dashed`, `dotted` for lines) or a `path` of path syntax only. The block keeps the placement and motion of its base and reads its colors from the palette table.
  Definitions are read at the head of a diagram, from a page's `<link rel="dragon-blocks">`, or from the new `readBlocks` passed as the `blocks` option of `parseNotation` and `renderDiagram`. A definition without its version line, or with URLs, code, or SVG elements, is refused.

- **Added the pipe diagram (`pipe`), which follows the calls, balances, and stored values inside one transaction step by step** (#3389)

  Start the first line with `pipe` and declare the parties with `box`. Whether each party is a sender, a contract, a token contract, or an account comes from the lines.
  Before the first step, `hold <owner>: <amount> <token>, ...` declares balances and `hold <contract>: <name> <value>` declares a stored value. Inside a step, `move` moves a balance through a token's pipe, `write` rewrites a value plate, `check` shows a gauge, `emit` stacks an event chip, and `calc` shows a converter card.
  A line `<caller> -> <callee>: <text>` opens a call lane. `[value: <amount> ETH]` sends ETH with it, `[call: delegate]` and `[call: static]` set its kind, and `[fold]` folds its inner steps into one box that the reader opens by pressing it. `return` closes the innermost open call, and `revert` fails it and rolls back only the changes inside it. A check on values that are not numbers fails only with `[fail]`.
  Tank levels are drawn to scale for each token. Changes stay hatched as provisional until the outermost call returns and then turn green as final, and rolled-back changes are marked red. In a narrow frame, the columns of parties a step does not touch fold into thin strips.
  The examples are `swap`, `swap-revert`, `swap-two-hops`, `swap-retry`, `vault-proxy`, and `aggregator` in `packages/dragon/examples/`.

## [0.52.0] - 2026-11-06

### Changed

- **The READMEs now open with the idea behind dragon** (#3391)

  The repo and package READMEs, in English and Japanese, have a section before Install on how dragon builds diagrams out of core blocks, kind blocks, and connector blocks with one look, how blocks and diagram kinds are added today (a pull request or a fork), and how it aims to be as easy as mermaid to write and show.
  The repo READMEs also show the one-line script entry in the first diagram, and list all eight diagram kinds.

- **Figures drawn with `arcade` draw the bends of their lines as square corners, the same as the bitsumi article figures** (#3358)

  A bend that turns 45 degrees or more is no longer rounded, so the two segments meet at the bend point. Lines drawn as curves through many points, such as git branch lines and a loop back to the same box, keep their rounding of radius 12 because each of their turns is gentle.
  The joins of lines and arrowheads are sharp. Icon strokes keep round joins, and line ends stay round so dotted lines stay dotted.
  The rule applies to palettes with the `cut` corner shape, which is only `arcade`. Figures drawn with `clear`, `paper`, and `night` do not change.

## [0.51.0] - 2026-11-05

### Fixed

- **A page that loads the one-line script by version range no longer breaks for up to 7 days after a patch release** (#3375)

  jsDelivr resolves a range URL such as `@0.50` per file and lets the browser keep it for 7 days, so an entry kept from an older patch fetched its chunks from the newer patch, where renamed chunks are missing.
  `dist/cdn/dragon.js` is now a small loader that reads the main script `dist/cdn/dragon-main.js` from its own exact version, so the main script and every chunk come from the same version. From a location without a version in the URL, it reads the main script next to it.

## [0.50.0] - 2026-11-05

### Added

- **One script line and a `<pre class="dragon">` block now put a playing diagram on any HTML page** (#3343)

  Load `https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@<major.minor>/dist/cdn/dragon.js` with `<script type="module">`, and every `<pre class="dragon">` block on the page turns into a diagram. A block with a notation error shows its error lines in its place instead.
  The script loads only the renderers of the kinds the page uses, adds the font CSS from jsDelivr to the page once, and uses Japanese when the page's `lang` starts with `ja`.
  The new `dragon embed <HTML file>` command replaces that line with a bundled script holding every kind and writes a single file that fetches nothing from outside. It draws in the device's fonts.

## [0.49.0] - 2026-11-04

### Added

- **A narrow frame now draws an interactive diagram stacked at full size instead of shrinking it** (#3366)

  When the `width` you pass is too narrow to read the wide arrangement, the interactive diagram is laid out at the frame's width: the route's nodes pack into the width, the queue fills it, the blocks stack from oldest at the top, and each link runs around the right of the blocks.
  The player re-arranges by the frame's width and redraws at the same width after the reader sends values and builds a block. A 324px frame keeps the fixed view and full-size text.
  The interactive layout now carries its `arrangement`, and a chain's `slots` are the top-left points of its blocks.

### Changed

- **The gallery is now built from the block folders, and its sections are named Core blocks and Kind blocks** (#3350)

  The gallery list, each part page, the editor shelf, the block paragraphs on the docs page, and the parts table in `docs/design/base/GRAMMAR.md` are now built from the `gallery/` files of each block folder, in block order (`rank` in `block.ts`). No block name is listed by hand in the site.
  Each block's `gallery/` now also holds `uses.ts` (how a part page finds the examples that use the block's words), and `shelf.ts` builds the shelf parts as well as naming them.
  The two gallery sections are now named Core blocks (blocks that several diagram kinds use) and Kind blocks (blocks for one diagram kind). Parts, shelf items, and docs paragraphs now appear in block order, and the action paragraph moved from the Edges section to the Steps section.
  The `dragon-extend` skill now lists six places to touch outside the block folder when adding a block.

- **The light entry now loads a block's reading only when the written diagram uses it** (#3349)

  Each block folder now splits into `block.ts` (name, order, attach type, words, and the lines it reads) and `read.ts` (reading, printing, and messages).
  The light entry `@cardenelabs/dragon/light` holds the core blocks and the blocks of `sequence` and `architecture`. Await `loadFor` with the notation or JSON you are about to read, and it loads that kind's renderer and only the blocks that diagram uses.
  `loadKind` now also loads every block of the kind. `loadReadings` loads only the blocks, without the renderer, and `diagramKind` returns the kind of a notation or JSON before you read it.
  This changes how the light entry is used: reading `git`, `lineup`, `state`, `time`, `tree`, or `try` notation now needs `loadFor` or `loadKind` first, and reading a line of a block that has not been loaded stops with an error that names the block.
  The default entry `@cardenelabs/dragon` still holds every block and reads every diagram without waiting.

### Fixed

- **Following a stacked lineup now keeps the current step's lanes in the window** (#3365)

  A lineup draws its step number beside the heading at the top, in the same place on every step. The window moved back toward that number, so in a narrow frame it stayed at the top of the figure and the step's lanes fell outside it.
  The follow window no longer draws the heading text (the figure title, the step title, and its explanation), starts below it, and moves to the lanes the step changes. The player's bar shows the step title and explanation.
  The fixed view still draws the heading.

## [0.48.0] - 2026-11-04

### Added

- **Added the try diagram (`try`), a figure readers can type values into and move themselves** (#3337)

  Start the first line with `try` and stack part lines from top to bottom: `route` (a network that carries chips along the shortest path), `queue` (a waiting line sorted by one field), `chain` (blocks linked by `prev` and a SHA-256 `hash`), `ask` (the input strip whose fields make a chip), and `press` (a button that moves the top chips of a queue into a new block).
  Declare chips with `item <name> [<field>: <value>]`. Inside a step, `line`, `ask`, `press`, and `item` write the author's example steps (send, build, change).
  In the player, the figure waits at the first step. Each time the reader sends, presses a button, or taps a chip in a block to change a value, the player adds one step to the end and plays it. Changing a block breaks its link to the next block (`≠`), and changing it back heals the link.
  Nothing the reader types is stored, and the page makes no requests. Images, videos, and print draw the steps the author wrote.
  The example "How a transaction gets into a block" is `packages/dragon/examples/tx-block.dragon`.

- **Added the palette `arcade` (Arcade screen), drawn in the same colors as the bitsumi pages** (#3341)

  The ground, text, and lines use the bitsumi values (the figure ground is `#04100a`), green is the bitsumi accent green `#3cff78`, and amber is the bitsumi orange shifted slightly toward red (`#ff9a45`) so it stays apart from green for deuteranopia.
  Blue, violet, and rose were chosen again to sit on the green ground, and the five colors keep the separation the other palettes keep (15 or more for normal vision, 6 or more for the three color vision types).
  The light and dark themes use the same values, and the palette draws no shadows.
  Pass it as `palette: "arcade"` or `dragon export <file> --palette arcade`. The palette switches in the catalog and the editor show it as "Arcade screen", and choosing it makes the site accent green.
  The values of `clear`, `paper`, and `night` do not change, and the default is still `paper`.

- **Figures drawn with `arcade` cut the top-right and bottom-left corners of their boxes, the same shape as the bitsumi pages** (#3344)

  Boxes, regions, and the figure frame lose 8 at the top-right and bottom-left corners, or a quarter of the shape's width or height when that is smaller. This is the same cut as the boxes of the bitsumi article figures.
  Small parts (icon tiles, chips, tags, and marks) are drawn with square corners, so no rounded corner remains.
  An exported HTML player clips its frame to the same shape and draws its buttons and highlight marks with square corners.
  Each palette in the palette table (`palettes.json`) now has a corner shape (`corner`, either `round` or `cut`), and only `arcade` has `cut`. Figures drawn with `clear`, `paper`, and `night` do not change.

### Changed

- **The source JSON is now version 2, which lists the blocks placed on a diagram under a field for each block name (`blocks`)** (#3346)

  Version 1 kept groups, boxes and the strip at the top, and branches, untaken paths and time diagram fields under a field for each diagram kind.
  Version 2 has a field for each block, so adding a block adds no top-level or diagram-kind field.
  The sequence lifeline field (`sequence.lifelines`) can be rebuilt from the order of the boxes, so version 2 does not write it.
  The source check function is built from the skeleton shape and the shape of each block.

  Version 1 sources can still be read as they are.
  `readDiagram`, `renderDiagram` and `printNotation` move a version 1 source to the version 2 shape first, and `readDiagram` notes the move in `warnings`.
  Errors in a version 1 source point at the version 1 field.
  The source returned by `parseNotation` has the version 2 shape.
  To rewrite a source file to version 2, use `migrateFile` from `@cardenelabs/dragon/node`.

  | Version 1 field | Version 2 field |
  |---|---|
  | `regions` | `blocks.group` |
  | `boxes` | `blocks.box` |
  | `strip` | `blocks.strip` |
  | `sequence.lifelines` | None (built from the order of the boxes) |
  | `state.paths` | `blocks.path` |
  | `git.branches` | `blocks.branch` |
  | `time.scale`, `time.period`, `time.rows`, `time.points`, `time.zoom` | `blocks.scale`, `blocks.period`, `blocks.row`, `blocks.point`, `blocks.zoom` |
  | `lineup.items` | `blocks.item` |
  | `lineup.roles` | `blocks.role` |

## [0.47.0] - 2026-11-03

This version changes the text shown when no language is passed, so the second number went up.

### Changed

- **Text shown when `lang` is not passed is now in English** (#3338)

  Without `lang`, notation error messages, field error messages, the names the player reads aloud, the overview labels, and the export command's usage and messages were in Japanese.
  The English README examples do not pass `lang`, so a page that used them as written showed Japanese text.
  The default is now English, and it is set in one place (`DEFAULT_LANG` in `packages/dragon/src/words.ts`).

  To keep the Japanese text, pass the language explicitly.

  - `parseNotation(text, { lang: "ja" })`, `validateDiagram(input, { lang: "ja" })`, and `readDiagram(input, { lang: "ja" })`
  - `mountDiagram(host, diagram, { lang: "ja" })` and `renderDiagram(input, { lang: "ja" })`
  - `exportDiagram(input, { ..., lang: "ja" })` and `dragon export <file> --lang ja`

## [0.46.4] - 2026-11-03

This version only has a change that does not change what input is accepted, so the third number went up.

### Fixed

- **Playing a diagram whose boxes have links no longer hides those links from screen readers** (#3329)

  The player hid every SVG it placed from screen readers (`aria-hidden="true"`) and had the step list read instead.
  Since boxes can carry links (#3199), a playing diagram kept those links reachable with Tab while hiding them, which axe reports as `aria-hidden-focus`.
  An SVG that contains a link is now placed as a group (`role="group"`) that keeps the diagram title as its `aria-label`, and an SVG without links is hidden as before.

## [0.46.3] - 2026-11-03

This version only changes the package description on npm, so the third number went up.
It also carries the 0.46.2 change to the Japanese README, which was not published to npm.

### Changed

- **The package description on npm is now in English** (#3327)

  The description was in Japanese and named only sequence and architecture diagrams.
  It now starts with the first sentence of the README and names no diagram kinds, so adding a kind does not leave it out of date.

## [0.46.2] - 2026-11-03

This version changes only the catalog; the code in `packages/dragon/` is the same as 0.46.1, so it was not published to npm.

### Changed

- **The changelog is now in English, and the Japanese changelog moved to `CHANGELOG.ja.md`** (#3321)

  `CHANGELOG.md` covers every version from 0.35.0 on in English, and `CHANGELOG.ja.md` keeps the full Japanese record, including the versions before 0.35.0.
  The button on the catalog's release notes page opens `CHANGELOG.ja.md` on the Japanese page and `CHANGELOG.md` on the English page.

## [0.46.1] - 2026-11-03

This version only has changes that do not change what input is accepted, so the third number went up.

### Changed

- **When a misspelled icon name is close to a real one, the error message now shows that name** (#3315)

  Until now the message listed every available icon name, so writing `usr` when you meant `user` still meant searching a long list.
  A name whose case-insensitive edit distance is 2 or less, and smaller than the length of the written name, counts as close, and only that name is shown.
  When no name is close, every name is listed as before.
  This applies to the error messages of both the notation and the source JSON, in both Japanese and English.

- **The README is now in English, and the Japanese README moved to `README.ja.md`** (#3317)

  The repo and package READMEs are now in English and open with what the tool does, where the catalog is, how to install it, and a first diagram, in that order.
  From this version, the npm page shows the English README.
  The Japanese READMEs are in `README.ja.md` and `packages/dragon/README.ja.md`, and the sections for developers moved to `CONTRIBUTING.md`.

## [0.46.0] - 2026-11-02

A diagram with a misspelled icon name now fails when it is read, so the second number went up.

### Changed

- **In a diagram whose boxes have no icons, box names now sit in the middle of the box** (#3307)

  Names were placed at the height used to put them under an icon, so even boxes without an icon had their names below the middle.
  Names are placed in the middle of the box only in a diagram where no box has an icon or a slot frame.
  A diagram with any box that has an icon or a slot frame places names as before, to keep names on the same row at the same height.

- **In diagrams that put names in the middle, the small text under a box now sits close to the name** (#3309)

  The caption (`note`) stayed at the bottom edge of the box and looked far from the name.
  The gap to the name is now the same as in boxes with an icon, and the name's height does not change.

### Fixed

- **Unknown icon names are now errors when the notation and the source are checked** (#3311)

  A misspelled icon name used to pass silently, and nothing was drawn in the diagram.
  It is now an error that points at the attribute in the notation and at the `icon` field in the source JSON, and the error message lists the available icon names.
  A name like `constructor`, which used to draw an empty icon frame, is refused by the same check.

## [0.45.8] - 2026-11-02

This version changes only the catalog; the code in `packages/dragon/` is the same as 0.45.7, so it was not published to npm.

### Changed

- **Gathered the characters the catalog uses into one font file, so fonts arrive sooner on a first visit** (#3296)

  The font files loaded on the home page went from 35 files (757KB) to 3 files (214KB).
  Characters missing from the cut-out font are loaded from the existing font files, so text typed in the editor shows in the same font.
  The glyphs and the typesetting do not change.

## [0.45.7] - 2026-11-02

This version changes only the catalog; the code in `packages/dragon/` is the same as 0.45.6, so it was not published to npm.

### Changed

- **On a first visit, the catalog now shows its text without waiting for the font declarations** (#3292)

  What loads first went from 203.2KB to 168.5KB.
  On a device opening it for the first time, the text shows first, and the font switches when the font files arrive.
  On later visits it reads the font declarations before drawing, so the device's fonts never show in between.

## [0.45.6] - 2026-11-01

This version changes only the catalog; the code in `packages/dragon/` is the same as 0.45.5, so it was not published to npm.

### Fixed

- **Fixed the whole page turning into just a reload button when a dropped connection kept the guide or catalog page from loading** (#3288)

  The page now reloads itself once automatically. If it still cannot load, it shows "Could not load the page" and a button.
  After reloading, the chosen language goes back to the device setting.

## [0.45.5] - 2026-11-01

### Fixed

- **Fixed what happens in a step where the needle stops falling outside the window when following a time diagram** (#3284)

  In a step that does not move the needle, the window now moves, starting from the step number circle, to the points whose labels change and the things that move in that step.
  A step that moves the needle keeps the needle in the window as before.

## [0.45.4] - 2026-11-01

This version changes only the catalog; the code in `packages/dragon/` is the same as 0.45.3, so it was not published to npm.

### Changed

- **Took the catalog's guide page and parts list pages out of the first load, making the first view lighter** (#3280)

  The script and CSS loaded first went from 226.8KB to 203.0KB gzipped.
  The removed pages load in the background after the first screen is drawn, so there is almost no wait even on a first visit.

## [0.45.3] - 2026-10-31

### Fixed

- **Fixed the step buttons sitting outside the first screen in the editor at phone width** (#3274)

  A follow view diagram with a strip no longer shows the overview when the frame is narrower than 440px, and puts the strip right below the window.
  The diagram is shorter by the height of the overview, so the buttons are visible without scrolling on 360px and 390px wide screens.
  The window size and the overview at frame widths of 440px or more do not change.

## [0.45.2] - 2026-10-31

### Fixed

- **Fixed the right side of the strip running outside the window and becoming unreadable in follow view diagrams** (#3270)

  The strip now sits below the window and the overview, wrapped to the width of the diagram frame. Its values are visible in every step and do not overlap moving lines.
  In a step where only strip values change, the step number circle appears in the corner of the strip, and the window does not move in that step.
  The diagram becomes taller by the height of the strip, and in a frame of fixed height the window becomes shorter.

## [0.45.1] - 2026-10-31

This version changes only the catalog; the code in `packages/dragon/` is the same as 0.45.0, so it was not published to npm.

### Fixed

- **Fixed the editor's status field showing "0 boxes" for a git graph** (#3261)

  The status field now counts the main part of each diagram kind, using the same names as the parts pages.
  A git graph shows "3 branches", a time diagram "2 rows", and a lineup diagram "5 lanes", and a tree diagram counts its leaf and parent boxes.

- **Fixed "Loading" and the reload button, shown while a kind page waits for its diagram, sitting outside the first screen** (#3264)

  The text and button now sit toward the top of the diagram frame, so they are visible on opening without scrolling. The frame's height is unchanged.

## [0.45.0] - 2026-10-31

### Added

- **Added the light entry `@cardenelabs/dragon/light`, which loads each diagram kind's renderer when that diagram is drawn** (#3248)

  The light entry loads and registers a kind's chunk when you await `loadKind`, and drawing a kind that has not been loaded stops with an error that includes the kind's name.
  The default entry `@cardenelabs/dragon` still holds every kind, and its drawing functions stay synchronous and are called the same way.
  The catalog moved to this entry, and the script and CSS it loads first went from 246.8KB to 226.1KB gzipped.

### Changed

- **Cut what the catalog loads first by the notation of the examples and part diagrams** (#3246)

  The catalog put the notation of every example and part diagram in the script it loads first, so what it loaded first grew each time a diagram kind was added.
  Apart from the three examples on the home page and the first example in the editor, the example notation and the part diagram notation are each split into one chunk, loaded in the background after the first screen is drawn.
  The script and CSS loaded first went from 277.6KB to 246.4KB gzipped. Opening a catalog page before the chunk arrives reserves the height of the diagram frame first, and if the chunk cannot be loaded, a "Reload" button appears in the diagram frame.
  The 290KB page size limit now applies to the script and CSS a page loads first.

### Fixed

- **Fixed the bottom of tall example diagrams in the catalog being cut off outside the frame** (#3250)

  On an 800px tall screen, the bottom of six examples, including the Merkle tree and OAuth, was cut off outside the diagram frame and could not be seen without scrolling down inside the frame.
  A diagram that does not fit the frame even when shrunk to the minimum box name size (11px) now stretches the diagram frame to the diagram's height and shows the whole diagram.
  A diagram that, once stretched, would not fit the screen minus the top bar is shown with a window that follows the current step and an overview, keeping the step buttons and the step body on the first screen.

- **Recorded the `minimatch` vulnerability found in a development tool dependency as accepted, after confirming the vulnerable code is not reached** (#3251)

  Only the 11.x line has the fix, and it is outside the range the ESLint packages accept. The package's dependencies do not change.

- **Fixed the editor showing the previous diagram's counts as a successful read while waiting for a diagram kind's renderer** (#3259)

  While waiting for the renderer, the status field shows "Loading", and it switches to the new diagram's counts when the renderer arrives.

## [0.44.0] - 2026-10-30

### Added

- **Chips moving between lanes and changing order can now be drawn as a lineup diagram** (#3239)

  Added a new diagram kind, `lineup`. `box` lines become long horizontal lanes, and `item <名札>, <名札> [color: <色>, label: <字>]` before the first step declares the chips to line up in the lanes.
  Inside a step, `line <列>: <チップ>, <チップ>` writes a lane's order, and a chip that was in another lane slides over from its seat. `seal <列>` covers a lane with a striped seal that hides its contents, and `open <列>` opens it.
  `pick <列>` colors the edge of the chosen lane and fades the other lanes, and `stamp <列>: <字>` puts a stamp on the right of the lane. A lane holds up to 12 chips, and the diagram's width does not change with the number of chips.
  Added a 7-step example (`auction`) where builders' bids decide what goes in a block, a lineup diagram category and five parts (chip, lane order, seal, pick, stamp) to the catalog, and a lineup diagram group and notation quick-reference rows to the editor's shelf.
  Lineup diagrams have no lines or actions in boxes, so the catalog's line, line label, carrier, icon, link, and action parts are drawn with every diagram kind except the lineup diagram.

- **Made a skill for adding one diagram kind or part when no diagram fits what you want to explain** (#3245)

  Added `/dragon-extend`. It first checks whether the existing parts can draw it, has you pick what to add from sample drafts, adds it along the ikkan flow from the notation through the catalog, the editor, and the notation docs, and asks whether to release a version after merging.
  The places to register when adding are kept in `references/registry.md` as two tables, one for diagram kinds and one for parts, and a check fails when a file changed by the merges that added the tree diagram, the lineup diagram, and box links is missing from the tables.

### Fixed

- **Tree diagrams no longer show the dotted path of a line to a box that has not appeared yet** (#3240)

  A line's dotted path shows the route from the first step, but boxes in a tree diagram appear step by step, so the Merkle tree example showed a dotted arrow from the block header to the root before the root appeared.
  The dotted path of a line that does not run along a tree line now appears together with the tree boxes at both ends.

- **Example descriptions in the catalog no longer show work item numbers** (#3240)

  Descriptions come from the first comment line of the example file, so six example descriptions showed numbers like `(#3233)`. The numbers were removed from the first line of the example files.

## [0.43.0] - 2026-10-30

### Added

- **Trees that branch into parents and children can now be drawn as tree diagrams** (#3233)

  Added a new diagram kind, `tree`. Inside a step, write a leaf with `leaf <名札> [hash: <値>]` and a parent with `node <名札> of <子>, <子> [hash: <値>]`, and each box appears in the step that writes it.
  The root sits at the top in the middle, leaves line up from the left in written order, and a parent sits above the middle of its children. A leaf with a value shows the value in its box and its id on a card below the leaf.
  A carrier on a line between a parent box and a child box runs along the tree line, and a tree line it has passed keeps the carrier's color. From the step where a carrier first passes a tree line, only the boxes that sent or received a carrier are drawn strongly.
  Added an 8-step example (`merkle`) that proves a transaction with a Merkle tree, a tree diagram category and two parts (leaf and card, parent node) to the catalog, and a tree diagram group and notation quick-reference rows to the editor's shelf.

- **Added how to write tree diagrams to the guide page, the README, and the notation guide** (#3235)

  The guide page has a tree diagram section after the time diagram section, explaining the `tree` header line, the `leaf` and `node` declarations, the `[hash: ]` value, and carrier lines between parent and child boxes, with an example.
  The example is a 4-step diagram of a Merkle tree cut down to 4 leaves, and the section's exit link goes to the tree diagram page of the catalog.
  The two READMEs and the notation guide (`packages/dragon/examples/quick-start.md` and its English version) also gained the tree diagram lines and the same example.

## [0.42.2] - 2026-10-30

### Changed

- **Export no longer embeds the same characters in two font files** (#3213)

  The bundled `Noto Sans JP` covers Latin letters and spaces in the ranges of both the numbered files and `latin`, and export cut down and embedded the same characters in both.
  When ranges overlap, the font file declared later wins, so the characters embedded in the earlier file were never drawn and only took up size.
  Characters in overlapping ranges now go only into the one file listed later in the font list, and the font files embedded in the HTML of the English example `order.en.json` went from 28164 bytes to 17044 bytes. English examples became 35% to 45% smaller, and Japanese examples 3% to 10% smaller.
  The drawing does not change, and the PNGs of 24 examples match, pixel for pixel, the images taken with the overlap before the fix.

## [0.42.1] - 2026-10-30

### Added

- **Added how to write time diagrams to the guide page, the README, and the notation guide** (#3221)

  The guide page has a time diagram section after the git graph section, explaining the `time` header line, the `scale`, `period`, `row`, `point`, and `zoom` declarations, `now`, `mark`, and `span` inside a step, and the strip meter `[meter: ]`, with an example.
  The example is a 4-step diagram cut down from block finality, with ticks for two periods, two columns in the zoom band, two points, and a meter, and the section's exit link goes to the time diagram page of the catalog.
  The two READMEs and the notation guide (`packages/dragon/examples/quick-start.md` and its English version) also gained the time diagram lines and the same example.

## [0.42.0] - 2026-10-30

### Added

- **Added the time diagram (`time`) as a diagram kind** (#3165)

  A diagram that follows, step by step, which tick each event happens on along time that moves at a fixed interval. It draws flows such as block finality or the 7-day wait when withdrawing from L2 to L1.
  `scale <単位> <長さ> <数>` declares the ticks, `period` the period names and boundaries, `row` a row of marks, `point` a point below the axis, and `zoom <範囲>` the ticks to zoom in on in the top band. In the source JSON these go in the kind field `time`.
  Inside a step, `now -> <目盛り>` moves the needle forward. The needle moves one tick in a fixed number of seconds and the marks of the ticks it passes appear as it goes, so the writer does not write seconds.
  `mark <列> <範囲> [color: ]` changes the color of marks, `span <範囲>: <字>` puts a range bracket under the axis, and `[shape: box]` turns it into a frame around the rows of marks. In the zoom band, the declared boxes sit in the same order in each tick column, and `[at: ]` and `[into: ]` on a line pick the column.
  The time labels of the ticks are worked out from the unit length and written in Japanese or English in one unit chosen from the length of the whole axis. Adding `[meter: <割合>]` to a strip field makes a meter that fills with the needle.
  The `scale`, `period`, `row`, `point`, `zoom`, `mark`, and `span` lines and `[meter: ]` can be written only in a time diagram, and in other diagrams `now` is still read as an ordinary id.
  Examples for block finality (`finality`) and the withdrawal wait (`withdraw`) are provided in Japanese and English notation and as source JSON, and appear on the catalog's time diagram page and in the editor's shelf.
  The catalog's parts for one kind gained the scale and needle, the row of marks, the point, and the zoom band, and the pages of the 10 parts that every diagram uses also show a diagram drawn as a time diagram.

- **Diagrams can now be drawn with colors passed as values rather than as a palette name** (#3198)

  Passing color variable names (`bg`, `ink`, `c-green`, and so on) and values in `colors` in the settings of `renderDiagram` and `mountDiagram` overrides only those colors for the drawn theme (`theme`), on top of the palette chosen by name (`palette`). Colors you leave out keep the palette's values.
  `mountDiagram` paints the placed diagram, the overview shown while following, and the buttons and step bar in the same colors.
  A name the palette does not have, or a value that cannot be read as a color (one that contains `;`, `"`, `<`, and so on), is refused with that name and nothing is drawn. The refusal message is in the language of `lang`.
  The entry exports the key name type `ColorName` and the settings type `Colors`.
  Diagrams with the same source but different color values get different class names for their variables, so their colors do not mix when placed on the same page.

- **A still diagram can show every step's line labels, and a diagram can be placed stopped on a chosen step or played once** (#3200)

  Added `still` to the settings of `renderDiagram` and `mountDiagram`, which picks the still.
  With it, the still of the last step shows every step's line labels and box actions as strongly as the last step's.
  In a state diagram, the labels of past steps also show at the same strength instead of in pale gray.
  In diagrams that show actions on one line under a box (such as architecture diagrams), when a box has two or more actions from different steps, the action of the last of those steps is shown.
  If the last thing that happened in that box was a text rewrite, the rewritten text is shown.
  A still of a middle step still shows only that step's labels, as before.
  Labels from different steps that overlap are not moved, and are reported in `overlaps` as overlaps of the last step.
  `mountDiagram` gained `pausedAt`, which places the diagram stopped on the still of a chosen step without playing, and `playOnce`, which plays once and stops on the still of the last step.
  Playing a diagram again after it has played once and stopped starts over from the first step.
  Without any of these, the diagram plays every step on a loop from the moment it is placed, as before.

- **Boxes can now have a link, and steps can have sources** (#3199)

  Writing a destination in the box line attribute `[link: <飛び先>]` gives the box in the source a `link`, and the box becomes a link (`<a href>`) to that destination in the drawn SVG. Use it to go from a box in a diagram of a large system to the page of a diagram of a smaller system inside it.
  A `source <名前> [url: <URL>]` line inside a step becomes a source of that step, and the step in the source JSON gets `sources` (a list of name and URL pairs). A step can have any number of these lines, and they appear as links named by the source in the step list that screen readers read. They are not shown in the diagram or the visible narration.
  Link and source URLs accept only a path that starts with `/`, or a URL that starts with `http://` or `https://`. Any other form (such as `javascript:`) is an error with the line number in the notation, and an error that points at the field in the source JSON.
  Both fields are optional, so the format version (`FORMAT_VERSION`) stays at 1. The catalog gained link and source as parts every diagram uses, and the editor's notation quick reference and the guide page show how to write them.

## [0.41.1] - 2026-10-29

### Fixed

- **Fixed exporting a diagram that draws no Japanese characters to PNG, mp4, and GIF always failing** (#3212)

  Export embeds font files cut down to the characters drawn, but Chromium did not load a file left with only whitespace characters, so all 10 English examples stopped with `page.evaluate: NetworkError`.
  A file that draws only whitespace now gets one visible character from the same file added so it can be loaded, and the added character is left out of the drawn range (`unicode-range`).
  The PNGs of the Japanese examples are byte-for-byte the same as before the fix. When a font file cannot be loaded, export refuses and names the font and range of that file.

## [0.41.0] - 2026-10-29

### Changed

- **Moved `migrateFile`, which moves a source file to the current version, to the Node-only entry `@cardenelabs/dragon/node`** (#3206)

  The entry that draws on a page, `@cardenelabs/dragon`, no longer reads any of Node's built-in modules, so bundling it for the browser with a tool that resolves even imports that are never called (such as Next.js Turbopack) no longer stops the build.
  Code that imported `migrateFile` from `@cardenelabs/dragon` must be rewritten to `import { migrateFile } from "@cardenelabs/dragon/node"`. The type `Migrated` is exported from the same entry too.

## [0.40.0] - 2026-10-29

### Added

- **Added the git graph (`git`) as a diagram kind** (#3164)

  A diagram that follows, step by step, commits stacking on git branches and the branch refs and HEAD moving through a rebase and a merge.
  Branches are declared from the top on `branch` lines, and each branch gets its own band. In the source JSON they go in the kind field `git.branches`, and a diagram can have no boxes at all.
  Inside a step, `commit <名札> on <枝>` adds a commit, `copy <名札>` makes it a replayed commit, and `merge <枝>` makes it a merge commit with two parents. `hash` and `note` put a hash and a short note beside the circle.
  `<枝> from <commit>` cuts a branch, and `<札> -> <commit>` moves a branch ref or HEAD. A line that moves a ref makes no commit and is drawn only during that step.
  HEAD points at the branch that got the first commit, and its ref is shown only while it is detached from a branch. A commit that no ref can reach any more turns into a dotted circle in that step.
  `branch` and `commit` lines can be written only in a git graph, and in other diagrams `main` and `HEAD` are still read as ordinary ids.
  Examples for rebase (`rebase`) and merge (`merge`) are provided in Japanese and English notation and as source JSON, and appear on the catalog's git graph page and in the editor's shelf.
  The catalog's parts for one kind gained branch, commit, replay, and merge commit, and the pages of the 10 parts that every diagram uses also show a diagram drawn as a git graph.

- **Added how to write git graphs to the guide page, the README, and the notation guide** (#3202)

  The guide page has a git graph section after the state diagram section, explaining the `git` header line, the `branch` declaration, `on`, `copy`, and `merge` on `commit` lines, `from` to cut a branch, and lines that move a ref, with an example.
  The example is a 4-step diagram that cuts fix and feature from main, merges fix with a merge commit, and replays and fast-forwards feature, and the section's exit link goes to the git graph page of the catalog.
  The two READMEs and the notation guide (`packages/dragon/examples/quick-start.md` and its English version) also gained the `git`, `branch`, and `commit` lines and the same example.

## [0.39.0] - 2026-10-29

### Added

- **The editor and the export command now report when text overlaps in a diagram you wrote** (#3178)

  The editor shows a yellow overlap section next to "Reads fine" in the notice area below the writing field, and lists each overlap on its own line with a step chip and a sentence.
  Text that overlaps in the current step is circled with a yellow dotted line on the diagram, and pressing a step chip moves the diagram to that step and stops there.
  The export command (`dragon export`) writes the files, then prints each overlap on its own line to standard error in the form `段 5: 段の番号 1 と段の番号 5 が重なる`, and the exit code stays 0.
  `overlaps` from `renderDiagram` holds, for each overlapping text, its rectangle and whether it is a step number (`spots`), and `describeOverlap` writes the message in Japanese or English.
  The player (`mountDiagram`) has `goTo`, which moves to a step and stops, and `mark`, which draws a dotted rectangle on the diagram. The export result (`exportDiagram`) also returns `overlaps`.

### Fixed

- **Step numbers no longer pile up and hide earlier numbers when the same line is passed many times** (#3184)

  The step numbers of steps that pass the same line share one circle, and when a later step starts, the number is swapped in the same spot. The earlier form that put the numbers for the same line side by side (#3175) ran out of room on the line at four or more steps and sat on the earlier numbers.
  When steps without a line keep rewriting the same box or strip, the number in the corner is swapped in the same way.
  On a line that is passed only once, the step number stays after the step is done, outlined, as before.
  In a state diagram, when steps on the same line give it the same label, the label is also stacked in one spot, and the faded label of the earlier step disappears when the later step starts. The same label no longer stacks up vertically, and the diagram does not grow downward.
  Step numbers that are not visible can no longer be pressed, so numbers of steps still to come, stacked in the same spot, do not get in the way of pressing the visible number.
- **English overlap messages now call box icons and carriers by English names** (#3184)

  A box icon is called `the icon of "<箱の名前>"`, and carriers are called `the coin` and `the envelope`. The Japanese messages do not change.
  Each overlapping text in `overlaps` (`spots`) carries the kind of part (`part`) when it is a part of the diagram.
- **Architecture diagrams now draw a line back to the same box as a loop under the box** (#3186)

  Until now only an arrowhead showed on the right edge of the box, and the step number sat on the icon at the top left of the box, so the icon could not be read.
  It is drawn with the same loop as in state diagrams: the step number goes to the right of the loop, the line label directly below the loop, and the carrier travels over the loop to the box's slot.
  Below the row of a box with a loop, enough space is left for the loop and its label, so they touch neither the box directly below nor the edge of the region.
  Other lines into and out of that box do not pass under the loop; they leave from the side of the box into the gap between columns and go around. A line that goes around between columns passes outside the widest box in the same column (until now it was measured from the right edge of the box it leaves, so when a wider box was above or below, the line passed through that box).
  Arrows to self in sequence diagrams do not change.
- **Step numbers no longer overlap on short lines that go back and forth between region bands or between rows** (#3189)

  Numbers on lines shorter than 44px were placed in the middle of the line, so on an out-and-back pair only 10px apart, the two numbers sat at the same height and overlapped.
  Short lines now also put the number at the start of the line (the radius of the number plus 1px from the edge of the box it leaves). On a single short line, such as steps 5 and 7 of the ccip example, the number also moves to the start.
  When lines gather on the same side of one box and a number cannot avoid an earlier number on its line, the number shifts beside the line, toward the side that does not touch other lines or arrowheads.
- **Step numbers of steps without a line no longer overlap the icon at the top left of the box** (#3187)

  The numbers of steps that only write and steps that write nothing were placed 4px inside the top-left corner of the box, so they caught the corner of the icon at the top left. They overlapped in state diagrams and in architecture diagram boxes that have a frame for tags.
  The center of the number now sits on the top-left corner of the box, with half of it outside the box. This is the same way the numbers of steps that draw a line sit on the box edge. The number of a step that only rewrites the strip stays inside the top-left corner of the strip, as before.

## [0.38.0] - 2026-10-29

### Added

- **The render result now returns overlaps between texts visible at the same time** (#3175)

  `overlaps` in the result of `renderDiagram` holds one entry per overlap: the two texts that overlap in the still of a step, and the number of that step.
  The parts that draw text record each text's rectangle and when it is visible, and text width is measured with the same width table the layout uses, so overlaps are counted without a browser.
  Text inside a badge (line labels, actions, step numbers, strip tags, and carrier tags) is counted by the badge's rectangle, and carriers in the middle of running are not counted.
  Where a line crosses text without a badge (faded line labels kept from earlier steps, labels of paths not taken, the text of marks, and the names and notes of regions and side paths), it also returns that text and the names at both ends of the line.
  Text inside a badge is not counted when a line crosses it, because the badge's background hides the line.
  Box icons (`<箱の名前> の絵柄`) and carriers while they wait to start running and while they rest after arriving (the text of a tag, `封筒`, `硬貨`) are counted too (#3176).
- **Added a carrier slot to boxes that send or receive carriers** (#3176)

  In architecture and state diagrams, a box that sends or receives carriers moves its icon to the left and shows a dotted slot frame on the right from the first step.
  A carrier rests in the slot of the box it arrives at and waits to start in the slot of the box it leaves, so it does not hide icons or step numbers.
  When an envelope, a tag, and a coin rest in the same box, the envelope and the tag go on the left and the coin on the right.
  In sequence diagrams, a carrier rests on the far side of the lifeline it arrives at, so it does not hide the arrowhead, and waits on the near side of the lifeline it leaves.
  In state diagrams, a tag leaving the start mark waits to the left of the mark.
  A box that cannot fit the slot frame and its tag is widened, and in state diagrams the frame is kept away from the done mark at the top right.

### Changed

- **Made sequence diagrams shorter** (#3177)

  Line label badges sit closer to their lines, and the gap between the badge and the line went from 12 to 6. This is the same width as the other gaps in the diagram (between names).
  The space between rows, the breaks between steps, the space from the head boxes to the first line, and the space from the last line to the end of the lifelines are also tightened, and the total height of the 60 sequence diagram examples shrank by 18%.
  The sequence diagram example (English) on the Icon part page goes from a height of 302 to 246.
  The gap between line labels and lines in architecture and state diagrams stays at 12.
  Because diagrams are shorter, some now fit whole in places that pass a height and no longer use the follow view (oauth shows in the fixed view in the 860 × 960 overlay window).

### Fixed

- **Fixed places where line labels and step numbers overlapped and could not be read** (#3175)

  In state diagrams, the label of a path not taken shifts along its horizontal run when it overlaps another label.
  In state diagrams, line labels avoid the faded labels kept from earlier steps, the text of the start and end marks, and step numbers.
  In state diagrams, line labels and labels of paths not taken go where no line or path other than their own crosses them.
  In the guide page example, "Place order" moved to the left of the start line, and the dotted "Cancel" line no longer crosses it.
  When two steps pass the same line, the number of the later step sits next to the earlier number along the line.
  For two lines that run in parallel, out and back, each label goes on the outer side of its own line.
  In architecture and sequence diagrams, line labels no longer cut into step numbers visible at the same time.
- **Fixed line labels on lines that go around under boxes in architecture diagrams overflowing the bottom edge of the diagram** (#3176)

  The height of the diagram and the position of the strip now take in the bottom edge of the line labels.

## [0.37.0] - 2026-10-28

### Added

- **Added a section on placing a diagram on a page to the guide page of the catalog** (#3155)

  It sits between the JSON section and the export section, and with the same example as the section on putting a diagram on a page in the package README, it shows how to import the font entry once and pass the source to `mountDiagram`.
  To show the same example on the English page, the error message in the README example is now in English (`#figure not found`).

- **Rearranged the Catalog page into three tiers (parts, parts for one kind, and diagrams) and added a page for each part** (#3166)

  The parts are 10 (box, line, line label, carrier, color role, icon, small text, action inside a box, strip and fields, and step) plus 2 (lifeline, only in sequence diagrams, and region, only in architecture diagrams).
  A part page (`/dragon/catalog/part/<部品>`) shows small diagrams that use only that part, as a sequence diagram and an architecture diagram, with their notation and an "Open in the editor" link.
  At the bottom of each diagram page are chips for the parts that diagram uses. The words of the notation did not change.

- **Added four sequence diagram examples** (#3167)

  A round trip to an API (`api`), a failure and a retry (`retry`), a payment and a notice that arrives later (`payment`), and a wallet signature (`wallet`) are in `packages/dragon/examples`, in Japanese and English notation and as source JSON.
  They appear on the sequence diagram page of the catalog and on the shelf of the editor, and part pages show chips for the examples that use the part. Pressing a chip opens the diagram page with that example selected (`/dragon/catalog/sequence#payment`).
  The use cases on the Home page stay at the current three.

- **Added the state diagram (`state`) as a diagram kind** (#3163)

  A diagram that follows one thing moving between states, step by step. States are laid out four to a row in the order steps first reach them, and each row turns back, switching the reading direction (#3171).
  Writing `start` on the sending side of a line and `finish` on the receiving side makes a line out of the start mark and a line into the end mark. In a state diagram, the two names cannot be used as box ids.
  Lines written before the first `step` are paths the thing could move along but does not this time, drawn dotted with no carrier running, and in the source JSON they go in the kind's field `state.paths`.
  A state that no step reaches becomes a dotted box inside the side-path box above the first row. The state the tag sits on lights up, and a state the tag has left keeps a done mark.
  The example is an online shop order (`order`) in Japanese and English notation and as source JSON, on the state diagram page of the catalog and on the shelf of the editor.
  "Start and end" and "Path not taken" were added to the parts for one kind in the catalog, and the pages of the 10 parts that every diagram uses now also show a diagram drawn as a state diagram.

- **Documented state diagrams in the guide page, the READMEs, and the notation guide, and listed every icon you can use** (#3172)

  The guide page has a state diagram section after the region section, explaining with an example the `state` first line, the `start` and `finish` lines, and the paths not taken written before the first `step`.
  The two READMEs and the notation guide (`packages/dragon/examples/quick-start.md` and its English version) also got the `state` line and an example.
  The Icon part page of the catalog lists every icon you can write in `icon:` with its shape and name, and the box section of the guide page links to that page. The list is built from the table of icon shapes and names, and that table is exported from the package entry as `ICONS`.

### Changed

- **Refined how state diagrams look, and rounded the bends of lines in every kind of diagram** (#3171)

  States go from left to right on the first row and from right to left on the second, and a line that crosses rows is a single line straight down. With 9 or more states, the third row goes from left to right again.
  Lines are drawn in the color of the state they move to, and turn into solid gray lines when the step ends. Step numbers are gray too, and done marks are filled in ink, so color stays only on the state cards and the current step.
  Line labels of finished steps stay faint until the last step, and a line back to the same state is drawn as an arc under its card.
  The side-path box moves to the top right of the diagram with two added lines, "not taken this time" and "reachable from 3 states", and the start mark sits at the same height as the box. Dotted cards in the side path put the icon on the left and the name on the right.
  At the end of the strip, the states passed so far line up as dots, and values that changed in the step are drawn in the color of the current state. The order example drops the state field from the strip, and uses the new icons `undo` (a back arrow) and `yen` (a yen sign) for return accepted and refunded.
  Sequence and architecture diagrams also draw rounded corners where lines bend. The colors and patterns of lines and how line labels appear stay as they are.

### Fixed

- **Fixed GitHub Pages returning a 404 status when the URL of a catalog screen was opened directly** (#3157)

  Screen routes such as `/dragon/docs` showed the page from a copy of `404.html`, which is returned for paths that do not exist, so the content showed but the status was 404.
  After the build, a `.html` copy of the page is placed for each screen route, so Pages returns 200. Paths not in the table still show the not-found page with a 404, as before.

### Removed

- **Removed the Stryker mutation tests** (#3159)

  Two of the 3 files that `stryker.conf.json` named no longer existed, and `pnpm test:mutation` did not mutate most of the current rendering code.
  Removed the config, the command, and 2 dev dependencies, and also deleted the acceptance records for 2 `qs` vulnerabilities that those dependencies brought in.
  `pnpm test:mutation:values`, which mutates values that run in the page, stays.

## [0.36.4] - 2026-10-27

### Added

- **Added how to put a diagram on a page and the font entry to the package README** (#3153)

  The README did not explain how to put a diagram on a page, and the entry that loads the bundled fonts, `@cardenelabs/dragon/fonts`, was not written anywhere.
  The "Put it on a page" section shows an example that imports the font entry only once on the page and passes the source read from the notation to `mountDiagram`.
  Diagrams are laid out with widths measured from the bundled fonts, so without the font entry they are drawn in the device's fonts and text can overflow its labels.
  The code that runs is the same as in 0.36.3.

## [0.36.3] - 2026-10-27

### Fixed

- **Exported the types inside the render result from the entry** (#3149)

  The entry did not export the types inside the `layout` and `timeline` that `renderDiagram` returns (such as `SceneBox` and `Span`), the color name type `ColorKey`, or the font name type `Family`.
  They can be imported by name, as in `import type { SceneBox, Span } from "@cardenelabs/dragon"`.
  Added a test that counts the types declared in the built type files that no entry exports, so it fails when a type is left out of an entry.

## [0.36.2] - 2026-10-27

### Fixed

- **Exported `PlayerOptions`, the type of the player's settings, from the entry** (#3147)

  The `onStep` and `fitHeight` settings added to `mountDiagram` in 0.36.0 are in the `PlayerOptions` type, but the entry did not export the type, so it could not be imported by name when building the settings in a variable.
  It can be imported with `import type { PlayerOptions } from "@cardenelabs/dragon"`, and the same type comes through whether the package is loaded with `import` or `require`.

## [0.36.1] - 2026-10-27

### Fixed

- **Fixed the Japanese error message for an old-form notation line calling the old form "the current form"** (#3143)

  0.36.0 printed `時系列図 は今の形の書き方。新しい形では sequence <題> と書く`, calling "the current form" what the changelog, the README, and the guide page call "the old form".
  It now prints `時系列図 は前の形の書き方。新しい形では sequence <題> と書く`.
  The English error message (`is the old notation`) does not change.

## [0.36.0] - 2026-10-27

The version that rebuilt the notation into the dragon notation (#3136).
Notation files from 0.35.x cannot be read, so rewrite them line by line with the table below.
The source JSON has the same shape as in 0.35.x and reads as it is.

### Changed

- **Rebuilt the notation into the dragon notation (breaking change)** (#3136, #3137)

  Dropped the old form, which showed the kind of a line with symbols and spaces and could also be written in Japanese words, and switched to a form written with an English word at the start of the line and a colon.
  Files in the old form are not read, and reading one stops with an error that shows the new form of that line.
  There is no command that moves the old form over, so rewrite each line with the table below.
  The `.dragon` files in the repo, the examples, and the guide page of the catalog were rewritten in the new form.

  Every line follows these four rules.

  1. The first English word of a line decides its kind. Only arrow lines start with a box id
  2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
  3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
  4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

  | Old form | New form |
  |---|---|
  | `sequence <title>`, `architecture <title>` | `sequence <title>`, `architecture <title>` (unchanged) |
  | `view fixed`, `view follow` | `sequence <title> [view: fixed]`, `sequence <title> [view: follow]` |
  | `region <id> = <name> "<note>"` | `group <id> as <name> [note: <note>]` through `end` |
  | `[region <id>]` on a box line | `box` lines between `group <id>` and `end` |
  | `<id> = <name> "<caption>"` | `box <id> as <name> [note: <caption>]` |
  | `[color <color>]`, `[icon <icon>]` | `box <id> [color: <color>, icon: <icon>]` |
  | `strip <title> = <field>, <field>` | `strip <title>: <field>, <field>` |
  | `# <heading>` | `step <heading>` |
  | `> <body>` | `say <body>` |
  | A line wrapped in backticks | `code <command>` |
  | `<id> -> <id> : <label>` | `<id> -> <id>: <label>` |
  | `[tag <value>]`, `[coin]`, `[none]` | `<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]` |
  | `[label above]` | `<id> -> <id> [side: above]` |
  | `[label below]` | `<id> -> <id> [side: below]` |
  | `[label left]` | `<id> -> <id> [side: left]` |
  | `[label right]` | `<id> -> <id> [side: right]` |
  | `<id> : <action>` | `act <id>: <action>` |
  | `<id> "<text>"` | `note <id>: <text>` |
  | `strip <field> = <value>` | `set <field>: <value>` |
  | `strip <field> [<tag>]` | `set <field> [tag: <tag>]` |

  The table for the old form written in Japanese words is in `CHANGELOG.ja.md`.

- **Error messages and the text in a diagram now follow only the language passed in (breaking change)** (#3137)

  `parseNotation` and `dragon export` no longer decide the language from the words in the notation file.
  `parseNotation` uses a language only when given `lang`, and `dragon export` only when given `--lang`, and both use Japanese otherwise.
  Notation is now written back in English words only, so `printNotation` no longer takes a language, and `PrintOptions` and `notationLanguage` were removed from the entry.
  The editor in the catalog shows error messages in the language of the page.

- **Pinned a row of header boxes to the top edge of the window in follow-view sequence diagrams** (#3118, #3120, #3122)

  A sequence diagram in the follow view also draws the header boxes in a header row at the top edge of the window.
  Wherever the window moves, you can tell which box each line belongs to, and a rewrite of a header box stays visible instead of happening outside the window.
  The boxes in the header row drop the icon and show two lines, the name and the caption, leaving more height for the window to show lines.
  The rectangle in the corner overview frames only the part that shows lines below the header row, and does not cut across the header row.

### Added

- **The player reports step changes and fits the diagram to the visible height** (#3031, #3047)

  Given `onStep`, `mountDiagram` passes it the current step (from 0) when the diagram is placed and each time the step changes.
  Given `fitHeight`, it fits the diagram to the visible height of the frame, turns a diagram whose text cannot be read at that height into a follow-view diagram, and fits the window and overview to that height.
  `chooseView` also takes the frame height, and picks the view by the text size when the diagram is fitted to both the width and the height.
  The entry now exports `READABLE_PX`, the minimum text size used to pick the view.

- **Rebuilt the catalog as a site with the same 7 screens as the previous site** (#3030, #3031, #3032, #3033, #3034, #3035)

  Every screen carries the same top bar, and routes switch between the 7 screens: home, the catalog list, catalog categories, the editor, the guide, release notes, and page not found.
  The editor gets back the previous shelf, toolbar, and error notices, and in the catalog the palette in the bar changes the colors of the site and the diagrams.
  The guide page explains the current notation with examples and moving diagrams, and the release notes page shows a label with the current version.

- **A tool that checks whether the tests catch broken values by rewriting values one at a time** (#3107, #3130, #3134)

  It is a tool used inside the repo and is not part of the package.
  It builds the table of results measured by breaking things from the rewrite results, and the table tells apart a run filtered by name from a run of every test.

### Fixed

- **Fixed where the window and overview of follow-view diagrams are placed** (#3042, #3046, #3053, #3055)

  | Issue | What was fixed |
  |---|---|
  | #3042 | At narrow widths the corner overview covered boxes and lines, so the overview is placed outside the window |
  | #3046 | In a step whose step number circle falls outside the window, the window moves to a frame around the moving things nearest the circle, as many as fit in the window |
  | #3053 | The window did not grow when the frame had room, so the sides of the diagram were cut off; the window now grows up to the full-size width of the diagram and the visible height |
  | #3055 | At phone widths the tall overview is not shown, and the window gets the full width of the frame |

- **Fixed the height and layout of the step bar and the size of its buttons** (#3049, #3057, #3069, #3076)

  | Issue | What was fixed |
  |---|---|
  | #3049 | The step body bar keeps the height of the step with the longest body, so moving through steps does not change the size or position of the diagram |
  | #3057 | At phone widths the body spans the full width of the row below the buttons, so the bar does not become thin and tall |
  | #3069 | At phone widths the step buttons are large enough to press with a finger, and the title and body sit in the row below the buttons |
  | #3076 | On wide touch screens too, the step buttons are large enough to press with a finger |

- **Fixed diagrams and step bodies being cut off or pushed down in the overlays of the catalog and in the editor** (#3044, #3047, #3051, #3059, #3061, #3063)

  | Issue | What was fixed |
  |---|---|
  | #3044 | Under the diagram frame in the catalog, the window and overview of a follow-view diagram are not cut off |
  | #3047 | In the enlarge overlay of the catalog, the bottom of the diagram and the overview are visible without scrolling |
  | #3051 | The last line of a step body does not touch the bottom edge of the overlay or the editor |
  | #3059 | At phone widths, the overlay heading does not push the diagram frame down |
  | #3061 | At phone widths, the step label does not repeat what the bar shows or push the notation field down |
  | #3063 | At phone widths, the zoom buttons and zoom level in the toolbar fit on the screen |

- **Fixed the buttons and labels of the catalog being small and hard to press at phone widths and on touch screens** (#3065, #3067, #3071, #3075, #3077, #3078, #3079, #3085)

  The header bar, the example frames and list in the catalog, the shelf, toolbar, and buttons above the fields in the editor, and the buttons and labels on the home and guide pages are now large enough to press with a finger without missing.

- **Fixed the file name in the editor being almost invisible or cut off on English pages on touch tablets** (#3087, #3089)

- **Fixed a vulnerability in a dependency of the development tools by upgrading it** (#3072)

  Only the development dependencies at the repo root were upgraded, and the dependencies of the package did not change.

## [0.35.1] - 2026-10-22

### Fixed

- **Fixed loading the export entry with `require` being refused** (#3021)

  In 0.35.0, `./export` in `exports` had no `require` line, so `require("@cardenelabs/dragon/export")` was refused with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
  `require` points to `dist/export.cjs`, which writes the same files as `import` does.

  Along with this, `.` and `./export` now give `.d.ts` types to those who load them with `import` and `.d.cts` types to those who load them with `require`.
  Before, those who loaded them with `require` also got the types for ESM.

  The path of the `dragon` command is now written as `dist/cli.js`, so npm no longer warns at publish time that it was invalid and removed (the command is in 0.35.0 as well).

## [0.35.0] - 2026-10-22

The version that rebuilt dragon from the ground up (#2982).
The notation, entries, and rendering of 0.34.0 and earlier can no longer be used, so rewrite diagrams as the new source JSON or in the notation where one text line is one line of the diagram.
How to write it is in `packages/dragon/examples/quick-start.md` (`quick-start.en.md` for English words), which is not shipped in the package.

### Removed

- **Removed the notation, entries, and rendering of 0.34.0 and earlier (breaking change)** (#2983)

  Removed the YAML and JSON notation with Japanese keys, the entries including `textDslToDiagram` and `jsonToDiagram`, the mechanism that drew diagrams by passing them to `@cardenelabs/cdl`, and the 7 styles.
  `@cardenelabs/cdl` is no longer a dependency, and diagrams are drawn by this package alone.
  The diagram list and editor of the catalog were removed too.

  The following changes made to the previous build after 0.34.0 went away with it, so they are not in this version.

  | Issue | Change made to the previous build |
  |---|---|
  | #2952 | Upgraded the renderer `@cardenelabs/cdl` and drew the 13 basic shapes by one rule |
  | #2960 | Removed from the notation the 2 styles that only changed colors (`kinari` and `celadon`) |
  | #2962 | Set the look of the site from a table of values per style, and removed the switch between light and dark |
  | #2954 | In the catalog, fixed the lines and back faces inside basic shapes being drawn in a different color from the outline |
  | #2977 | In the catalog, fixed the broken look of lines and running dots in relation diagrams that set no style |
  | #2978 | In the editor, fixed the readable-size check failing because one piece of text went missing from the order example |

- **Removed old skills and documents that no longer worked after the rebuild from the repo** (#2993)

  Removed 4 skills and documents that assumed the previous notation and rendering, and updated the contributing guide and Issue templates to the current layout.
  The contents of the package did not change.

### Added

- **The source JSON for diagrams, and a notation that writes one diagram line per text line** (#2984)

  The source is versioned JSON, checked against a single JSON Schema, and errors are located with JSON Pointer (`validateDiagram`, `readDiagram`).
  Sources of older versions are converted to the current version when read (`migrateFile`; the current version is 1, in `FORMAT_VERSION`).
  People write in the notation (`.dragon`), which lists the lines of each step as arrow lines under the step heading, and `parseNotation` turns it into JSON and `printNotation` writes it back as notation.
  `extractDiagrams` pulls diagram blocks out of Markdown.
  Added OAuth (12 steps) and CCIP (13 steps) sources as examples, in both the notation and JSON.

- **A renderer that draws sequence diagrams and architecture diagrams and plays them step by step** (#2985)

  `renderDiagram` returns SVG and a timing table from the source, and `mountDiagram` places the diagram on a page and plays it step by step.
  Boxes, lines, and line labels are placed automatically.
  When the frame is too narrow to read the text, the view follows where things are moving and a corner overview shows where you are (`chooseView`).
  For people who set reduced motion, the diagram does not play on its own, and buttons move through a still of each step.
  There are 3 palettes, `clear` / `paper` / `night`, with `paper` as the default, and each has light and dark themes (`PALETTES`, `resolvePalette`).
  Added `@cardenelabs/dragon/fonts` as an entry that loads the fonts on the page.

- **The `dragon export` command, which exports the same diagram to mp4, GIF, HTML, and PNG** (#2986)

  It captures the same drawing as the page one frame at a time in a headless Chromium with the clock stopped, and packs the frames into mp4 and GIF inside the same Chromium, so ffmpeg is not needed.
  Install `playwright-core`, which runs Chromium, only when you use export.
  The HTML is a single file with fonts cut down to the characters the diagram draws, and it fetches nothing from outside.
  To call it from Node, use `exportDiagram` from `@cardenelabs/dragon/export`.

- **The notation can also be written in English words** (#2997)

  The English words match the names in the source JSON (`時系列図` is `sequence`, `帯` is `strip`, `[色 …]` is `[color …]`, and so on).
  The language of a file is decided by the diagram kind word on its first line, and error messages and writing back from JSON use that language too.
  Notation in Japanese words still reads into the same JSON.
  Added English versions of the getting-started guide and the 3 examples.

- **Error messages, text in the diagram, and command messages can also be in English** (#2999, #3001, #3003)

  The source checks (`validateDiagram` and `readDiagram`) and the renderers (`renderDiagram`, `mountDiagram`, `exportDiagram`) take a language and use Japanese when none is passed.
  Text in the diagram appears in 3 places: the message when it cannot draw, the overview label in the follow view, and the names screen readers read for the playback buttons and the step list.
  `dragon export` shows its usage text, error messages, and text in the diagram in the language passed with `--lang`, or in the language of the notation file without it.

- **Replaced the published page with one where writing notation gives a moving diagram** (#2995)

  Write notation or JSON in the left field, and the diagram drawn by the player of this package moves on the right.
  The 3 examples are the intro, OAuth, and CCIP, and the page language and the examples switch between Japanese and English.

### Fixed

Fixes to `dragon export` and the sequence diagram, both added in this version.

- **`dragon export` now refuses two or more diagram files instead of silently exporting only the first** (#3007)
- **`dragon export` now shows the message for an output location it cannot write to in the language of the command instead of Node's English** (#3009)
- **`dragon export` now refuses invalid settings and shows the allowed values instead of silently accepting them** (#3011)
- **`dragon export` no longer leaves the output dir and partial files behind when an export fails** (#3013)
- **In sequence diagrams, the step number circle of a step where a box acts on its own now sits on the lifeline instead of floating away from it** (#3017)

  The action badge is no longer centered on the lifeline and appears to the right of the circle.

### Security

- **The public site can no longer load scripts from anywhere but its own origin** (#2956)

  Added a meta tag to the built `index.html` that declares where content may be loaded from (CSP).
  Scripts and connections are limited to the site's own origin, and this works on both GitHub Pages and Vercel.
  Along with this, the referrer passed to other sites is cut down to the origin, and on Vercel a header that stops content-type sniffing is returned.
  Embedding in frames on other sites still works as before.

## Earlier versions

Versions before 0.35.0 belong to the earlier design that 0.35.0 rebuilt from scratch, and their notation and entry points no longer exist.
Their records are in [`CHANGELOG.ja.md`](CHANGELOG.ja.md) (in Japanese).
