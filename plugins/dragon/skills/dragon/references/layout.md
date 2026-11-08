# Layout breaks

`dragon check` reads the notation without drawing it, so a diagram can pass it and still look broken once drawn: step numbers piled up, two lines running on top of each other, a line running across a name, a coin slot or label sticking out of a shaped box, a tag cut off at the edge of the diagram, or a line name drawn away from its line.
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
- With `--json`, each break also has a `layout` object: `{ kind, step, width?, parts }`. `parts` holds two of `{ kind: "badge", step }`, `{ kind: "box", name }`, `{ kind: "slot", box }`, `{ kind: "text", text, box }`, `{ kind: "line", from, to, step }`, `{ kind: "icon", box }`, `{ kind: "coin" }`, `{ kind: "envelope" }`, `{ kind: "frame", side }` (`side` is `left`, `right`, `top` or `bottom`), `{ kind: "needle" }`, `{ kind: "ticks" }` and `{ kind: "panel", panel: "axis" }`.
- Breaks are warnings, so the exit code stays `0`. Errors in the notation still exit `1`, and `--layout` does not draw a diagram that has errors.
- Pairs that are meant to touch are not reported: a line and the boxes at its ends, a group and the boxes in it, a step number on the corner of its own box, and a step number at the start of a line next to the box the line leaves.

## The kinds

| Kind | What it means |
|---|---|
| `badges-close` | Two step numbers seen together are less than one number's radius apart, so they read as one blob |
| `lines-close` | Two straight runs of different lines go side by side less than one step number's width apart, or two lines between the same two boxes in opposite directions run on top of each other |
| `line-crosses-text` | A line runs across a text with no label behind it, such as a box name or the name of a node in a try diagram's network |
| `badge-off-shape` | A step number sits on the rectangle of a shaped box (`+bridge`, a hexagon) but floats away from the shape you see |
| `slot-outside-shape` | The slot a coin or envelope waits in sticks out of a shaped box |
| `text-outside-shape` | A box name or the text under it sticks out of a shaped box |
| `part-outside-frame` | A part (a tag, a label, a step number, an icon or a line) sticks out of an edge of the diagram, so an exported image cuts it off. A part that only rests there while the steps play, such as a tag waiting to leave, counts too |
| `panel-edge` | In a time diagram, the needle, the axis line with its ticks, a tick or period label, or a point label crosses the border of the time axis panel or comes closer than 4px to it |
| `label-off-line` | A line name, or the amount chip of a flow in a `pipe` diagram, is drawn away from its line, so it reads as the name of another line |

## Fix what the notation can fix

Fix one break, run `dragon check --layout` again, and repeat. A fix often clears several lines or moves a break to another step.

- `badges-close` between lines that leave the same box toward different boxes: Reorder the boxes, for example swap the order of two boxes in a group, so the lines leave from different sides.
- `line-crosses-text` on the network of a try diagram, where a line that skips a column (`you - builder` next to `you - a - b - builder`) runs under the names of the nodes in that column: Write that path through a node of the column it skips when the explanation allows it. Otherwise keep it and report it.
- `text-outside-shape` where the text sticks out at the sides: Shorten the box name or the text under it (`note:`, `act <id>:`, `note <id>:`). The box gets narrower with the text, so check again: a narrower box can push the slot out instead.
- `part-outside-frame`: dragon already widens the diagram for tags that rest next to the leftmost or rightmost box, so this is rare. Shorten the tag (`[tag: ...]`) or the text that sticks out, or reorder the boxes so the box the line goes to or leaves is not at the edge. Otherwise keep it and report it.
- `label-off-line` on a line whose name you placed with `[side: above]` or `[side: below]`: Drop the `[side: ...]` so dragon can put the name on the free side of the line, or move one of the lines to its own step. Two names placed on the same side of the same line stack, and the outer one ends up away from its line.
- `text-outside-shape` below a shape with no room at the bottom (the arch of `+bridge`), `slot-outside-shape` and `badge-off-shape`: Use a plain `box` with an `icon:` when the explanation does not need that shape. Otherwise keep it and report it.
- `panel-edge` on a point label: A point near the right end writes its name and `note` text to the right of its flag. Shorten the text, or place the point at an earlier unit. A `panel-edge` on the needle, the ticks or a tick label comes from how dragon draws, so report it.

Do not drop content the explanation needs just to clear a warning.

## Report what is left

The breaks left after these fixes come from how dragon draws (the slot or step number does not follow the shape of a block), and the notation cannot fix them.

1. In your reply, name each break left by its step number and the parts the message names, for example "Step 3: step number 3 floats away from the shape of the bridge box".
2. Export the step so the user can see it, and attach the image.

```sh
dragon export order.dragon --format png --step 3 --out shots
```

`--step <n>` picks the step the PNG shows (counted from 1, the last step by default). Exporting needs Chromium ([setup](setup.md)). When Chromium cannot be installed, report the breaks in words only.

3. Offer to send the break to the dragon repo as an issue, and send it only if the user agrees. The steps are in [blocks.md](blocks.md#report-a-layout-break-dragon-draws).
