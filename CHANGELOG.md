# Changelog

The main changes to dragon, newest first.
The format follows Keep a Changelog, and versions follow Semantic Versioning.
The same record in Japanese is in [`CHANGELOG.ja.md`](CHANGELOG.ja.md).

## [Unreleased]

## [0.84.0] - 2026-11-26

### Added

- A `<pre class="dragon">` block with `data-step="3"` opens paused on step 3, counting from 1 as the step bar does. The reader can still play it or move between steps. A number larger than the step count pauses on the last step, and a value that is not a whole number from 1 turns the block into an error message (#3831)

### Changed

- Sequence and architecture diagrams now keep the labels of earlier steps in faint gray until the last step, like state and flow diagrams, so a diagram paused on a middle step shows the names of every line before it. The faint labels of all four kinds sit on a patch of the figure background, so a lifeline no longer runs through them. A faint label goes away when a later step puts its own label in the same place (#3831)

### Fixed

- `mountDiagram` with `still: true` alone now stops on the last step and shows every line label, as the README says, instead of playing in a loop. With `pausedAt` it still stops on that step, and with `playOnce` it plays once (#3831)
- A printed page no longer leaves the title bar of a figure alone at the bottom of a sheet with the figure on the next one, and no longer leaves half a sheet blank after a tall step. The title bar of a figure, the titles of guide topics and sections, the one-sentence answer, and the paragraph right before a figure now stay on the same sheet as what follows them, and each printed step of a figure, with its number, title, and text, fits in half the height of the sheet, so a sheet holds two steps. A step drawn taller than that is scaled down with its proportions kept. A figure with scenes now prints every scene, not only the one shown on screen, with each scene name on the same sheet as its first step (#3975)

## [0.83.0] - 2026-11-26

### Added

- A pipe diagram now draws an undo tag by the box that fails in a `revert <box>: <reason>` step. The tag has a rose border, the same cross circle as a failed check's lamp on the left, and the reason on the right, and it shows only during the failing step, 8px to 24px from the box's edge where the space is free. A `revert <box>` with no reason writes the same word as the undone tank's tag (`Undone`, which `words.pipe.tags.rolled` can replace). The tag is part of the figure, so the reason stays readable when the step caption and the step bar are hidden. When calls fail one after another from the inside out in the same step, only the box where the failure started gets the tag, and that box gets none when it wrote a failing `check` during the call, since the gauge's cross and formula already mark it. Diagrams that write `revert` after `check ... [fail]` look the same as before (#3974)

## [0.82.0] - 2026-11-26

### Changed

- Guide pages (`layout: guide`) now list every topic and question in a menu on the left, instead of topic tabs with a question list at the top of each tab, and stack the topics one after another on one page. Each section is numbered `<topic>-<question>`, such as `2-1`, so the numbers start again in each topic, and the terms file becomes a `Terms` topic at the end without a number. The menu stays on screen and marks the question being read, and on phone widths it folds above the text behind a button. A `###` title can end with `[menu: <short name>]` to show a short name in the menu, and `[menu: ]` with no name stops the export with the line named. A dragon figure before the first `##` becomes an overview at the top of the page, with the text written after the figure shown under it, followed by the topics in order. A printed page hides the menu and starts each topic on a new page (#3961, #3969)

### Fixed

- Buttons of a diagram placed on a page without the bar (`mountDiagram`) no longer take the page's own `button` styles. The step buttons, the zoom buttons of a pipe diagram, the scene buttons, and the close button of a box card used to get the page's shadow, uppercase text, minimum height, margin, and transform, and the step bar grew taller. They now reset every inherited and page style first, so they look the same on any page. Page rules stronger than a plain `button` selector, such as `.site button` or `!important`, still reach them; use the framed diagram on such pages (#3799)

## [0.81.1] - 2026-11-26

### Fixed

- In a mesh pipe diagram, the `delegatecall()` tag of a delegate call (`[call: delegate]`) whose pipe runs sideways above the boxes no longer sits on the middle of its pipe. When the tag was placed, the top edge of the diagram blocked the spots above the pipe and the boxes blocked the spots below it, so the tag fell back onto the pipe, as in a `CounterProxy` that borrows `CounterV2.increment`. When only the top edge blocks a spot beside the pipe, the whole diagram now moves down to make room and the tag sits above the pipe, at least 8px clear of the pipe edge. Diagrams whose tag already found a spot keep their layout (#3962)
- Printing a page no longer loses most of it. A guide page (`layout: guide`) prints the sections of every tab in written order instead of only the open tab, starts each tab after the first on a new sheet, and puts the tab name at the top. On every page that places a diagram, the player bar and the buttons of the bar above the diagram are left out, a diagram with steps prints the still of every step in order with its step number, title, and `say` text, and `note: pop` box cards are listed below the diagram with their box names instead of opening on top of it. A scenes diagram prints every step of each scene the same way. Blocks in hidden tabs are drawn before printing (#3956)
- In the follow view, a step whose moving parts do not fit the window now zooms the window out, at most down to the scale where box names are 10.5px, instead of leaving the box its line points to outside the window. This happens on phone widths in state, architecture, mind, and other diagrams. When everything still does not fit at that scale, the window keeps the box that the step's first line points to and its label, then the step badge, and puts a name tag on each line end it cuts. Architecture diagrams now get these tags too. The frame in the overview grows with the zoomed window. Steps that fit, sequence diagrams, and kinds that choose their own window keep the window as before. In the arcade palette the tags have square corners like other small parts (#3871)

## [0.81.0] - 2026-11-26

### Added

- `dragon export --format svg` writes an SVG of any diagram: the still of the last step, with the fonts it draws embedded as `data:` URLs. An export without `--format` still writes mp4, GIF, HTML, and PNG (#3891)
- Pictures of a judge table put each case name and note on a band above its ✓ and ✕ row instead of a case column, so the table fits in 728px with every text at 10.5px or more. A table still wider splits its rule columns into stacked tables, each with the case bands, and the verdict column in the last one. The PNG, GIF, mp4, and SVG of `dragon export`, and of the export menu and image copy in the playground editor and catalog, use this form. It is drawn only with SVG elements and no `foreignObject`, so tools other than browsers show it too. `renderDiagram(diagram, { picture: true })` draws it, and `@cardenelabs/dragon/capture` takes its root (#3891)
- The export menu and image copy in the bar of embedded diagrams (pages made by `dragon embed`, the one-line jsDelivr entry, `mountDragon`, `@cardenelabs/dragon/frame`, and `@cardenelabs/dragon/light/frame`) draw a judge table in the band form too, and so does the export of `mountDragon` with `header: false`. Their PNG, GIF, mp4, and SVG fit in 728px. The GIF and mp4 light one rule column per step instead of recording the reader's playback. `capturePng` of `@cardenelabs/dragon/capture` takes `background`, the color painted behind the picture (#3945)

### Fixed

- A cards diagram whose amount cards are all `[total: none]` no longer draws a total band. The band used to show 0 in every column, as if every owner held nothing. A column with no card that adds to its total now shows 0 in the unit of the first card that adds to a total, not in the unit of a `[total: none]` card (#3944)
- In a pipe diagram, the `delegatecall()` tag of a delegate call (`[call: delegate]`) no longer lands on its pipe over the `ok` chip of the return. Since 0.80.0 the tag avoided the log cards at the spots the layout gives them before drawing moves them, so a tag beside an open pipe fell back onto the pipe; in a Diamond `diamondCut` diagram it covered the `ok` chip by 23px. The tag now avoids log cards only where they stay put, and when the spots beside the pipe are taken it also tries spots 40px to 64px away and past the ends of the pipe before it sits on the pipe. Log cards and call cards moved while drawing keep off the tag, and the tag of the `vault-proxy` sample now sits beside its short pipe (#3949)
- `dragon check --layout` without `--lang` now draws the diagram text in the language `dragon export` uses: the title and `say` lines for a notation file, the body for a Markdown file, and `<html lang>` for an HTML file. A Japanese diagram used to be measured with the English `Start` label and could get a warning that its export does not have. Messages stay in English (#3943)

## [0.80.1] - 2026-11-25

### Fixed

- `dragon export` of a judge table stopped with `Cannot take screenshot with 0 width` and wrote nothing. The PNG now measures the drawn table and shows every column and verdict, at any `--width`. `--step` lights the columns up to the chosen step. The GIF and mp4 light one rule column per step and the verdict column last (#3923)
- Exporting a judge table from the export menu of the playground editor or the catalog saved no file for any format. PNG and SVG now show the whole table with no column lit, the SVG wraps the table in a `foreignObject`, and the GIF and mp4 light one column per step. `@cardenelabs/dragon/capture` takes the root element of a judge table as well as an SVG (#3937)
- Each scene of a diagram with scenes (`[scenes: stack]` and `[scenes: pick]`) is no longer drawn wider than its own width either, so a tall flow with scenes keeps 13px box names on a 728px page. (#3938)
- A diagram shown whole (`fixed`) is no longer drawn wider than its own width when its frame is wider, and sits in the middle of the frame. A tall flow on a 728px page used to grow until its box names were about 30px, and now keeps the same 13px text as the other kinds. Still figures from `dragon embed` and `data-still` blocks keep their own width the same way, and `chooseView` no longer reports text larger than the box name's own size. (#3934)

## [0.80.0] - 2026-11-25

### Added

- An owner card diagram (`cards`) stacks cards in a column per owner and follows cards being made, deleted, moved and refused, step by step. `item <id> as <name> in <column>, <column>` puts a copy of a card in every column listed, `delete` strikes a card through and keeps it, and `refuse <card or column>: <reason>` shows a refused panel and changes nothing. A column's `[mark: <word>]` and a card's `[mark: <column>]` show a mark in chosen columns, and the band under the columns shows each column's total by unit, with `[total: none]` cards left out and the old amount struck through when a total changes (#3846)
- Sequence, architecture, state, git, time, tree and flow diagrams can now show a box's `note` on a card instead of under its name, with `[note: pop]` on the first line. Only a box with `note` gets a round i mark at its top right, a long note no longer widens the box, and clicking the box opens a card just below it with the box name and the whole `note`. `example: <example>` on such a box adds a gray example band at the bottom of the card. The card closes when you click outside it or its close icon, or move to another step, and every card is drawn open below its box when the page is printed. `[note: under]` keeps the note under the name, and another value of `note`, or `example` in a diagram without `[note: pop]` or on a box without `note`, is refused with the line named. A Markdown page made by `dragon export` takes `note: pop` in its top lines to make cards the default of every diagram on the page, and a diagram with `[note: under]` keeps its notes under the names. The light entry does not load the code that opens cards up front, and loads it when a diagram with cards is mounted. The types `NoteMode` and `SceneNote` are exported too (#3877)
- A pipe diagram (`pipe`) can now replace the text under a token box's name with `note`, as in `box usdc as USDC [note: Holding]`. A box without it still shows `balanceOf`, so a diagram of an asset outside the EVM can name the form that holds the asset. A long text widens the box to fit. Only a token box, a box whose name is a unit on a `hold` line, takes `note`: the editor and `dragon check` stop a `note` on a person or contract box with an error, and the JSON check refuses its `sub` the same way (#3803)
- On a page made by `dragon embed`, the Export menu on a `data-header` block's bar now lists the same seven formats as the one-line jsDelivr page, PNG, SVG, HTML, GIF, MP4, notation and JSON, and saves each of them with the network off. The bundled script now carries the GIF and MP4 encoders, and the saved HTML embeds the page's own bundled script as its player, so it opens offline and draws in the device's fonts like the page. The bundled script grows by about 266KB (about 78KB gzipped), because it leaves out the Tabler icon table and keeps only the icons the page uses (#3792)
- A page that loads only the light entry can put a diagram with the bar from the new entry `@cardenelabs/dragon/light/frame`. It exports the same names as `@cardenelabs/dragon/frame` and reads and draws with the light entry, so the default entry stays off the page; it mounts after `loadFor`, and notation of a kind not loaded yet is refused with the kind named. A page with the one-line jsDelivr entry can set the order of the bar buttons and the bar look in a bar settings block, `<script type="application/json" id="dragon-header">`, with the same keys as the SDK's `mountDragon` (`buttons` and `look`), and a block it cannot read turns the `data-header` blocks into the error text. `dragon export` writes that block from `header-buttons` and `header-<color field>` lines at the top of the md, and stops with the line named for an unknown button or a color with `;` or `<` (#3789)
- A chart draws a line chart with `[shape: line]`, showing how amounts change over time with the same `item` and `set` lines. Each item is one line in its own color with its name in the legend at the top, each step is one point on the time axis labeled with the step title, and the value axis runs from 0 up to the largest value rounded up to a step of 1, 2, 2.5 or 5 times a power of 10. Going to the next step draws each line from the previous point to the new one and shows the step's value beside the point, and a still figure draws every line in full with the chart title at the top. `dragon check` names a line chart with a single step, an item that never gets a value, and `set none` with their line and column, and the JSON check names the same fields. The examples `bakery-sales` compare a bakery's daily sales at the counter and online over a week (#3802)
- A still figure paints its background, line outlines, and label plates with `--dragon-figure-background` when the page sets it, so the figure matches the page's card on light and dark pages. A donut writes a middle name that does not fit inside the ring on two lines and makes it smaller only when two lines still do not fit, and a still step band (`cycle` with `[shape: band]`) leaves out the room for step numbers and writes each step name inside its chevron. The dragon skill's `chart` and `layout` references give the lengths that fit, and the skill raises the versions of its `embed`, `chart`, and `layout` contents (#3809)
- The dragon skill declares its references in `musubi.json`, so other skills can follow the notation, the ways to place a diagram, the layout fixes, the block guide, the setup, and each kind's guide through musubi, by content names that its `SKILL.md` lists. The skill's table of destinations also names `data-still` for a report or explainer page (#3807)
- A block with `data-still` is replaced by a still figure: an SVG of the last step with no player, no step numbers, chart titles in place of step titles, a sans-serif fallback, the `clear` palette by default, and colors that follow the page's `data-theme` and the device's dark scheme. `renderDiagram` returns the same SVG with `figure: true`, and `dragon embed` draws still blocks as SVGs and adds no bundled script when no moving block is left (#3801)
- A judge table (`judge`) is a new diagram kind that checks cases against rules. Write `judge <title>`, then `rule <id> as <name> [value: <value>]` for each column and `case <name> [note: <note>]` for each row, and `fail <rule>: <failed value>` under a case for each rule it fails. Only those cells get ✕ with the failed value, the other cells get ✓, and dragon does not compare values. The table is an HTML table, so its text never shrinks, and a wide table scrolls sideways with the case column kept on the left. Playing checks one rule column per step and shows the verdicts at the last step, `block` with the failed rule numbers and names or `pass`. `[pass: <word>, block: <word>]` on the first line replaces the verdict words, and `[stop]` on a `fail` line leaves the later columns of that case as "—". Printing fills every cell and verdict. A `fail` for an undeclared rule, the same rule failed twice in one case, a `fail` before the first `case`, and a table without rules or cases are refused with the line named. The JSON keeps the rules and cases in the root `judge` field. The playground gains a judge table page with four examples: transfers, an airdrop, sign-ups and refunds (#3879)
- A Markdown page made by `dragon export` can now be a guide page with `layout: guide` in its top lines. Each `##` becomes a topic tab, each `###` a numbered section stacked in that tab, and the top of each tab lists the questions it answers, made from the `###` titles. Clicking a question scrolls to its section. A quote right after a `###` title is shown as the answer under the title, and a `<details>` block with `<summary>` becomes a check question whose answer opens and hides on a click. Terms go in a Markdown file of their own, with a `###` heading per term, a meaning, and a quote as the example. A `![Terms](glossary.md)` line before the first `##` loads it as a `Terms` tab, and a link such as `[order](glossary.md#order)` becomes an underline that opens a card with the term, the meaning, and the example. A term written twice, or a link to a term the file does not have, stops the export with the line named. Printing draws every term card, box card, and check answer open. The layouts `entry`, `sidebar`, and `tabs` do not change, and raw HTML other than `<details>` and `<summary>` is still shown as text (#3876)
- A flow or a lineup diagram can now show an amount with a limit as a bar, with `gauge <id> as <name> [on: <box>, limit: <limit>, unit: <unit>]` before the first step. A step moves the bar with `set <gauge>: <total>`, and a step without it keeps the value. A gauge sits right under its `on` box, or in the band at the top without `on`, and gauges stack in the order declared. A step that changes the value shows a `+40` or `−20` tag. Over the limit, a dotted line marks the limit, the part over it is red, and an over the limit tag shows under the gauge. `[over: <text>]` changes the tag. A gauge without `limit` shows only the value and the unit. Other diagram kinds and a lineup with `[shape: layers]` or `[shape: stairs]` refuse `gauge` (#3880)
- Flow (`flow`) and lineup (`lineup`) diagrams can hold up to three scenes. Write the boxes and the steps shared by all scenes once, write each scene's own steps from the point where they split between `scene <name>` and `end`, and `stop <reason>` in a step stops that scene there and shows the reason. `[scenes: stack]` on the first line (the default) lines the scenes up top to bottom with each box at the same horizontal place, plays all scenes together, draws shared steps' lines in gray and a scene's own steps in its color, and marks where they split with a vertical dashed line. `[scenes: pick]` shows a button per scene name; pressing one goes back to that scene's first step and moves only that scene. When printed, both show every scene at its last step, stacked, and a `[note: pop]` card opens just below the box clicked in that scene. A fourth `scene`, a `scenes` value other than `stack` and `pick`, `scene` in another kind of diagram, `stop` outside a scene, and a `scene` not closed with `end` are refused with the line named. The JSON model holds the show and the scenes in a root `scenes` field, and the result of `renderDiagram` holds each scene's drawing in `scenes`. The types `DiagramScene`, `DiagramScenes`, `SceneShow`, `SceneMark` and `RenderedScene` are exported too. Drawing scenes and their player load later with the flow and lineup parts, so the first load does not grow (#3878)
- Diagrams and pages can now be written in HTML from the start. Each notation line becomes one element and a diagram is wrapped in `<dg-<kind>>`. Element and attribute names come from the JSON field names, and a field with capitals becomes a lowercase attribute joined by `-`, such as `label-side`. The `dragon convert` command and the functions `notationToHtml`, `htmlToNotation`, `htmlToDiagram`, `diagramToHtml`, `markdownToHtml` and `htmlToMarkdown` convert between the notation and HTML. A Markdown page becomes `<dragon-page>` with its top lines as attributes, `##` and `###` become `<section>` with headings, and guide pages (`layout: guide`) convert too. The one-line script entry also draws HTML-form diagrams, reading them from a later chunk so a page with only notation blocks loads no more than before. `dragon check` and `dragon check --layout` read HTML files and name the HTML line and element in errors. `class`, `style` and `data-` attributes on a diagram element are left to the page and not read into the diagram (#3908)
- The dragon skill now plans the figures before it writes any. It splits the topic into the questions a reader asks, picks 2 to 4 figures for each question from a table of question types (how it works, pass or block, difference, one case step by step, amount) with the kinds and parts that answer them, and writes the figures one at a time. A new cheatsheet holds the smallest form of every kind and of note cards, scenes, judge tables and gauges on one page, and the table of kinds moves there from `SKILL.md`. The skill builds one HTML page from a guide page (`layout: guide`) with `dragon export`, takes screenshots of each figure and of the page 728px and 390px wide and fixes what they show before handing them over, and keeps two worked example pages that pass `dragon check --layout` with nothing printed. The skill adds the contents `cheatsheet`, `plan`, `page`, `example-library-loans` and `example-support-desk`, and raises the version of `notation` (#3909)

### Changed

- Every part of the English notation guide now keeps sentences to 30 words or fewer, not only the diagram kinds part. The long sentences in the line forms and errors parts are split without changing the notation, the headings, the tables, or the examples (#3889)
- The Japanese READMEs now show pictures drawn from the Japanese examples, so the boxes, the step titles, and the player bar read in Japanese. `pnpm readme:images` draws the English pictures under `docs/readme` and the Japanese ones under `docs/readme/ja`, and `--lang ja` or `--lang en` redraws one language only. The badges are shared by both languages (#3887)
- The diagram kinds part of the English notation guide (`packages/dragon/examples/quick-start.en.md`) now keeps every sentence to 30 words or fewer, as the English READMEs do. Long sentences are split without changing the notation, the headings, or the examples, and a check counts the sentences the same way for the guide and the READMEs (#3884)
- The READMEs now open with a picture of a diagram in light and dark themes, badges for the npm version, the license, and the catalog, and a table that compares dragon with mermaid. A gallery shows every kind of diagram as a picture and links to its section of the notation guide. The notation for each kind moved from the READMEs to a new Diagram kinds section of the notation guide (`packages/dragon/examples/quick-start.en.md`), and the English READMEs were rewritten in plainer English. `pnpm readme:images` redraws the pictures and badges from the examples (#3881).
- `dragon export` no longer follows a pipe diagram (`pipe`) when given `--width`; it writes the whole diagram in the fixed view. The player has always shown pipe diagrams fixed, but the export alone made a following video at widths such as 760, which cut box names and balances at the window edge and left the overview empty. The rule now lives in one place, `chooseView`, and both the player and the export read it. A pipe video exported with a width shows the whole diagram (#3852)

### Fixed

- The playback bar under a diagram drew its restart, previous, play and next buttons, and the zoom buttons of a pipe diagram, with 14px characters (`↺`, `‹`, `›`, `❚❚`, `−`, `+`) that sat below the middle of each button, and on a wide bar the buttons lined up with the top of the step caption instead of its middle. The buttons now draw 18px icons made of CSS shapes, without an `svg` outside the figure, in the middle of each button, and on a wide bar the button row is centered on the step number, title and text. The progress is a 6px bar per step: finished steps are filled with the accent color, the current step fills from the left as it plays, and later steps stay in the line color (#3752)
- In a diagram written in English, every value in the strip under the diagram was drawn in the monospace font, so a prose value such as `refunded` looked the same as a hash such as `8b04f71`. A value without Japanese now picks its font by the line label rule (#3850): a value made of words uses the same font as Japanese values, and a value with a code sign, one that starts with a digit, a word mixing lowercase letters and digits such as a hash, a value cut short with `…`, a version starting with `v` such as `v2.4.0`, and a path such as `m/44'/60'` stay monospace. Wrapping the whole value in backticks draws it in the monospace font without the backticks, and a field's width and the place of its tag are measured in the chosen font. The examples wrap the branch names `main` and `feature`, the commit names of the squash diagram, and the path root `m` in backticks (#3856)
- A pipe diagram without token boxes drawn with `layout top`, `layout ledger`, or `layout bottom` no longer leaves an empty band above the people where the token boxes and their card wallets would go. In the catalog's ETH transfer diagram, the space from the top edge to the call card was 330px with `top`, 220px with `ledger`, and 90px with `bottom`. Without token boxes nothing is kept above the people, the call card sits above the contract it calls, and the space from the top edge to the card is 20px, the same as with `mesh` and `bus`. A diagram without token boxes drawn with `layout auto` picks `bottom` and gets the same fix. Diagrams with token boxes keep their placement (#3860)
- The catalog no longer loads the table of part examples, which only the catalog pages use to find the examples of a part, in the script it loads first. The first screen checks a part address against the block list it already has, and the part page reads the part from the catalog chunk it loads later. The script and CSS it loads first shrink from 186.2KB to 183.3KB after gzip and fit the 186KB budget again (#3868)
- The guide page's embed section now shows the fifth code of the README's embed section, which reads the id of a pressed box with `closest('[data-node]')`, with the same text, so the page and the README show the same five codes again (#3868)
- In a diagram written in English, every line label was drawn in the monospace font, so a prose label such as `Approve` looked the same as a code label such as `transfer(Bob, 100)`. A label without Japanese is now drawn in the monospace font only when it has a code sign (`()`, `_`, `/`, `0x`, or a capital inside a word) or starts with a digit; other labels use the same font as Japanese labels. Wrapping the whole label in backticks draws a command with no sign in the monospace font, without the backticks. Label widths are measured in the font they are drawn in. `strip` values keep the monospace font, and the examples now wrap the `git rebase main` and `git switch main` labels in backticks (#3850)
- In a pipe diagram with the mesh layout, a pipe from a tank that has the same owner's tanks on both sides no longer starts on the rounded bottom corner and looks detached from the tank. The gap next to the tank widens from 16px to 48px only where a pipe passes, and the pipe leaves from the flat side. Only when other pipes already use both sides of the tank does the pipe leave from the end of the flat bottom (26px from the center), and the balance, change, and state text it would cross moves sideways. In the ledger, bus, top, and bottom layouts, a pipe between two ETH tanks also leaves the bottom 26px from the center (#3781)
- On a page that does not load the bundled fonts, diagram text and the bar's title and text no longer fall back to the browser's default font, which is a serif (Mincho) font for Japanese. The font variables `--sans` and `--mono` now name the bundled fonts first and end with the device's gothic fonts and `sans-serif`, and with monospace fonts and `monospace`. Every diagram, the bar, the still figure, and the HTML page read this one list. With Noto Sans JP loaded, diagrams draw in the same fonts as before. Layout still measures text with the bundled fonts, so text in a fallback font can be a few pixels wider (#3847)
- In a pipe diagram, the tag on a `delegatecall` pipe is no longer hidden behind a box and a log card. On the last step of the `vault-proxy` example, the top of the tag sat under the VaultProxy box and its right end under a log card, so only `delegateca` could be read. When there is no spot beside the pipe clear of boxes, tanks, gauges, log cards and dotted lines, the tag now sits on its own pipe and is drawn above the lit pipes of every step, and log cards and call cards keep clear of it. `dragon check --layout` also reports, as the break kind `chip-over-part`, a call tag, a log card or a call card that overlaps a box, a tank, a gauge, the valve of a token box, the tag of a returned value or another such tag (#3854)
- In a narrow frame, the overview of a following donut chart (`chart` with `[shape: donut]`) no longer shows only the frame of the part you are looking at. The overview draws the ring segments of the items that have a value at the last step in their colors, and each legend row as a card in its item's color. A new check lays out the examples of every diagram kind at five widths and requires at least one overview part for every example that can follow, so a newly added kind cannot land with an empty overview (#3852)
- At phone width (390), the overview of a following `sankey`, `venn`, `er`, `chart` or `cycle` diagram no longer shows only the frame of the part you are looking at with nothing else in it, which left you unable to tell where in the whole diagram you were. The overview now draws the diagram in small: the curved bands and bars of a `sankey`, the circles and names of a `venn` with overlaps blended as in the diagram, the tables, header rows and relation lines of an `er`, the plot area, lines and points of a line `chart`, and the chevrons and return line of a band `cycle`. The step-by-step bars, treemap, dots, funnel and clock shapes draw their own parts too, and an `er` diagram that follows at width 760 gets the same overview. Circles and curves are drawn as smooth circles and paths, and the overview of the other kinds, such as `mind`, is unchanged (#3849)
- At phone width (390), a following `mind`, `sankey` or `state` diagram no longer cuts the box at the far end of a line drawn in the step (the parent of the added idea in `mind`, the source of the added band in `sankey`, both states of the line in `state`) at the window edge, which left you unable to read where the added parts come from. The window moves toward that box while keeping the added parts in view, and a box that is still cut gets a tag with its full name inside the window frame. The tag covers the visible part of the box with the same shadow so no edge of the cut box shows outside it, is drawn under the step badges, and shows only while its step is held. Steps whose line-end boxes already fit, and windows at width 760, stay as they were (#3836)

- At phone width (390 or less), the amount chips of the step-by-step bars of a sankey diagram (`[shape: rows]`) no longer overlap each other, and the score chips on the axes of a scored two-axis matrix (`[shape: scatter]`) no longer overlap the names of the points. When two amount chips of one step would overlap, the later chip stops one chip higher and the gap above that row grows by one chip. When a score chip would touch the name of a point shown at that step, the chip moves to the left of the vertical axis or below the horizontal one for that step. Chips and names keep their size, and diagrams that did not overlap at the default width are drawn as before. The record of breaks in the examples is empty again (#3791)
- `dragon check --layout` and `checkLayoutText` also report two texts seen at the same step that are drawn on top of each other, as the break kind `texts-overlap` on the `step` line. The message is the one `dragon export` prints for the same overlap, and a line that runs across a text is still reported once, as `line-crosses-text`. The layout check of the examples and the script that rewrites its record read one list of examples, which now also holds the `.dragon` files in folders under `examples`, the diagrams in the md files, and the `.dragon` examples of the docs page, and the `.json` diagrams of the docs page are drawn from the diagram and checked for no breaks. The two overlaps found (step 4 of `day-hours` and step 3 of the scatter diagram in `quick-start.md`, both at width 390) stay in the record until a later issue (#3791) fixes them. The `layout` reference of the dragon skill explains `texts-overlap` and how to fix it, and the skill raises the version of its `layout` content (#3790)
- On pages with the one-line jsDelivr entry and pages made by `dragon embed`, a `data-header` block loads the bar together with the parts its notation uses and draws the diagram once inside the bar, instead of drawing a plain diagram, removing it, and drawing it again, so the text below no longer moves when the bar appears. The SDK's `mountDragon` and `mountFramedDiagram` write notation errors in the bar's language, so they are in Japanese on a `<html lang="ja">` page (#3789)
- A still figure writes the shape of its last step as plain values instead of keyframes stopped at that moment, so a donut keeps one arc per item and bars keep their lengths on a page that turns animations off, such as one with `* { animation: none !important; }` for reduced motion. Moving diagrams keep their keyframes. A line chart puts each value above, below, right of, or left of its point, in that order, where it crosses no line, point, or other value and stays between the legend and the zero line, and a still line chart shows the value of every step (#3812)
- The catalog loads the release notes page and the page shown for unknown addresses after its first screen, like the guide and catalog pages, instead of in the script it loads first. The script and CSS it loads first shrink from 186.2KB to 185.4KB after gzip and fit the 186KB budget again. The two pages look the same and are read in the background once the first screen is drawn (#3832)

## [0.79.7] - 2026-11-24

### Added

- **Every drawn box and group carries its notation id in `data-node`** (#3795)

  `box api as API server` draws an element with `data-node="api"`, and `group src as Sender` draws one with `data-node="src"`. A page that places a diagram can read the id of the pressed box with `closest('[data-node]')`, so two boxes with the same name are no longer mixed up. Lines and labels carry no id. The shared boxes, groups, sequence heads, pipe parties and token boxes, lineup lanes, and matrix areas carry it, and the embed docs and the README show how to read it.

## [0.79.6] - 2026-11-23

### Fixed

- **A following sequence diagram whose height fits the window no longer shows the row of head boxes twice** (#3834)

  When the window shows the whole height of the diagram, it pins no head row, shows the head boxes of the diagram with their icons, and follows only sideways. When a diagram pins the head row and the part from the bottom of the head boxes to the bottom of the diagram is lower than the room under the head row, the window shrinks to that height so the edges of the head boxes do not show under the head row. A sequence diagram with a chosen look (`[shape: pipe]`) and a diagram well taller than the window look the same as before.

## [0.79.5] - 2026-11-21

### Fixed

- **Mesh pipe diagrams keep the boxes and the people in the same place when only the caller, the arguments or the ticket's holder changes** (#3826)

  0.79.4 decided the gap under the boxes by whether a ticket was tied to a person, which depends on the call being drawn, so switching the call of a catalog figure moved the boxes and the people by 34px. The gap under the boxes is now decided by the turns of every path from a person to a box, as in 0.79.2, so every mesh figure keeps the 72px gap and the same figure stays still across calls.

## [0.79.4] - 2026-11-21

### Fixed

- **Mesh pipe diagrams keep room for an allowance ticket above the person it belongs to, and tie the ticket to that person again** (#3819)

  0.79.3 pulled the boxes closer to the people row when no pipe turns under them, which left less room than a ticket's height, so in figures such as an ERC-20 `approve` or `transferFrom` the ticket slid away and lost its line to the person. A mesh figure with a ticket tied to a person now keeps the 0.79.2 gap of 72px under the boxes, while figures without such a ticket stay as close as in 0.79.3. A ticket is also placed where it overlaps the person sideways and can be tied with a short line before any spot that cannot, so the ticket in the multicall figure is now tied to Bob as well.

## [0.79.3] - 2026-11-21

### Fixed

- **Mesh pipe diagrams bring a call pipe into the middle of a token box's side with as few bends as possible** (#3813)

  When the caller's circle sits outside the width of the box, the call pipe rises to the box's vertical middle and turns once into the middle of the nearer side, instead of entering near the bottom corner. A caller right under the box still goes straight up into its bottom edge. Pipes entering the same side are spaced evenly around the middle, and the farther caller enters higher so the pipes do not cross. A box with no pipe turning under it sits 34px closer to the people row. When a pipe through the middle would leave no room for the card holder left of the boxes and the top right is also taken, the pipe drops just below the card holder. The holder on the left also tries the top of the box row when its own box is lower, so it no longer slides down onto a tank's balance text.

## [0.79.2] - 2026-11-20

### Changed

- **Pipe diagrams round the corners of their pipes, draw value pipes as an outlined tube, put tank names above the glass, and make the liquid wave** (#3783)

  Value pipes, call pipes and flow lines now bend through the same shared line path as the other diagrams, with the shared 12px radius; the arcade palette keeps square bends. A value pipe is a 14px ink stroke with an 11px bore, leaving a 1.5px rim on each side. A tank name sits outside, above the glass, with 8px between the bottom of its text box and the top of the glass. When the name shares the row with the input and output tags, the name goes to the left edge and the tags to the right edge. The top of the liquid is cut into a wave that drifts sideways, and stays still when reduced motion is requested.

## [0.79.1] - 2026-11-20

### Fixed

- **In the mesh layout of a pipe diagram, a pipe between two tanks that are not next to each other leaves from the side of the tank** (#3775)

  The pipe used to leave from the bottom of the tank, 9px in from the corner, to keep clear of the balance text under the tank. That point sat on the rounded corner, so the end of the pipe looked detached from the tank. The pipe now leaves from a side of the tank and goes down outside it. When the people between the two tanks hold no tank and no plate, the two sides are joined by one straight pipe, as two tanks next to each other already are. A tank with no free side still sends the pipe from its bottom.

## [0.79.0] - 2026-11-20

### Added

- **The player takes `canvas` and `fitNarrow` for pipe diagrams** (#3761)

  With `canvas: true`, a frame 600px wide or wider puts a pipe diagram in a canvas window: the frame does not scroll, a drag moves the figure in any direction, the wheel zooms around the pointer, and choosing a step moves the figure so the current step comes into the window. The page sets the height of the window. A narrower frame scrolls as before. With `fitNarrow: true` next to `fitWide`, a figure narrower than a frame 600px wide or wider starts widened to the frame, up to its natural size.

- **`PipeCallTag`, `PipeEnclosure`, `PipeScore` and `PipeTicket` are exported as types** (#3761)

### Changed

- **Pipe diagrams are placed and drawn the way the patch Tracelyth applied to 0.68.1 placed and drew them** (#3761)

  Tracelyth used dragon with a patch that held the fixes of 38 of its issues. The fixes are now in dragon, so Tracelyth can use dragon without the patch. With `layout top` and `layout bottom`, a value pipe leaves and enters a tank through a port on the left or right edge of the tank, drops into the gap next to the nearest tank before it runs under the row, and the bends of nearby lines take separate heights so that no two lines share a run. Value pipes no longer carry chevrons. A written value counts from the old value to the new value with the old value struck through, and a move counts the amounts of both tanks. A return chip that does not fit on its call pipe widens the gap between the two parties, or between their rows for a vertical pipe, and the diagram is placed once more. The zoom buttons draw line icons instead of characters. In the player, a vertical wheel over the figure zooms around the pointer with or without Ctrl or Command and does not scroll the page, and a wheel turned more sideways than vertically scrolls the figure sideways.

## [0.78.0] - 2026-11-19

### Added

- **`dragon export notes.md` writes one HTML page from a Markdown file, with the headings split into pages and tabs** (#3755)

  `#` is the page title, the text before the first `##` is the entry, `##` is a group, `###` is an item with its own page, `####` is a tab in the entry and in an item page, and `#####` is a tab inside a tab. The default layout (`layout: entry`) shows the entry with one card per item, grouped by `##`, and a card moves to the item's page without reloading; the item page leads back to the entry and to the items before and after it. `layout: sidebar` keeps a table of contents on the left, and `layout: tabs` puts the groups in tabs on top and the items of a group in tabs below them. The address of the page keeps the item and the tab that are open, so reloading opens them again. A box in a diagram moves to an item when its link names the item's place, such as `[link: #take-the-order]`, made from the heading text the way GitHub makes heading anchors. A line that holds only `![name](path)` puts a `.md` file in the page as Markdown, a `.dragon` file as a diagram and any other text file as a named code block, and reads only files in the folder of the Markdown file and below. Raw HTML is shown as text. The words the page adds follow the language of the text, and `--lang` picks them. A notation error, a link to a missing place, an include outside the folder, an unknown `layout` or a `###` before the first `##` stops the export with the file and line, and the export refuses the diagram options such as `--fps`. The same work is `exportPage` from `@cardenelabs/dragon/node`, and the worked example is in `packages/dragon/examples/page/`.

- **A box link and a step source can name a place on the same page that starts with `#`** (#3755)

  `[link: #order]` is accepted in the notation and in the source JSON, next to paths that start with `/` and URLs that start with `http://` or `https://`. Other forms such as `javascript:` are still refused.

### Changed

- **A pipe diagram in an HTML file from `dragon export`, in a page from `dragon embed` and in the gallery is drawn the first time without searching for its line paths** (#3748)

  The first time a new process drew a pipe diagram, it placed the parts and searched for the paths of the lines, which held up the main thread. `dragon export` for HTML, `dragon embed` and the gallery build now place each pipe diagram while they write the page, store the layout of the first view and of each view with one folded box opened, and pass the stored layouts to the drawing, which `renderDiagram` takes as `layouts`. A stored layout carries a key made from the diagram, the language, the words and a fingerprint of every file in `packages/dragon/src`; a layout whose key does not match is not used, and the diagram is placed on the spot as before. In 464 drawings of the 58 pipe examples with eight forms of the `layout` line, the layout and the SVG drawn from the stored layouts match those placed on the spot.

### Fixed

- **A diagram block hidden when the page loads is drawn when it is shown, and a diagram hidden and shown again keeps its motion in step with the player** (#3755)

  The script line drew every block when the page loaded, so a block inside a tab hidden with `display: none` was drawn into a frame with no width and stayed empty when the tab opened. A block that has no width then is now drawn when it first gets a width. A drawn diagram that was hidden and shown again restarted its motion from the beginning while the player's clock kept running, so the picture showed an earlier step than the step number; the player now places the picture at the clock's time when the frame gets its width back.

- **Step numbers stay hidden inside an ancestor hidden with `visibility: hidden`** (#3755)

  The step number marks set `visibility: visible` while they moved, which showed them through a tab hidden with `visibility: hidden`. They now take their visibility from the ancestor while they are shown, so a visible diagram shows them as before.

## [0.77.1] - 2026-11-18

### Changed

- **A pipe diagram with an opened box finds the places of its call cards faster** (#3737)

  Looking for free places for the call cards took most of the time to draw a pipe diagram with an opened box. The search now keeps, for each column of candidate places, only the parts that overlap it sideways, checks overlaps before the distance to the lines, and measures the distance only to the line points near the card. The formulas and the order of the sums are unchanged, so every card stays where it was. In 588 drawings of the pipe examples (the seven `layout` choices, the sets of opened boxes, the widths, and with and without a still frame), the card places, the SVG and the whole layout match those drawn before the change. Drawing `aggregator` with box 2 opened takes 0.33 seconds of CPU time once warmed up instead of 0.89 seconds, and 1.18 seconds instead of 1.87 seconds the first time in a new process.

### Fixed

- **A diagram with the bar draws its text without an outline, and its player bar keeps clear of the frame's edges** (#3744)

  In a diagram placed with the bar by a script line with `data-header`, `mountDragon` or `<dragon-diagram>`, the rule that draws the bar's button icons with 1.6px lines also matched the diagram's SVG, so the diagram's text and background took a 1.6px outline in the text color. The text looked bold and smeared, and a dark line showed between the diagram and the player bar. The rule now applies only to the icons in the bar's header, which keep their 1.6px lines, and the diagram draws the same lines as without the bar. Like a shared HTML file, a diagram with the bar now leaves 16px on the left and right of the player bar and the call results and 12px under the player, so the step number, the next button and the progress marks no longer touch the frame's edges or get cut by its rounded corners. A diagram without the bar still leaves that room to the page.

## [0.77.0] - 2026-11-17

### Added

- **A `route` line in pipe diagrams that passes the call paths the placement keeps open, and a placement that keeps cards and lines apart and leaves no empty band for any number of people and boxes** (#3721)

  `route bob -> usdc`, one pair per line after the `layout` line, makes `layout top` and `layout bottom` keep that call path open, so dropping steps moves no person, box or tank. A diagram without route lines keeps open only the calls from people that appear in its steps. The source keeps the pairs in the `routes` field. Each line gets its own track so no two lines overlap, lines cross at right angles, and value pipes enter tanks from the top. Log cards sit in a band above the call lines in the order they were emitted, tied to the emitting box with a dotted line, and the band takes two rows when the cards do not fit in one. Value pipes carry a chevron every 44px, the old value of a value plate is no longer struck through and sits just under the plate with the word `Was` and its status, and the In and Out tags of a swap sit above the owner's dashed frame. A contract that stores values is drawn as a cabinet even when no step calls it, and a token table whose value changed is not drawn faint. The dark theme draws faint parts stronger than the light theme. The player's `fitWide` starts at the size where names read at 10.5px only when fitting the whole figure would make them smaller. The notation check also reports overlapping boxes and tanks (`parts-overlap`), value pipes over text (`line-over-text`) and empty bands of 200px or more (`empty-band`).

- **A pipe look for sequence diagrams (`[shape: pipe]`) and the operation number of a line (`[op: <number>]`), taken from the fixes Tracelyth applied** (#3720)

  `[shape: pipe]` on the first line of a sequence diagram draws it with the parts of the pipe diagram: each lifeline is a pipe, each box sits on top of its pipe, `hold <owner>: <amount> <token>` lines before the first step put the balances under the boxes, and each step draws a band for the current step and arrows for the money it moves. A sequence diagram without the attribute keeps the current look and refuses `hold`. With `@cardenelabs/dragon/light`, `loadFor` or `loadLook("pipe")` loads this look as a separate chunk, so the gallery's first load does not grow. A line of a sequence diagram takes `[op: <number>]` in either look, and the drawn line carries the step and the number in `data-op`. `op` on a line of another kind of diagram is refused with its line and column. Tracelyth's `[carry: none, op: <number>]` reads as it is.

- **A `layout` line in pipe diagrams that chooses how to place the token boxes and tanks** (#3720)

  `layout top` and `layout bottom` put the token boxes above or below the row of people, `layout ledger`, `layout mesh` and `layout bus` set the tanks in one row per token, and `layout auto` tries `top` and `bottom` and the box orders (up to 4 token boxes) and picks the one with the fewest crossing lines. The places come only from the `box` and `hold` lines, so changing who calls or the arguments moves no box or tank, and people and boxes outside the calls are drawn faint. A token box lists each holder's balance on a row marked with the holder's initial, and a row whose value changed shows the old value, an arrow and the new value. A write that is not a transfer, such as an approval, is drawn as a line between the two parties with a tag that keeps clear of the check needle, the call cards and the wallets.

- **Player options to start before step 1 and to start the whole figure and zoom out further** (#3720)

  `pausedAtStart` and `rewind()` stop at the values before step 1 changes them. `fitWide` starts a figure wider than its frame with the whole figure in view, `minZoom` lets the reader zoom out below the starting size, and `startZoom` and `onZoom` pass the zoom in and out. Once the reader drags or zooms the figure, moving to the next step no longer moves the frame to the parties, and choosing a step moves it again.

- **Pipe diagrams can mint, burn, and move NFT and ERC-1155 token IDs** (#3722)

  `mint usdc: 100 -> alice` fills only the receiver's tank, and `burn usdc: 100 alice` drains only the holder's tank, so a diagram no longer needs a zero address party with a balance. In the JSON source they are a `move` without `from` or without `to`. For NFTs and ERC-1155, the token ID follows `#` and the count goes before it (`move art: #1 alice -> bob`, `move items: 2 #1 alice -> bob`, `mint art: #3 -> alice`, `burn art: #3 alice`); without a count it is one. Balances with an ID are written the same way (`hold alice: #1 ART`, `hold alice: 5 #1 ITEMS`), each ID gets its own tank such as `ART #1`, and a move draws the line from the holder to the receiver. A `#` with no ID after it is refused when read. Value names that start with `#` are written back in `"`. Moving an amount with `move usdc: 100 alice -> bob` reads and draws as before.

### Changed

- **Pipe diagrams place valves at the middle of their straight runs and let calls leave from the bottom of a contract** (#3720)

  A valve is looked for from the middle of the straight run it sits on outward. A call may leave a contract from the bottom edge, and the gap between two stacked parties widens by the width of a return tag when the tag has no free place on the call pipe between them. A phone-wide frame draws the same arrangement as a wide one, and the player moves to the current step. A shared HTML file draws a diagram with holdings without stopping.

### Fixed

- **A box's slot frame fits the carriers it holds at the moment, even when a wider carrier passes the same box in another step** (#3723)

  The frame around a box's slot (`rect.dg-slot`) wraps the carriers sitting in the box during each span, with the slot padding on both sides. A box that holds only a thin letter in one step and a long-labelled tag in another shows the narrow frame while it holds the letter, instead of the tag's width in every step. The box width and the place of the slot still follow the widest carrier, so the box does not jump between steps. A box that only one kind of carrier passes draws its frame at the same place and size as before.

## [0.76.0] - 2026-11-15

### Changed

- **The dragon mark is the scale icon alone, and the catalog cards have the same bar as an embedded diagram** (#3713)

  The mark left of the title in a diagram's bar draws the scale icon only and no longer has the `dragon` text; its accessible name stays. The gallery header mark and the favicon draw the same scale. On a catalog kind page, the example card replaces its title, the Diagram and Code tabs and the Enlarge button with the bar: the first row has the mark, the title and the Code, Editor, Copy, Export and expand buttons, and the second row has the palette picker and the zoom controls. Copy offers the notation, an image and the editor URL, Export offers PNG, SVG, GIF, MP4 and HTML, and expand opens the same enlarged view as before. At narrow widths the bar keeps the mark and the title on one row.

## [0.75.0] - 2026-11-15

### Added

- **`embedUrl` for the gallery's embed page, and how to embed a diagram in the README, the docs page, a sample page and the plugin** (#3701)

  `embedUrl(source, { base, lang })` from `@cardenelabs/dragon` returns the URL of the gallery page `/embed` with the notation compressed after `#z=` (or after `#n=` where the browser cannot compress), so a page that cannot run the package can open the diagram with its bar in an iframe. The README (English and Japanese) has a section on embedding a diagram in other tools: one script line with `data-header`, the SDK function `mountDragon`, the Web Component `<dragon-diagram>` and an iframe from `embedUrl`, with the `look`, `buttons`, `header`, `lang` and `nonce` settings and the four events. The gallery's docs page has the same section with the same code and a copy button on each code block, and its link opens a new sample page `/embedding` that places one diagram in all four ways side by side. The one-line script sample there loads the built script entry copied into the gallery. The plugin's skill points tools that want the bar to a new reference, `references/embed.md`.

- **A Web Component `<dragon-diagram>` and an embed page in the gallery that other pages open in an iframe** (#3700)

  `defineDragonElement()` from `@cardenelabs/dragon/embed` registers `<dragon-diagram>`. The element reads the notation from its text, puts a diagram with the bar in its shadow root, and drops the bar with `header="false"`. It passes the nearest `lang` attribute from the element up and its `nonce` to the diagram, redraws when the attributes or the text change, and removes the diagram when it is taken off the page. The four events reach the page outside the element. The gallery page `/embed` draws the notation after `#z=` or `#n=` in its URL with the bar, takes the bar language from `?lang=ja` or `?lang=en` (English otherwise), and sends the same four events to the page that placed the iframe with `postMessage` as `{ source: "dragon", type, detail }`. A diagram placed with `header: false` now puts the player styles in the root it was placed in, so they also reach a shadow root.

- **The one-line script entry puts the bar on blocks with `data-header`** (#3699)

  A `<pre class="dragon" data-header>` block now becomes a diagram with the same bar as `mountFramedDiagram`: Code, Editor, Copy, Export and expand. Blocks without the attribute stay plain diagrams. The entry draws the diagram first and then loads the bar as a separate chunk, so pages without `data-header` load no more than before. Exporting HTML, GIF or MP4 from the bar loads `dist/cdn/capture.js`, which bundles the video encoders, only when you export.

- **An SDK entry for tools and services that put diagrams on their pages (`@cardenelabs/dragon/embed`, `mountDragon`)** (#3698)

  `mountDragon(host, source, options)` puts a diagram with the bar by default. The `look` option fits the bar color, the bar font, font size, button corners and height, and the line and background of the frame around the diagram to the page. The `buttons` option drops and reorders the bar buttons and adds your own buttons, whose `onClick` receives the placed diagram. `header: false` puts only the diagram, and the returned object still exports (`export`), opens the editor (`openEditor`) and copies (`copy`). The element you placed it in sends four events with `bubbles` and `composed`: `dragon-render` (drawn or not), `dragon-step` (the step changed), `dragon-export` (exported) and `dragon-share` (opened the editor or copied). The names the entry exports are listed in `src/embed/names.json`, and a test fails when the entry and the list differ. `mountFramedDiagram` takes the same `look`, `buttons` and `notify` options.

### Changed

- **The one-line script entry loads 3.3 KB less before the first diagram** (#3706)

  Block definitions now sit in one first-load file instead of 18 small ones, so a page with only a sequence diagram loads 86,664 bytes (gzip) in 22 files instead of 89,992 bytes in 39.

- **The editor button packs the notation into the URL, and copies a notation too long for a URL before it opens the editor** (#3697)

  The Editor button in the bar now compresses the notation in the browser with `deflate-raw` and puts it after `#z=` in the editor URL, so longer diagrams still open in the editor with the same text. When the packed URL would still be longer than 8000 characters (`EDITOR_URL_LIMIT`), the button copies the notation to the clipboard first, opens the editor at `#paste`, and the bar asks you to paste it there; the editor opens with an empty notation field that says to paste. The editor still opens the uncompressed `#n=` URLs. Nothing is sent to a server: the notation stays after the `#`, which browsers do not send. `packedEditorUrl`, `readEditorHash`, `readPackedEditorHash`, `editorHashKind`, `editorPasteUrl`, `EDITOR_URL_LIMIT` and `EDITOR_PASTE_HASH` are exported. The SDK's `editorUrl()` and `openEditor()` now return promises, and the Editor URL in the copy menu is the packed one.

- **The bar on a framed diagram gets the dragon mark, copy and export menus, and the language of the page it sits on (`mountFramedDiagram`)** (#3695)

  The bar now puts the dragon mark left of the title, which opens the gallery in a new tab, and lines up boxed Code, Editor, Copy, Export and an icon-only expand button. Copy writes the notation, a PNG of the diagram or the editor URL to the clipboard. Export groups PNG and SVG under Images, HTML, GIF and MP4 under Motion, and dragon notation (`.dragon`) and JSON under Notation, and lets you pick the size (1x, 2x, 3x) and the background (fill, transparent) for images. Only one menu opens at a time, and clicking anywhere else closes it. The bar speaks the `lang` option, else the `lang` attribute above where it sits, else English. The bar, the player, pipe calls, try inputs and checkout styles now go into the frame's shadow root through `adoptedStyleSheets` instead of `<style>` elements in the page head, so the player inside the frame is styled and pages that block `<style>` elements still work; browsers without `adoptedStyleSheets` get `<style>` elements carrying the `nonce` option. Text inside the frame falls back to sans-serif fonts instead of a serif face when the bundled fonts are not loaded.

### Fixed

- **The checkout diagram's wording reads naturally, and waiting shows as motion** (#3691)

  While the seller recalculates the purchase conditions, the payment is processed or the order is looked up, the heading and the action button show a spinner. Waiting for the buyer's approval, and a lost response before the lookup starts, do not spin. With reduced motion the spinner stops and the waiting circle and text stay. Looking up the order now goes through its own state: the purchase conditions cannot be changed during the lookup, repeating the lookup does not add orders or payments, and a late reply after the session changed is ignored. The notices and log lines no longer break sentences with extra commas.

- **The gallery catalog shows the checkout diagram at its natural height and scrolls to its bottom** (#3693, #3696)

  The checkout diagram in the catalog was cut off at the bottom of its frame. It now shows at the height it needs on its own background, and the page scrolls to its last line.

## [0.74.0] - 2026-11-14

### Added

- **A colored icon you have can go on a box in its own colors (`paint`, `view`, `dragon icon`)** (#3633)

  An icon was one `path` filled in the color of its box, so the multi-colored icons a cloud provider hands out could not keep their colors. A block definition based on icon can now take colored shapes as `paint <color> "<path>"` lines and the view box of the original SVG as a `view <x> <y> <width> <height>` line. When drawn, the view box is scaled into the 20 by 20 square of an icon and each shape is filled in its own color, not the box color. A color takes only `#` and hex digits and a shape only path syntax, so a definition stays data only. A colored icon can go on the boxes of every diagram kind that takes icons. `dragon icon <file.svg>` turns an SVG you have into definition lines, and refuses shapes not filled with one color (gradients, patterns, embedded images, text) and elements with a transform or a stroke, naming the element. The architecture page now says to use the latest icons from the provider and not to abbreviate a box name the first time it appears. The gallery gets the `photo-delivery` example (receive, shrink and deliver photos) in Japanese and English.

- **A Sankey diagram can make the whole amount one square and split it into areas by amount, step by step (`[shape: treemap]`)** (#3642)

  A Sankey diagram shows amounts by the width of its bands, so it could not compare by area how much of one whole each part takes up. Start the first line with `sankey <title> [shape: treemap]`, and with the same `box` lines and lines inside the steps, the whole amount becomes one square and each step draws a cut that carves out its target sections. A section's area is its share of the total of the boxes with no source. The part not split yet is cut across its longer side by the share of the amount, and lines written in the same step from the same source carve out one strip as large as their total, divided in the order the lines are written. A cut stays between the edges of the square it splits. When a target section is split again, its frame and name chip stay and the inside below the chip is divided into the child sections. Sections show their name and amount, and no amount chip is drawn. What a box with no source has not handed out yet is a gray section that reads like `48GB left`. When a name does not fit in its section, the section shows only the amount and the name is listed under the square with a color mark. The gallery gets the `phone-storage` example (what fills a phone's storage) in Japanese and English.

- **A Sankey diagram can stack how the amount is split, one full-width bar per step (`[shape: rows]`)** (#3641)

  A Sankey diagram grows bands from a source bar to its target bars, so it could not show in one bar how the whole amount is split at a given step. Start the first line with `sankey <title> [shape: rows]`, and with the same `box` lines and lines inside the steps, one full-width bar per step stacks from the top. Each row is split into the sections that the lines so far have cut, and a section is as wide as its share of the total of the boxes with no source. Each line cuts its target section out of the source section, from the left and in the order written. Sections that split off in that step and the sections of the last row show their name and amount, and sections carried over from the step before are faint bars with no text. What a box with no source has not handed out yet is a gray bar that reads like `16h left`, not a dashed frame. The band coming down from the row above and the amount chip are drawn only for the sections that split off in that step. When a name does not fit in its section, the section shows only the amount and the name is listed under that row's bar with a color mark. The gallery gets the `day-hours` example (how a day's 24 hours are spent) in Japanese and English.

- **A lineup diagram can set its layers as stairs and show the time spent so far on a scale (`[shape: stairs]`)** (#3640)

  The layers look stacked its layers as bands of the same left edge, and the time each layer took could only be written as a `note`. Start the first line with `lineup <title> [shape: stairs]`, and the layers sit top to bottom in the order written, each lower layer shifted right by the same width, with the same `box`, `item`, `line`, and `note` lines as the layers look. The chip steps down one layer per `line` and walks no line between layers. With `[time: <length>]` on every layer `box`, a scale of the time spent so far sits to the right of the stairs, with numbers from 0 in round steps (1, 2, or 5 times a power of 10) in the largest unit written on the boxes. At each step the needle of the scale moves to the time spent through the layer the chip went down to, including that layer, with a card such as `1min 3s`. Write a length on every layer or on none, and `0s` for a layer that takes no time. At a phone width the stairs fill the width and the scale lies horizontally under the diagram. The gallery gets the `video-publish` example in Japanese and English.

- **A cycle diagram can unroll its ring into a band that runs the steps left to right, one band per round (`[shape: band]`)** (#3639)

  A cycle diagram set its steps on a ring or a dial, so what happened in an earlier round did not stay on the diagram. Start the first line with `cycle <title> [shape: band]`, and the steps run left to right in the order written as chevrons of equal width, with one band per round stacked top to bottom. A round that has not started yet stays faint, and the head of each band shows the strip title and the field values of that round. The chip of a line runs along the middle of the band from chevron to chevron, and the chevron it reaches stays lit. The chip of the line from the last step to the first one follows a return arrow from the right end down to the left end of the next band. With `[time: <length>]` on every step `box`, a scale over the band marks when each step starts, counted from 0 in the largest unit that writes every mark as a whole number or with one decimal. Write a length on every step or on none. `turn` cannot be written. At a phone width the chevrons shrink with the step numbers inside, and a list of numbers, names and lengths sits below the bands. The gallery gets the `farm-year` example in Japanese and English.

- **A cycle diagram can show how long each step of a round takes on a clock dial (`[shape: clock]`)** (#3638)

  A cycle diagram only set its steps evenly on a ring, so there was no way to show how much of a round each step takes. Start the first line with `cycle <title> [shape: clock]` and give each step `box` a length such as `[time: 25min]`, and the steps sit on a clock dial clockwise from 12 o'clock as arcs whose angles are their share of the total length. A length is a number other than 0 and a unit (`ms`, `s`, `min`, `h` or `d`). Three to six numbers sit around the dial from 0 at a step of 1, 2 or 5 times a power of 10, in the largest unit written. One hand turns, for each line in a step, from where it pointed to the start of the receiving step, and the chip of the line rides the tip of the hand. The arcs entered in the current round, until the hand passes 12 o'clock, stay lit in their step colors. A step too short to hold its number on the arc has the number led out of the dial with a short line. `[shape: clock, turn: left]` turns the dial counterclockwise. `time` and `turn` without `[shape: clock]`, a box without `time` in the clock look, a `shape` other than `clock`, a `turn` other than `left`, and a `time` that is 0, not a number or has no unit are refused when the notation is read. At phone width the dial fills the width, step numbers sit outside it in place of the names, and a list of numbers, names and lengths sits below. The catalog has an example in Japanese and English of a schedule of focus and rest, and the editor shelf has the clock head line.

- **A two-axis matrix can plot items as dots at their scores (`[shape: scatter]`)** (#3637)

  A two-axis matrix only put each item's card into one of the four areas, so there was no way to show where in an area an item sits or how close two items are. Give an item scores from 0 to 10 with at most one decimal place as `[x: <across>, y: <up>]`, and `line: <item>` in a step places it without naming an area, into the area its scores fall in; 5 or more counts as the large side on each axis. Start the first line with `matrix <title> [shape: scatter]` to rule both axes from 0 to 10 and plot each item as a dot at its scores, with guide lines from the dot of the step to the axes, its scores in chips on the axes, and a table of the items and their scores on the left. Items with the same scores share one dot. `[shape: scatter, table: none]` leaves the table out and puts each step number in a corner of the area that clears the area name and the dots. `reverse: yes` on an axis line puts large values on the left or at the bottom in either look. Scores outside 0 to 10, scores with two or more decimal places, only one of `x` and `y`, `line: <item>` for an item without scores, and `line <area>: <item>` with an area that does not match the scores are refused when the notation is read. `table` without `[shape: scatter]` is refused when the notation is read and when a JSON source is checked, and `table` outside a two-axis matrix is refused when the notation is read, as is `[shape: scatter]` on a chart, naming the two-axis matrix. At phone width the table sits on top with the plot below it. The catalog has an example in Japanese and English that plots the next features by effort and impact, and the editor shelf has the scatter head line.

- **A checkout diagram where readers change the conditions of a purchase (`checkout`), and entries that put a shared header on article figures (`@cardenelabs/dragon/frame`, `@cardenelabs/dragon/header`)** (#3677)

  `checkout` is a native diagram kind. It separates parties, order flow, product, delivery, budget, approval, payment, order and scenarios into notation blocks, and uses the same parsing, printing and rendering entries as the other kinds. To put a figure with a source view and controls in an article, use `mountFramedDiagram` from `@cardenelabs/dragon/frame`. The top row holds the title, the source, open in dragon, export and zoom, and the bottom row holds controls such as playback and palette. A site with its own light player can place only the header with `createFigureHeader` from `@cardenelabs/dragon/header`, which loads neither the renderer nor the video encoder. The example `examples/checkout/acp-purchase.dragon` and four purchase examples (quantity, retry, shoes and standard) were added in Japanese and English.

## [0.73.0] - 2026-11-13

### Added

- **Diagrams can be drawn with hand-drawn pen lines (`--line pen`, `line: "pen"`)** (#3643)

  Every line was drawn with a ruler, so there was no way to give a diagram a hand-drawn look. Pick how lines are drawn when drawing, as with the palette: `dragon export --line pen`, `line: "pen"` for `renderDiagram`, `mountDiagram` and `captureHtml`, or the line picker next to the palette swatches in the editor. Box edges, lines, arrows, step number rings, commit marks, small labels, branch bands and group frames become one gently wobbling pen line each. Icons, text and the diagram frame stay as they are, the layout and text positions do not move, line ends, bends and sharp corners stay where they were, so arrow tips still touch their boxes, and the same diagram wobbles the same way every time it is drawn. The notation does not say how lines are drawn. `--line` takes `ruler` (default) or `pen` and refuses any other value with exit code 2 before writing anything. The HTML page draws the diagram again with the same line style, and the docs page has a section on how lines are drawn with a pen sample.

- **Charts and set overlap diagrams can count with dots (`[shape: dots]`), and donut and bar charts take `set none`** (#3635)

  A chart showed counts as shares or lengths and a set overlap diagram as numbers in regions, but there was no way to show how many people or things are there as that many marks. Start the first line with `chart <title> [shape: dots]` or `venn <title> [shape: dots]`, and the box of the whole holds empty dots from before the first step; in the step that sets an item or a set, that many dots move from the box to its cluster. A set overlap diagram makes a cluster for each set and each overlap, and a dot in two or more sets is painted in slices of their colors. The diagram picks how many each dot stands for (1, 2 or 5 times a power of 10) so that the dots come to about 100 and shows it at the top of the box, and `[shape: dots, unit: <count>]` chooses it. A step with more than 200 dots is refused when the notation is read, and `unit` without `[shape: dots]` is refused both when the notation is read and when a JSON source is checked. Donuts, bars and dots take `set none: <count>` for the count in none of the items: a donut or a bar draws it as a grey arc or bar after the items, and dots leave those dots grey in the box. A funnel still refuses `set none` as it refuses an item that is not declared. At phone width the box of the whole sits on top with the clusters below it. The catalog has two examples in Japanese and English: the devices 1,000 people use most, and checked wallet addresses split by NFT, DeFi and DAO. The editor shelf has both head lines.

- **A lineup diagram can cap a lane with `[limit: <n>]` and lay its lanes out as stops on one line with `[shape: stations]`** (#3624)

  There was no way to say how many cards a lane may hold, so the count had to be rewritten by hand with a `note <lane>: 2/3` line in every step. Write `[limit: <n>]` on a box, and the count reads `2/3` by itself: the board draws `n` ticks under the lane head and fills one for each card, and a `line` that puts more chips than the limit in the lane is refused with the limit named. Write `lineup <title> [shape: stations]` to put the lanes on one line as stops, with the cards stacked under each stop, the stretches a card passed forward colored in that step, a send-back running under the line, and dashed slots for the free seats of a stop with a limit. The stations look refuses `seal`, `open`, `pick` and `stamp`, because it does not draw them. `line <lane>:` with nothing after the `:` empties a lane. Two samples, `release-flow` and `contract-audit`, show the stations look, and the editor's shelf lists the stations head line.

- **The browser entry (`@cardenelabs/dragon/capture`) also makes the single-file HTML page with `captureHtml`, and the editor's export menu has HTML** (#3667)

  The browser entry could make PNG, SVG, GIF and MP4, but the HTML page that `dragon export --format html` writes could only be made in Node. `captureHtml(source, { lang?, palette?, theme?, blocks? })` takes the notation and returns the HTML text. The page is built by the code `dragon export` uses, now shared between the two (`export/page.ts` and `export/html.ts`), so the same notation gives the same page except for the `@font-face` rules. The fonts are the whole font files from the page's `@font-face` rules whose range covers the characters the page and the player bar can draw, because the browser has no tool to cut fonts down; a font file that cannot be read is refused with its family and range named. The player script (`player.global.js`) is not bundled into the entry: it is fetched from next to the entry on the first call only, and loading the entry does not fetch it. The entry now carries the renderer to build the page, so it grows from about 37 KB to about 3 MB; it is still loaded only when the export button is pressed. The playground editor's export menu lists HTML after MP4 and saves `<name>.html`, drawn with the editor's palette and language.

### Changed

- **A lineup diagram is drawn as a board of pale vertical columns, and a card that moves back to an earlier lane is shown as a send-back** (#3624)

  Lanes were rows of small chips with the count in a corner, so it was hard to see which lane a card sat in and when work went back. Each box is now a pale vertical column from left to right, with a colored dot, the name and the card count in its head, and the chips are cards stacked from the top with their number and name. `note <lane>: <text>` shows a value chip under the name instead of the text in the corner, and a pool with `[order: none]` shows a "No order" pill. When a card moves back to a lane declared earlier, the step draws a return line with a "Sent back" label, a back mark on the card and a dashed trace in the lane it left. A colored card that appears in a step gets an "Added" tag, and a card that leaves every lane leaves a "Gone" trace. On a phone-width frame the columns stack from the top with two cards to a row. The kanban sample now uses `[limit: 3]` and ends with a send-back step.

## [0.72.0] - 2026-11-12

### Added

- **A chart can draw a funnel with `[shape: funnel]`, where the count shrinks stage by stage** (#3621)

  A bar chart could list the counts of stages, such as visitors on the way to a purchase, but could not show how many left between one stage and the next. Start the first line with `chart <title> [shape: funnel]`, declare the stages from the top with the same `item` lines and write each count with `set` inside a step; no new word is added. A stage's bar appears in the step that sets it, left-aligned and as long as its value compared with the first stage. The gap to the stage above stays as a pale bar with the number who left, and the rate kept from the stage above shows beside the count. The last step adds a row with the share of the first stage that made it to the last one. A value larger than the stage above is refused in Japanese and English both when the notation is read and when a JSON source is checked, and a stage that never gets a value is refused when the notation is read. The catalog has two examples in Japanese and English: visitors of an online shop on the way to buying, and new wallet users on the way to their first send. The editor shelf has the funnel head line.

- **A Sankey diagram (`sankey`) follows where one amount goes and how much** (#3626)

  There was no diagram kind for how one amount splits into its destinations, such as a token allocation or where a salary goes, and the shares had to be shown as a donut that cannot show where each part goes next. Start the first line with `sankey <title>` and declare the sources and targets with `box` lines. A `<source> -> <target>: <amount>` line inside a step grows a band from the source bar to the target bar in that step, and an amount chip crosses it. The number at the start of the label is the amount (`40%` reads as 40, `1,200 yen` as 1200), and the band takes the share of the source bar that its amount makes up. Boxes no line goes into sit in the left column and each target sits in a column to the right of its source. A target's bar fills in as each band reaches it, and its name and amount appear when the first band arrives. A label that does not start with a number, a line whose flow leads back to a box it came from and a box sending out more than comes in are refused in Japanese and English. In other diagram kinds `sankey` still reads as an ordinary box id. The catalog has four examples in Japanese and English: a token allocation, a fee split, where a salary goes and where a year of sales goes. The light entry loads the Sankey renderer and the band reading only when a Sankey diagram is read, so the first-load size stays within its budget.

- **A lineup diagram can stack its boxes as layers with `[shape: layers]`** (#3625)

  There was no way to draw one request or transaction going down through layers, such as app, wallet, L2 and L1, or browser, CDN, API and database, and lanes laid side by side hid that the boxes are stacked. Write `lineup <title> [shape: layers]`, and the boxes become horizontal bands from top to bottom in the order written, with the layer's name, its `note` and its number on the left of each band. No new words are added: `line <layer>: <chip>` in a step is the layer the chip is in, drawing that band strongest and the bands it has passed lighter, and `note <layer>: <text>` stamps the mark of that layer until the next `note` on it. A chip's `note` shows as a second line on its card. On a narrow frame the mark and the card move under the name and description of each layer. A layers lineup takes up to 8 layers and draws no arrows between them, and it refuses `[order: none]`, `role`, `seal`, `open`, `pick` and `stamp` in Japanese and English, because the layers look does not draw them. A lineup without `[shape: layers]` reads and draws as before. The catalog has two examples in Japanese and English: an L2 transaction until it is final and a web request from the page to the store. The layers layout, its reading and its error messages load only with the lineup diagram.

- **A browser entry (`@cardenelabs/dragon/capture`) turns a diagram drawn on the page into PNG, SVG, GIF and MP4, and `editorUrl` makes a link that opens the notation in the editor** (#3644)

  A page that draws a diagram, such as a blog that shows an "open in dragon" link and an export button next to each figure, had no way to export or link the diagram with only the package. `editorUrl(source, { base? })`, from the main and the light entry, returns `<base>editor#n=<base64url of the notation>`, and the default base is the published editor. The playground share link is made by the same function. The new entry `@cardenelabs/dragon/capture` takes the `<svg>` element drawn on the page. `captureGif`, `captureMp4` and `captureFilm` record one cycle of the motion and return GIF and MP4 Blobs, `capturePng` returns a PNG Blob of the current moment at twice the size, and `captureSvg` returns the SVG text with its fonts embedded. `canCaptureMp4()` tells whether the browser can make MP4. Frame planning and frame packing are shared with `exportDiagram`, so the same diagram gets the same frame count and size. Only the woff2 files that cover the drawn text are embedded as `data:` URLs, and a font file that cannot be read is refused with its family and range named. The main and the light entry do not load the encoders (`gifenc` and `mediabunny`); only the capture entry does. The playground editor has an "Export" button at the right end of the tool bar that opens a small menu of PNG, SVG, GIF and MP4 and loads the capture entry only when pressed.

- **A two-axis matrix (`matrix`) sorts items into four areas by two measures** (#3622)

  There was no diagram kind for sorting items by two measures, such as tasks by urgency and importance or risks by likelihood and impact, and the four areas had to be faked with boxes in an architecture diagram. Start the first line with `matrix <title>`, write `axis <name> [from: <low end>, to: <high end>]` for the horizontal and then the vertical axis, exactly four areas as `box <id> as <name>` (top left, top right, bottom left and bottom right in the order written) and the items as `item <id> as <name>`, all before the first step. The horizontal arrow runs below the areas and the vertical arrow left of them, each with its name and both ends, and the items wait in a "Not placed yet" list left of the areas in the order written. `line <area>: <item>, <item>` in a step slides the cards from the list into that area and lights the area up in that step; a placed card stays until a later step places it elsewhere. A matrix without exactly two axes or four areas, and a `line` that names an unknown area or item or the same item twice, are refused in Japanese and English. The catalog has four examples in Japanese and English: this week's tasks by urgency and importance, the risks before opening a shop, token listings by volume and trust, and choosing a chain by fees and speed. The light entry loads the matrix renderer and its reading only when a two-axis matrix is read, so the first-load size stays within its budget.

- **A set overlap diagram (`venn`) draws how two or three groups overlap** (#3620)

  There was no diagram kind for how many fall in each overlap of a few groups, such as how a wallet is used or what hobbies people have, and circles had to be faked with boxes. Start the first line with `venn <title>` and declare 2 or 3 sets with `item <id> as <name>` lines. In a step, `set <id>: <count>` writes the total of a set and makes its circle appear in that step, with the name and the total outside the circle. `set <id> & <id>: <count>` writes the count in an overlap and lights its region with a count chip in that step, and each region shows the count that is only in it, worked out from the totals and the overlaps. `set none: <count>` shows the count in none of the sets in a frame around the circles. A diagram with fewer than 2 or more than 3 sets, and an overlap larger than one of its sets, are refused in Japanese and English. In other diagram kinds `venn` and `none` still read as ordinary box ids. The catalog has four examples in Japanese and English: how a wallet is used, how L2 chains are used, overlapping hobbies and what developers are good at. The light entry loads the renderer and the set reading only when a set overlap diagram is read.

- **A mind map (`mind`) spreads ideas out from one topic in the middle** (#3619)

  There was no diagram kind for writing ideas out from one topic, such as the features of an app or the parts of a plan, and they had to be squeezed into a tree or an architecture diagram. Start the first line with `mind <title>` and write `idea <id> as <name> of <parent>` lines inside steps. The idea without `of` is the topic in the middle, an idea of the topic is a branch and an idea of a branch is a leaf. Branches go round clockwise from the upper left in the order written, and the leaves of a branch sit in a column outside it. Ideas start faint and turn solid at the step that writes them, and the curved line from the parent is drawn from the parent's side. `[color: <color>]` on a branch passes its color to its lines and leaves, and a branch without a color gets one no other branch has taken. A parent that has not been written yet, a second topic, no topic at all and a fourth level are refused in Japanese and English. The catalog has four examples in Japanese and English: the features of a budget app, a summer trip plan, a DAO grant proposal for developers and what makes a wallet easy to use. The light entry loads the mind map renderer only when a mind map is read, so the first-load size stays within its budget.

- **A table relation diagram (`er`) draws how one value goes through rows of linked tables** (#3618)

  There was no diagram kind for a mechanism that looks up rows of another table by a key value and gathers values, such as an order total or an NFT sale, and tables had to be faked with boxes and lines. Start the first line with `er <title>`, declare 1 to 6 tables with `table <id> as <name>` lines and their fields with `field <name>: <value>` lines under them; the tables sit left to right in one row in the order written. `[key]` on a field is the key mark (PK), and `[ref: <table>.<field>]` links it to a field of another table (FK), drawn as a line from the linking field to the field it points at with a three-pronged end on the many side and a bar on the one side. A link between tables that are not next to each other runs under the tables. In a step, `pick <table>.<field>` lights the row and its table frame, `<table>.<field> -> <table>.<field> [tag: <value>]` runs a value chip along the link to its middle, `set <table>.<field>: <value>` rewrites a value, and `note <table>.<field>: <text>` shows a formula card under the table that stays in later steps. A line between fields that are not linked, a link to a missing table or field, and a table count outside 1 to 6 are refused in Japanese and English. The catalog has four examples in Japanese and English: an order total, a library loan, an NFT sale and a token transfer. The light entry loads the renderer and the table reading only when a table relation diagram is read.

- **A git graph can delete a branch with `delete <branch>`** (#3632)

  A step in a git graph takes `delete <branch>`. From that step on, the branch ref is no longer drawn while its band stays, and a commit that no branch can reach any more turns into a dotted circle. Reading the notation stops with an error for a branch that was never declared, for the branch `HEAD` points at, and for a commit added to a deleted branch. In other diagram kinds `delete` still reads as an ordinary box id. The `squash` example now deletes `feature` with `delete feature` after moving `HEAD` back to main, instead of writing `feature: deleted` in the strip. The usage page, the catalog parts and the package README describe the new line.

- **`dragon check --layout` reports a stamp over text in a lineup diagram, and a span frame or the needle crossing text in a time diagram** (#3631)

  While adding examples in #3615, three overlaps showed up in the exported PNGs that `dragon check --layout` did not report. In a lineup diagram, the stamp pressed on a card covered the remark written under the card in the same step. In a time diagram, the dotted edge of a span frame (`span ... [shape: box]`) and the needle where a step ends crossed the period text of a task bar. The check now reports a stamp that covers text as `chip-over-part`, and a span frame edge or the needle that crosses text without a tag as `line-crosses-text`, the same kinds it already used for a tag over a part and a line across text. The report names the step, the stamp, span frame or needle, and the text, for example `The stamp "Paid" covers "Alice is 3rd"`, `The span frame "Overlap" crosses "Day 1–12"` and `The needle crosses "Day 1–12"`. The needle is checked where it stops at the end of each step. The current examples and the catalog figures report no new break.

- **A cycle diagram (`cycle`) draws a flow that goes around the same steps again and again** (#3623)

  There was no diagram kind for a flow that returns to its first step and starts the next round, such as an Ethereum slot or a sprint, and it had to be drawn as a straight line of steps. Start the first line with `cycle <title>` and declare 2 to 8 steps with `box` lines; they sit on a ring clockwise from the top in the order written, and arc arrows join each step to the next. A `<id> -> <id> [tag: <text>]` line inside a step runs its chip along the arc to the next step, and the arc it ran stays lit in the color of the receiving step. A line from the last step to the first one starts the next round, and a line that skips a step, goes backward, returns to the same step or carries a label is refused in Japanese and English. The step number sits beside the box the chip reached. `strip <title>: <field>, <field>` goes in the middle of the ring instead of under the diagram, with the first field large and a changed value shown in that step's color. The catalog has four examples in Japanese and English: an Ethereum slot, a two-week sprint, PDCA for a shop floor and restaking rewards. The light entry loads the cycle renderer only when a cycle diagram is read, so the first-load size stays within its budget.

- **Every diagram kind in the catalog has at least four examples** (#3615)

  The catalog had 27 examples, and the state, tree, lineup and try kinds had only one, while architecture, git, chart and flow had two. 21 examples were added in Japanese and English, so each of the 11 kinds now has four or more. Kinds whose examples leaned toward Web3 got general topics, and kinds that leaned toward general topics got Web3 ones: state (transaction status, a subscription, a support ticket), tree (a tournament, a site map, HD wallet key derivation), lineup (a clinic queue, a kanban board, a rollup batch), try (checkout lanes, stock reservation, a multisig approval), architecture (an online shop, video delivery), chart (gas fees by hour, staking rewards), flow (approving before a deposit, deciding on a return), git (a hotfix brought back to main, a squash merge) and time (getting a new shop ready to open). Every added example draws with no layout break in both languages. The site font now holds the characters the new examples use.

- **In the playground editor you can drag the borders between the shelf, the notation and the diagram to change their widths** (#3612)

  The editor placed the shelf at 240px, the notation at 300px and the diagram in the rest, and had no way to change these widths. The vertical bar you could see on the notation pane was its scroll bar. A handle now sits on the border between the shelf and the notation and on the border between the notation and the diagram. Each handle is the border line with a small upright grip always shown in its middle, and it turns the accent colour while you point at it, drag it or move to it with the keyboard. Dragging a handle changes the width of the pane on its left, and the editor keeps the widths the next time you open it. On a handle, the left and right arrow keys move it by 16px, or 64px with Shift. The diagram never gets narrower than 320px, the notation than 240px, or the shelf than 180px. At 1100px wide and below, where the shelf folds into a drawer, only the handle between the notation and the diagram is shown, and at 760px and below, where the diagram and the notation are stacked, no handle is shown.

- **Each part page in the catalog has a "Ways to write it" section** (#3616)

  A part page showed one figure of the part per diagram kind and did not show what its settings (attribute keys) change. A part that takes settings now has a "Ways to write it" section above the per-kind figures, with one row per setting. Each row shows the notation lines that write the setting on the left and, on the right, the part's figure stopped at the step where the setting is first written. The list of settings comes from the words the part covers, and across all parts it matches the notation reader's list of attributes. The lines and figures come from the parts' existing notation files, so no notation files were added.

- **The playground editor colours the notation and the JSON by the role of each word** (#3613)

  Every character in the editor was the same colour, so the diagram kind, the `->` of a line and the settings all looked alike. A colour layer now sits under the text area. In the notation it draws eight roles in different colours: the diagram kind, the word that starts a line, `as`, the `->` of a line, a setting's key, a setting's value, comments, and the command after `code`. In the JSON it colours keys, strings, numbers, and `true`, `false` and `null`. The colours come from the light and dark values of the site's five palettes, and a colour is moved toward the text colour only when its contrast with the editor background is below 4.5. The words that start a line and the diagram kinds come from `NOTATION_WORDS`, a new export of the package, so adding a block adds its colour too. The colour layer holds exactly the text in the editor and stays aligned while you type and scroll. While you compose Japanese text with an input method, the text being composed is shown by the text area itself.

### Changed

- **The drawing core looks up each diagram kind that loads later by its name, so adding a kind no longer makes the script that the one-line entry loads first bigger** (#3656)

  The drawing core picked the layout, the label timing and the drawing of each diagram kind that loads later with one branch per kind, so every new kind added a branch to the script that `dist/cdn/dragon.js` loads first. Each of those kinds now hands one set of parts to the kind registry (`parts` in `kinds/<kind>.ts`, shaped by `KindParts` in `kinds/parts.ts`), holding its layout, its label timing, its drawing and what the follow view looks at in each step. The core looks the set up by the kind name and calls it, and names none of these kinds. The cycle diagram and the table relation diagram now share one function that shows a label from the moment its line starts until its step ends. Every diagram draws exactly as before. On a page that draws only a sequence diagram, the script loaded first went from 88,355 to 87,162 bytes gzipped.

- **The one-line script entry reads less on a page that draws only a sequence diagram** (#3657)

  The cycle, table relation, mind map, set overlap and two-axis matrix kinds each split a part of the main script into another file that every page read first, because their later-loaded code read it too: the count limits of their blocks, how a strip draws its values and how a color is read. Each file is compressed on its own, so the first load had grown to 90,202 bytes in 44 files, over its 90,000-byte limit. The later-loaded code now reads its count limits from a file of its own, the cycle diagram is handed the strip values by the drawing code, and an idea checks its color against the color list like the other later-loaded blocks. The first load is back under the limit, and the diagrams draw the same as before.

- **The catalog no longer loads the English text, the English versions of the first three examples or the editor's shelf templates on its first screen** (#3646)

  The script the catalog loads first carried the page text in both Japanese and English, both language versions of the three examples on the first screen (`intro`, `oauth`, `ccip`), and the templates the editor's shelf builds its part and notation lines from, even on pages that show none of them. The English text and the English versions of the three examples now live in `english.ts`, a chunk of their own that the page loads when it opens in English or switches to English. A page that opens in English draws nothing until that chunk arrives, so Japanese text never flashes on it, and switching to English keeps the current language on screen until the chunk arrives. If the English chunk cannot be loaded, the page opens in Japanese. The shelf templates now live in `editor/shelf-items.ts`, a chunk the shelf loads when the editor opens; the parts and notation tabs show the loading message until it arrives, then list the same lines in the same order as before. The Japanese text and the Japanese examples stay in the first script. The script and CSS loaded first went from 188,348 to 181,313 bytes gzipped, under the unchanged 188,416-byte limit.

- **The catalog opens with the diagram kinds, each with a picture** (#3614)

  The catalog page listed the text-only part cards first, and the 11 diagram kind cards came below them (about 2,470px from the top at 1440px wide). The kind cards had only a title and a description, with no picture of the diagram. The kinds section now sits right under the page head, and each card shows the first example of its kind stopped at the last step. At 1440px wide the first card starts 445px from the top. Diagram kinds differ in shape, so the picture measures the drawn diagram and shrinks it until the whole diagram fits the card; a tall diagram (try and flow) that would become a thin strip is widened to 70% of the card and shown from the top. The parts and kind-only parts sections follow the kinds section. Clicking a card still opens that kind's page.

## [0.71.0] - 2026-11-11

### Added

- **`dragon export` draws a diagram with the block definitions you pass with `--blocks`** (#3606)

  An example that uses an added block without defining it at its head could be checked with `dragon check --blocks` but could not be exported. `dragon export <diagram> --blocks <file>` now draws the diagram with the definitions in the file, and the HTML page carries them in the source's `define`, so the page draws the same blocks. A missing file or a file that is not a block definitions file is refused with the same message as `dragon check --blocks`. The skill's guide to offering a block now exports the example this way so you can look at it before opening the pull request.

- **`dragon check --layout` reports a line hidden behind a box** (#3607)

  A line that ran across a box without crossing its name was not reported. It is now reported as `line-behind-box`.

### Fixed

- **A line to a box in another row no longer runs over the boxes in between** (#3607)

  In an architecture diagram, when all three routes to a box in another row and column hit a box in between, the line ran straight down over it. The line now runs outside the outermost column on the side of the box it enters and comes in from the side of that box. When that outer route is blocked too, it goes down between the columns.

- **Layout breaks in 16 diagrams of the catalog** (#3607)

  In a pipe diagram, two boxes now stay far enough apart for a returned value's chip to fit on the pipe, and a pipe from a round tag leaves the middle of the tag. A pair of back-and-forth lines moves the line with `[side: ...]` to that side, so its name is not drawn between the two lines. In a tree diagram, back-and-forth lines no longer lie on top of each other, and their step numbers stay clear of the carried items. In a state diagram, the names a line gets in different steps line up in step order beside the line. All 282 diagrams of the catalog now pass `dragon check --layout`.

- **An added line block keeps its dashes in the MP4 and GIF of a follow view** (#3606)

  A diagram shown in the follow view is drawn again at the window width for the video, and that drawing did not see the added blocks, so a dashed line block came out as a plain line. This also happened when the definitions were at the head of the diagram.

### Changed

- **A narrow pipe diagram with an opened box is laid out faster** (#3603)

  When the pipes are laid out at a narrow width, the layout stops trying more orders of drawing the pipes once an order does not do better than the best one so far. The pipes and their places are the same in all 28 pipe examples.

## [0.70.0] - 2026-11-10

### Added

- **A pipe diagram can be drawn in the caller's own words** (#3584)

  The words under the tank amounts (Pending, Final, Undone), the labels on the sender's and receiver's tanks (In, Out), and the text of a folded box were fixed for each language. Pass `words.pipe` to `renderDiagram` or `mountDiagram` to replace any of them; `{steps}`, `{parties}`, and `{name}` in the folded box text and title become the numbers and the party name. Words you leave out keep the words of `lang`, and a diagram drawn without `words` is the same as before.

## [0.69.0] - 2026-11-09

### Added

- **Both answers of a choice in a flow diagram can run at once** (#3579)

  Writing both answers of a choice in the same step started the two lines half a second apart, pushed the box after the main path down, and made `dragon check --layout` report the lines. The two lines now start at the same moment with a dot on each. The line written first goes straight down and the line written after it branches to the side, so the boxes sit where they do in a diagram with a path not taken. A box reached this way keeps a solid border and full-color text. Diagrams that write a path not taken before the first step keep following one path. The new example is `login-all-paths` in `packages/dragon/examples/`.

### Fixed

- **A box in a state diagram no longer glows before the line reaches it** (#3575)

  When a line arrives at a state and the line leaving it is written in the same step, the leaving line starts first, so the glow ended before it began and the box slowly lit up from the start of the diagram. The box now glows from the moment the line arrives until the end of that step, and the done mark appears shortly after the glow fades. Flow diagrams use the same rule from one place. The timing of lines does not change.

## [0.68.1] - 2026-11-09

### Changed

- **The axis of a diagram with tasks now counts the same numbers as the bars** (#3574)

  A bar read `Day 1–3` while the axis under it started at `0 days`, so one day had two numbers. In a time diagram with `task` lines, the axis labels now use the tick names of the bars (`Day 1`, `Day 5`, `Day 10`, `Day 14`) and sit in the middle of their ticks. Time diagrams without `task` lines keep their axis.

## [0.68.0] - 2026-11-09

### Added

- **The player plays at a chosen speed, with `speed` when placing it and `setSpeed` afterwards** (#3568)

  The player could only play a diagram at the pace of its timeline, so a page that wanted 2x playback stepped through the diagram itself with `goTo`, which stops on each step's still and never shows the motion between steps. `mountDiagram` now takes `speed`, a multiplier such as `2` or `0.5`, and the returned `player` has `setSpeed`. The steps, the motion, the step label and `onStep` all follow the speed, a diagram set to play once stops on its last still in the scaled time, and changing the speed while playing continues from where the diagram is instead of starting over. A paused diagram stays paused and plays at the new speed when played. Both take a finite number greater than 0 and throw a `RangeError` for anything else, and a rejected `setSpeed` keeps the current speed. Diagrams placed without `speed` play as before.

- **Added the chart (`chart`), which compares the shares of items as a donut and their amounts as horizontal bars, step by step** (#3560)

  Start the first line with `chart <title> [shape: donut]` or `chart <title> [shape: bar]`, and declare the items with `item <id> as <name> [color: <color>]` before the first step, from 1 to 8 of them.
  Inside a step, `set <id>: <value>` writes the value of an item, a number of 0 or more without a unit, and an item without `set` keeps its previous value.
  A donut draws each share as the angle of an arc clockwise from 12 o'clock, with the step name in the middle of the ring and rounded percentages in the legend. A bar chart gives the largest value over all steps the longest bar and shows each value at the end of its bar.
  Going to the next step moves the arcs and bars from the previous values to the new ones. In a narrow frame, the donut's legend moves below the ring and the bars get shorter.
  `dragon check --layout` reports a step name that does not fit inside the ring of a donut as `title-outside-ring`.
  The words `item` and `set` keep their lineup, try and strip readings in the other kinds. The examples are `os-share` (donut) and `tickets` (bar) in `packages/dragon/examples/`.

- **A time diagram draws a task's period as one thick bar with `task <id> as <name> <range> [color: <color>]`** (#3562)

  A time diagram could only show marks, one per tick, so a schedule where each piece of work runs over several days had to be drawn as a row of separate marks. A `task` line before the first step now declares a task with its own row. The task is drawn as one continuous thick bar over the ticks of its range, with its name to the left of the row and its first and last tick names with the scale name inside the bar, such as `Day 1–3` (`1〜3日` in Japanese, and `Day 14` for a task of one tick). The text goes outside to the right when the bar is too narrow, or to the left when the right side would run past the end of the axis. The part of the bar the needle has passed fills in with the task's color as the needle moves. Text inside the bar is drawn light over the filled part and dark over the rest, and the split moves with the edge of the fill. The range counts ticks from 0, the same as `mark` and `span`, as `0-2` or `13`. A time diagram with tasks draws without any `row`, and tasks and rows keep the order they were declared in from top to bottom. In the source JSON, tasks go in `blocks.task`. Time diagrams without `task` draw the same as before. The new example `release-plan` draws a schedule up to a release.

- **A flow diagram (`flow`) follows a procedure that branches at choices** (#3561)

  Drawing a procedure as a state diagram crossed lines and put names on top of each other, and `dragon check --layout` found 10 breaks in a small login check. A diagram that starts with `flow <title>` now writes the steps of a procedure with `box` and each choice with the new `choice <id> as <question>` line. The boxes and choices that the steps pass through stack top to bottom in one column in the order the lines first reach them, a choice is drawn as a diamond with the question inside (a long question wraps onto two lines after a particle or a space), and a path that a choice sends elsewhere leaves to the right of the choice. Each line out of a choice carries the answer as its label, and a choice has at most two ways out. As in a state diagram, `start` and `finish` join the start and end marks, lines written before the first step stay as dotted paths not taken this time, and a box that no line in a step reaches gets a dotted border and a muted name. The line that moves in a step turns blue and a dot runs along it until it arrives, a passed line stays dark, and a choice the dot reached is filled with light amber. A line without `carry` or `tag` runs this dot instead of an envelope, and a line with `carry: coin` or `tag` appears with its thing when the line starts instead of waiting on the box. A line that goes back up the main path stops reading at that line. The source JSON keeps the choices in `blocks.choice` and the paths not taken in `blocks.path`, and `choice` is read as a plain name in every other kind. The example `login-check` (in Japanese and English) is in `packages/dragon/examples`, and the catalog, the editor shelf and the docs page show the new kind. The light entry loads the flow renderer only when you await `loadFor` for a flow diagram.

### Changed

- **The catalog no longer loads the text of the catalog pages and the notes of the shelf's notation tab on its first screen** (#3565)

  The script the catalog loads first carried, in both languages, the text that only the catalog pages show, such as the description of each diagram kind and the words of the example list, the search box and the enlarge button, and the note beside each line shape in the notation tab of the editor's shelf. They sat in the page text table that the first screen reads. The catalog pages' text now lives in `catalog/text.ts`, which goes into the chunk the catalog pages load later, and the notes live in `editor/syntax-text.ts`, a chunk of its own that the shelf loads when the editor opens. The catalog pages and the shelf show the same text as before. The script and CSS loaded first went from 185,436 to 180,470 bytes gzipped, leaving room under the 186,368-byte limit for the next diagram kinds.

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

- **The plugin's eval record counts the diagrams the agent drew and the layout breaks left in them** (#3546)

  `plugins/dragon/evals/record.json` only kept how many runs of each case passed, so a run could pass while the diagram the agent handed over still had a layout break. Each case now also keeps, as version 2 of the record, how many diagrams the agent saved, how many of them still have a `dragon check --layout` break, and how many could not be checked. The test reads an older record as stale and asks for the eval to be run again. A diagram that uses a block the agent added is checked with that block's definitions, and trial copies the agent left in the temporary directory are shown on the gallery page but not counted. The judge also reads the Japanese ordinal forms of a step number (the third step, not only step 3) as naming that step, and the fake `gh` used by the eval refuses a `--body-file` that does not exist, as the real `gh` does. The skill description now names defining blocks and adding one to dragon's shared block collection with a pull request, because one run of the `block-pr` case in three went on without the skill and used a title the skill does not use.

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

- **A shaped box grows until its name, the text under it and its slot fit inside the shape, and its step number sits on the edge of the shape** (#3520)

  A box drawn from a block with `shape diamond`, `hexagon`, `circle`, `cylinder` or `path` kept the size of a plain box and placed its contents as in a plain box. Its name, its `note:` text and its coin or envelope slot stuck out of the shape, and a step number on the box's corner floated away from the shape. dragon now measures the room inside the shape row by row and makes the box wider and taller, up to three times its size, until every row fits, moving the rows inside the shape when needed (below the lid of a cylinder). A row of boxes takes the height of its tallest box, and the heads of a sequence diagram line up at their bottom edge. A step number on a shaped box sits on the point of the shape nearest the box's top-left corner. A `path` shape is stretched so that the smallest rectangle around it fills the box, instead of a drawing in a 100 by 100 square, so the empty part of that square no longer keeps the shape away from the box edges. In the payment, bridge and pie diagrams the issue names, `dragon check --layout` no longer reports text, slot or step number breaks on the shaped boxes. A box whose contents already fit keeps its size, and diagrams without shaped boxes draw as before. Drawing and measuring shapes now loads with the block definitions, so the script and CSS the catalog loads first did not grow (179,343 bytes gzipped).

- **In pipe diagrams, the tag of a returned value no longer hides the caller's valve and gauge, call pipes leave boxes away from the rounded corners, and `dragon check --layout` warns about such overlaps** (#3523)

  The tag of a value a call returns travels back along the call pipe, and it stopped right in front of the caller's box, where the caller's valve and the gauge on the call sit. It covered them in 11 of the 13 pipe diagrams checked: at step 14 of the `swap` example, "0.05 WETH" hid Alice's valve and half of SwapRouter's gauge. The tag now stops at the first spot on the call pipe, counted from the caller, that is clear of every valve, gauge, box and tag of that step, and only touches the edge of a part when no clear spot exists. Every Contract box is now 80px tall instead of 56px, so the three heights a box sends call pipes from (the middle, 22px above and 22px below) all leave the straight part of its edge. On a 56px box the upper and lower pipes ran into the rounded corner and looked like they passed behind the box. A valve is first placed where its body stays 10px from other pipes, and moves to 3px only when no such spot exists, so the two valves of `swap-retry` at step 11 no longer touch the next pipe. Calls from one box look for their way nearest callee first, so the call that turns first takes the height on its side, and two calls no longer run back over one pipe as in `swap-two-hops` at step 13. Call pipes no longer run along the top or left edge of the diagram, where half of the pipe was cut off. `dragon check --layout` reports four new kinds for pipe diagrams, `chip-over-part`, `pipe-behind-box`, `pipes-merged` and `valve-near-pipe`, and names the step and the tag, pipe or valve. None of the examples has one. The fingerprints of every pipe example and of the pipe parts in the catalog changed with the drawing.

- **A line that goes under or over boxes keeps a margin from the boxes and the group border, and `dragon check --layout` reports lines squeezed along a border and text touching its frame** (#3526)

  In an architecture diagram, a line that went under the boxes of its row to reach a box in the same row ran 9px below the boxes and 9px above the group's bottom border, and its step number sat on the border of the box it left (step 13 of the `ccip` example). The line now runs `LOOK.margin` (14px) away from the boxes, and the group grows until its border is as far from the line. A value plate of a pipe diagram measured its name without the letter spacing it is drawn with, so `deposits[alice]` in the `vault-proxy` example touched the plate's border. The plate is now as wide as the drawn name, and the name sits in its middle. The tag of a `[shape: box]` span sat on the frame's top border with its lower half over the marks (`finality`, `withdraw`). The frame's top border now sits half a tag higher and the band grows by the same amount, so the tag stays 6px above the marks. `dragon check --layout` reports two new kinds: `line-near-border` when a straight run of a line goes along the border of a box other than its own end boxes, or of a group, closer than 14px, and `text-touches-border` when a text comes within 2px of the border of the plain box or value plate it sits in. The `ccip` example gets 10px taller, so on screens 760px tall or less the catalog's enlarged overlay keeps 16px instead of 24px above and below the card, and still shows the whole figure at 1280 × 720. The fingerprints of the `ccip`, `vault-proxy`, `finality`, `withdraw` and `swap-retry` examples (both languages, notation and JSON), 8 part diagrams and 2 test diagrams changed with the drawings.

- **A step number no longer takes the exact spot of an earlier step number or sits on the border of a group, a lane or the strip** (#3525)

  When a step had no line and changed the same box, point or strip as the step before it, or nothing happened in it, dragon put its number on the spot of the earlier number and swapped the digits when the step began. The earlier step could no longer be read in the later one, and a diagram with two notes on one point or two acts on one box showed only one number. The later number now sits next to the earlier one, to the right, below, to the left or above, on a spot clear of the other numbers, the icons and text in boxes, the labels and the borders. The number of a step that changes only the strip sits inside the rounded top-left corner of the strip instead of on its border, and a number moved next to an earlier one stays inside the diagram and off the side borders. A number on a line that crosses the border of a group, a lane or the strip moves along the line off the border, and back toward the start of the line when the rest of the line runs over the border and that spot is clear of other lines. When no spot is clear, the number keeps clear of the other numbers rather than of the border. A line taken again in a later step still swaps its number on one spot, and so does the step counter at the top right of a lineup. `dragon check --layout` reports a number on such a border as the new kind `badge-on-frame`, and reports `badges-close` when a later number takes the exact spot of an earlier one and hides it. The fingerprints of 85 example, part and fixture files changed with the layout.

- **In an architecture diagram, a box outside any group is drawn where it is written between groups, and a line that goes under a row keeps its margin from the tallest box of the row** (#3546)

  An architecture diagram put every box outside a group into one band below all the groups. A `+bridge` box written between the `Ethereum` and `Base` groups was drawn below `Base`, so the line from the token to the bridge ran down through `Base` and across the text of its boxes, and `dragon check --layout` reported it at three steps. Boxes outside a group now get a band of their own where they are written, so that bridge sits between the two groups and the lines to and from it run straight. Boxes outside a group written after the last group stay in the bottom band, as before, and the skill's architecture reference now says where such boxes are drawn. A line that goes under or over its row measured its margin from the box it leaves. A shaped box grows taller to fit its text (#3520) and makes its row taller, and a lower box sits in the middle of the row, so the line under a row of four boxes ran 10px below the bottom of an arch-shaped `+bridge` and `dragon check --layout` reported `line-near-border`. The line now keeps `LOOK.margin` (14px) from the top and bottom of the row's tallest box, the same value the check uses. None of the examples changed. Every diagram the AI saved in the earlier skill evals now passes `dragon check --layout` with no breaks.

- **Branch lines that leave the same commit take separate paths, and their step numbers no longer crowd each other** (#3547)

  In the `merge` example, the `fix` and `feature` branch lines both left the bottom of commit B at the same spot and ran on top of each other until `fix` turned, so step numbers 2, 3 and 4 piled up on that shared stretch and `dragon check --layout` reported them too close. Lines that leave the same commit toward different lanes now leave from spots set apart by the check's lower bound for side-by-side lines plus the width of a git line. The line to the farthest lane leaves on the left, so the lines that turn earlier do not cross it. When the spots do not fit within the commit's circle, as with three branches, the outer lines leave the circle at an angle and turn down at their spot. A branch line and the line to the first commit on that branch still share one path. Step numbers in a git diagram now keep the same distance from each other as the check asks for, which also clears the close numbers at steps 3 and 7 of `rebase`. The recorded breaks of the examples are now empty. `dragon check --layout` also reports two lines that leave the same spot of a box or commit, run on top of each other and then part, as `lines-close`, and names the step and both lines, as in `Step 2: The line B → fix (step 2) and the line B → feature (step 2) run too close side by side`. A line drawn without a step of its own is now named with the step it first shows in, instead of the step where both lines show. The fingerprints of the `merge` and `rebase` examples (both languages, notation and JSON) and of 8 git part diagrams changed with the drawing.

- **In an architecture diagram, lines that leave the same spot of one box toward different boxes take separate paths** (#3549)

  In a diagram an agent drew during the plugin eval, four boxes outside any group sat in one row, and the lines from the first box to the third and the fourth box both left the bottom of the first box at the same spot and ran on top of each other under the row, so `dragon check --layout` reported them too close at step 3. The two lines that leave the right side of the wallet in the test diagram `overlap-lines.dragon` overlapped the same way. Such lines now leave from spots set apart along the side of the box by the check's lower bound for side-by-side lines plus the width of a lit line, the same gap dragon keeps between a line and its reply. A line that runs farther from the box leaves on the outer side, so the lines that turn earlier do not cross it. Detours under or over a row and down the gap between two columns run on separate tracks the same distance apart, and the gap between the rows, the band or the gap between the columns grows to fit them. When the spots do not fit within the straight part of the side, the outer lines leave from the rounded corners, and the spots come closer only when they do not fit within the whole side. A line that has a reply takes two spots, so the line and its reply still stay apart. The test diagrams `crowd-side` and `shared-side`, where one box sends a line with a reply and another line from the same spot, now draw three separate lines, and the step 4 number of `crowd-side` no longer sits on the border of its group. Their fingerprints changed with the drawing. The test that `dragon check --layout` still names two overlapping lines from one spot now builds such a drawing in the test, and the skill's layout reference says that dragon draws these lines apart.

- **In an architecture diagram, lines from different boxes that detour along the same path take separate tracks, and `dragon check --layout` reports two lines that run on top of each other** (#3552)

  With four boxes A, B, C and D in one row, a line from A to C at step 3 and a line from B to D at step 4 both went under the row to get around the box between, at the same height, and ran on top of each other from below B to below C. The arrowhead of A to C sat on the line from B to D, and `dragon check --layout` reported nothing, because it counted two lines with no gap between them only when they joined the same two boxes in opposite directions. It now reports any two lines that go to different boxes and run on top of each other for longer than two step numbers as `lines-close`, and names the step and both lines. Two lines that go to the same box are still not reported: a line drawn again at a later step lies on its own path, and lines from different boxes that join before they enter one box (the branches of a tree meeting at their parent) still show where they go. Every detour under or over a row and down the gap between two columns now takes its own track when its stretch overlaps another line's on the same path, whichever box it leaves from, with the same gap as lines from one box (#3549). The tracks are ordered so that lines cross each other's detours as little as they can, and when a crossing cannot be avoided it falls near the box a line enters, not under the step number at the start of a line. A line that goes down from one row and a line that comes up from the next row through the same gap are kept apart too. The longer detours made a line that enters a box run on top of a line that leaves the same spot of that box, so such lines now enter and leave from spots set apart along the side, as lines that leave one spot do. A line and its reply that are set apart at both of their boxes now move at both ends. None of the examples changed, the recorded breaks of the examples stay empty, and the diagrams the AI saved in the earlier skill evals still pass `dragon check --layout` with no breaks. The fingerprints of the test diagram `arch-self-side`, whose two lines down the gap right of its first column now take separate tracks, changed with the drawing.

- **In an architecture diagram, a line name sits beside its own line and away from other lines, and `dragon check --layout` reports a line name that sits on another line or closer to another line than to its own** (#3552)

  A line name could sit on top of another line, or next to another line closer than to its own, and read as the name of that line, and `dragon check --layout` reported nothing. A line name is a chip whose background hides the line under it, so a line under a name was never counted, and a name was counted as away from its line only when it was farther than its first spacing plus its own height. In the diagrams the AI saved in the earlier skill evals, 6 of 102 had a name on another line, half of them the name of a short line straight down to the box below, with a line that goes around that box running through the name, and one more had a name closer to the detour under its row than to its own line. `dragon check --layout` now reports a line name that sits on another line as `label-on-line`, and names the step, the name and the line. A line name that sits closer to another line seen at the same step than to its own line is reported as `label-off-line`, as a name drawn away from its line. The line the name belongs to, and the same line drawn again at a later step, are not counted, and the amount chips of a `pipe` diagram, which sit between pipes, are not compared with other pipes. An architecture diagram now puts each line name beside its own line, first where every other line is at least twice as far from the name as its own line, then where no other line is closer than its own, and slides the name along the longest stretch of its line to find such a spot. Only when there is none does it take a spot that just keeps off other lines, and after that the spot it used before. When a line that goes around the boxes leaves no room, dragon makes room: beside a line straight down from one row to the next, it widens the gap between the columns until the line around is twice as far from the name as the name's own line, or the gap between the rows or the two groups until the name fits under a line that runs between them. Beside a straight line between two boxes of one row, it moves the detour under or over the row away from the row. A name between two detours that run side by side under one row still sits closer to the next detour, because their gap is narrower than a name, and is reported. None of the examples changed, the recorded breaks of the examples stay empty, and all 102 diagrams of the earlier skill evals now pass `dragon check --layout` with no breaks. The fingerprints of the test diagrams `arch-self-side`, `crowd-side` and `shared-side`, whose names moved away from other lines, changed with the drawing.

- **In an architecture diagram, a line name stays clear of group borders and inside the diagram, and `dragon check --layout` reports a line name that crosses the border of a group** (#3554)

  A line from a box in a group to a box outside it put its name across the bottom border of the group, so the border ran into the chip and through its text, and `dragon check --layout` reported nothing. A line pushed over its row by a loop under a box put its name above the top edge of the diagram, where an exported image cut it off. `dragon check --layout` reported that one as `part-outside-frame`, but the notation could not fix it. In the diagrams the AI saved in the earlier skill evals, 35 of 114 had a line name across a group border. `dragon check --layout` now reports a line name that crosses the border of a group, a lane or the strip as `label-on-frame`, and names the step, the name and the group. An architecture diagram now places the name of a line that leaves or enters a group, or runs between two groups, at least 6px clear of the group borders, trying the spots beside its own line in the same order as before (#3552). When no such spot is left, it widens the gap between the two groups until the name fits there. A name that would sit above the top edge moves the rows down by as much as it sticks out. The names of lines between two boxes of one group still sit inside the group as before. The example `ccip`, whose step 10 name crossed the borders of two groups, and the architecture part examples of `color`, `group`, `icon` and `note` are 26px taller, and their fingerprints changed with the drawing, as did those of the test diagrams `arch-self-side`, `crowd-side`, `pair-band` and `shared-side`. The recorded breaks of the examples stay empty, and all 114 diagrams of the earlier skill evals pass `dragon check --layout` with no breaks. On screens lower than 760px, the catalog's overlay now keeps 8px above and below it instead of 16px, so the taller `ccip` still shows whole at 1280 x 720. In the editor, the overview under the window of a follow-view diagram was sized by the frame width alone, so the taller `ccip` pushed the bottom 4px of its overview below the frame at 860 x 900. The overview now shrinks until it fits the visible height of the frame, down to half its size, while the window keeps its height and the value table below still scrolls. `mountDiagram` takes this as the new `fitOverview` setting, which, unlike `fitHeight`, keeps the window and the choice of view as they are.

- **In an architecture diagram, a line name between detours that run side by side under a row sits beside its own line** (#3556)

  With four boxes A, B, C and D in one row, E under A and F under C, the lines from A to C, B to D, C to A and A to F all detour under the row on tracks 21.3px apart. The name of the line from A to C at step 6 sat 12px below its line, the usual distance, which left it 10.5px from the detour of the line from A to F below, closer than its own line, and 5.6px from the line down from B. `dragon check --layout` reported it as `label-off-line`, but the notation could not fix it. When no spot at the usual distance keeps the name nearest to its own line, an architecture diagram now also tries spots closer to the line, down to 6px between the chip and the line, before it falls back to a spot where another line is nearer. The name of the line from A to C now sits 6px below its line and 16.5px above the detour of the line from A to F. The tracks keep their spacing, so the diagram keeps its size, and the examples, whose names all find a spot at the usual distance, draw as before.

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
