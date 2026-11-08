# Layout breaks

`dragon check` reads the notation without drawing it, so a diagram can pass it and still look broken once drawn: step numbers piled up, two lines running on top of each other, a line running across a name, a line squeezed along the border of a box or group, a text touching its frame, a coin slot or label sticking out of a shaped box, a tag cut off at the edge of the diagram, or a line name drawn away from its line.
`dragon check --layout` draws the diagram and reports these breaks.
It looks at every step, at the default width and at a phone width of 390px.

## Run it

```sh
dragon check --layout order.dragon
dragon check --layout --json order.dragon
```

- Each break is one `warning` line: `<file>:<line>:1 warning Step <n>: <message>`. The line is the `step` line of the first step where the break shows, and the message names the two parts involved.
- A break that only shows at the phone width ends with `(at width 390)`.
- A break that stays over several steps is reported once, at the first step where it shows.
- With `--json`, each break also has a `layout` object: `{ kind, step, width?, parts }`. `parts` holds two of `{ kind: "badge", step }`, `{ kind: "box", name }`, `{ kind: "group", name }`, `{ kind: "slot", box }`, `{ kind: "text", text, box }`, `{ kind: "line", from, to, step }`, `{ kind: "icon", box }`, `{ kind: "coin" }`, `{ kind: "envelope" }`, `{ kind: "frame", side }` (`side` is `left`, `right`, `top` or `bottom`), `{ kind: "needle" }`, `{ kind: "ticks" }`, `{ kind: "panel", panel: "axis" }`, `{ kind: "border", name }` (the border of a group, a lane or the strip), and for pipe diagrams `{ kind: "valve", from, to }` (a valve on the call pipe `from` → `to`; the valve of a token box has no `to`), `{ kind: "gauge", box }` and `{ kind: "pipe", from, to, step }` (the call pipe `from` → `to`, first used in `step`).
- Breaks are warnings, so the exit code stays `0`. Errors in the notation still exit `1`, and `--layout` does not draw a diagram that has errors.
- Pairs that are meant to touch are not reported: a line and the boxes at its ends, a group and the boxes in it, a step number on the corner of its own box, a step number at the start of a line next to the box the line leaves, a step number that takes the place of the number of an earlier step on the same line, and the step counter at the top right of a lineup.

## The kinds

| Kind | What it means |
|---|---|
| `badges-close` | Two step numbers seen together are less than one number's radius apart, so they read as one blob. A later step number that takes the exact spot of an earlier one and hides it is also reported |
| `badge-on-frame` | A step number sits on the border of a group, a lane or the strip, so the border line runs through the number |
| `lines-close` | Two straight runs of different lines go side by side less than one step number's width apart, two lines that go to different boxes run on top of each other (such as a line and its reply, or two lines that detour under a row at the same height), or two lines that leave the same spot of a box run on top of each other before they part. Lines that go to the same box may join before they enter it, and are not reported |
| `line-crosses-text` | A line runs across a text with no label behind it, such as a box name or the name of a node in a try diagram's network |
| `badge-off-shape` | A step number sits on the rectangle of a shaped box (`+bridge`, a hexagon) but floats away from the shape you see |
| `slot-outside-shape` | The slot a coin or envelope waits in sticks out of a shaped box |
| `text-outside-shape` | A box name or the text under it sticks out of a shaped box |
| `part-outside-frame` | A part (a tag, a label, a step number, an icon or a line) sticks out of an edge of the diagram, so an exported image cuts it off. A part that only rests there while the steps play, such as a tag waiting to leave, counts too |
| `panel-edge` | In a time diagram, the needle, the axis line with its ticks, a tick or period label, or a point label crosses the border of the time axis panel or comes closer than 4px to it |
| `label-off-line` | A line name, or the amount chip of a flow in a `pipe` diagram, is drawn away from its line, so it reads as the name of another line. A line name that sits closer to another line than to its own line is reported too, even when it is close to its own line |
| `label-on-line` | A line name sits on top of another line, so it reads as the name of that line. The line the name belongs to, and the same line drawn again at a later step, are not counted |
| `label-on-frame` | A line name crosses the border of a group, a lane or the strip, so the border line runs into the name and through its text |
| `chip-over-part` | In a pipe diagram, the tag of a returned value stops on a valve, a gauge or a box, so it hides that part |
| `pipe-behind-box` | In a pipe diagram, a call pipe leaves or enters a box at its rounded corner, or runs inside a box, so it looks like it passes behind the edge of the box |
| `pipes-merged` | In a pipe diagram, two call pipes run on top of each other. Calls from one box that leave on the same line in the same direction share one trunk until they part, and are not reported |
| `valve-near-pipe` | In a pipe diagram, the body of a valve is less than 10px from another call pipe, so it looks like it touches that pipe |
| `line-near-border` | A straight run of a line goes along the border of a box or a group closer than the 14px margin, so it reads as part of the border and its step number sits on the border. The line's own end boxes are not counted |
| `text-touches-border` | A text touches or crosses the border of the plain box or the value plate it sits in |

## Fix what the notation can fix

Fix one break, run `dragon check --layout` again, and repeat. A fix often clears several lines or moves a break to another step.

- `badges-close` between lines that leave the same box toward different boxes: Reorder the boxes, for example swap the order of two boxes in a group, so the lines leave from different sides.
- `lines-close` between two lines that run on top of each other: In an architecture diagram, dragon already draws lines that leave or enter the same spot of a box apart, and runs every detour under or over a row or down the gap between two columns on its own track, whichever box the line leaves from. In a git diagram, it draws lines that leave the same commit toward different lanes apart. If it still shows, for example when many lines leave one short side of a box, or in other diagrams, reorder the boxes the same way, so the lines leave from different sides or the detour is no longer needed.
- `line-crosses-text` on the network of a try diagram, where a line that skips a column (`you - builder` next to `you - a - b - builder`) runs under the names of the nodes in that column: Write that path through a node of the column it skips when the explanation allows it. Otherwise keep it and report it.
- `text-outside-shape`, `slot-outside-shape` and `badge-off-shape`: dragon makes a shaped box larger until its name, the text under it and its slot fit inside the shape, and puts the step number on the edge of the shape. These breaks are left only when a shape has little room inside even at three times its size, such as a thin `path`. Shorten the box name or the text under it (`note:`, `act <id>:`, `note <id>:`), or use a plain `box` with an `icon:` when the explanation does not need that shape. Otherwise keep it and report it.
- `part-outside-frame`: dragon already widens the diagram for tags that rest next to the leftmost or rightmost box, so this is rare. Shorten the tag (`[tag: ...]`) or the text that sticks out, or reorder the boxes so the box the line goes to or leaves is not at the edge. Otherwise keep it and report it.
- `label-off-line` on a line whose name you placed with `[side: above]` or `[side: below]`: Drop the `[side: ...]` so dragon can put the name on the free side of the line, or move one of the lines to its own step. Two names placed on the same side of the same line stack, and the outer one ends up away from its line.
- `label-on-line`, and `label-off-line` on a name that sits closer to another line: In an architecture diagram, dragon already puts a line name beside its own line where other lines are at least twice as far from the name as its own line, and makes room when a line that runs around the boxes leaves none: it widens the gap between two columns, two rows or two groups, or moves the detour under or over a row away from the row. Between detours that run side by side, it moves the name closer to its own line, down to 6px. If it still shows, for example when several lines leave one side of a box next to each other, shorten the name or reorder the boxes so the other line no longer runs past it. Otherwise keep it and report it.
- `chip-over-part`: dragon stops the tag of a returned value at the first spot on the call pipe, counted from the caller, that is clear of valves, gauges and boxes. A long value on a short pipe has no such spot. Shorten the value in `return <id>: <value>`. Otherwise keep it and report it.
- `pipe-behind-box`, `pipes-merged` and `valve-near-pipe` come from how dragon routes the call pipes, so the notation cannot fix them. Keep them and report them.
- `line-near-border`: Reorder the boxes so the line does not have to pass along other boxes, for example put the two boxes it joins next to each other. Otherwise keep it and report it.
- `text-touches-border`: Shorten the text. Otherwise keep it and report it.
- `panel-edge` on a point label: A point near the right end writes its name and `note` text to the right of its flag. Shorten the text, or place the point at an earlier unit. A `panel-edge` on the needle, the ticks or a tick label comes from how dragon draws, so report it.
- `badge-on-frame`: dragon moves a step number along its line off the borders, so this only shows when no spot on the line is clear. Keep it and report it.
- `label-on-frame`: In an architecture diagram, dragon already puts the name of a line that leaves a group clear of the group's border, widens the gap between two groups when the name has no room there, and makes room above the top row for a name over a detour. If it still shows, shorten the name or reorder the boxes so the line does not leave the group next to another line. Otherwise keep it and report it.

Do not drop content the explanation needs just to clear a warning.

## Report what is left

The breaks left after these fixes come from how dragon draws (a shape with too little room inside), and the notation cannot fix them.

1. In your reply, name each break left by its step number and the parts the message names, for example "Step 3: step number 3 floats away from the shape of the bridge box".
2. Export the step so the user can see it, and attach the image.

```sh
dragon export order.dragon --format png --step 3 --out shots
```

`--step <n>` picks the step the PNG shows (counted from 1, the last step by default). Exporting needs Chromium ([setup](setup.md)). When Chromium cannot be installed, report the breaks in words only.

3. Offer to send the break to the dragon repo as an issue, and send it only if the user agrees. The steps are in [blocks.md](blocks.md#report-a-layout-break-dragon-draws).
