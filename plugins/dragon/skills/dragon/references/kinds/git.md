# git

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Commits stacking on branches until they are merged: merge commits, rebases, fast-forwards, cherry-picks, resets, detached `HEAD`.
Each branch gets its own band. Steps add commits and move refs.

## Lines

| Line | Where | Meaning |
|---|---|---|
| `branch <name> [note: <note>]` | Before the first step | A band. Bands stack from the top in the order declared. Declare the target branch first |
| `box <id> as <name> [note: ...]` | Before the first step | Optional. Something that changes outside commits, such as the worktree or a remote |
| `strip <title>: <field>, ...` | Before the first step | Optional. Where each ref points, for example `strip Refs: main, feature, HEAD` |
| `commit <id> on <branch> [hash: <hash>, note: <note>]` | In a step | A commit at the tip of the branch. The branch ref moves to it |
| `commit <id> on <branch> merge <other> [...]` | In a step | A merge commit with two parents: the tip of `<branch>` and the tip of `<other>` |
| `commit <id> on <branch> copy <source> [...]` | In a step | A replayed copy of `<source>` (rebase, cherry-pick). It does not move the branch ref |
| `<branch> from <commit>` | In a step | Cuts a branch at a commit. `HEAD` moves to that branch |
| `<branch> -> <commit>: <label>` | In a step | Moves a branch ref without making a commit (fast-forward, reset) |
| `HEAD -> <commit>: <label>` | In a step | Moves `HEAD` straight to a commit (detached) |
| `code <command>` | In a step | The git command for the step |
| `note <id>: <text>`, `set <field>: <value>` | In a step | Updates a box or a strip field |

- A `hash` is 4 to 40 characters of `0-9` and `a-f`. Use a realistic 7-character short hash.
- Name a replayed commit after its source with a prime, such as `C'`.
- A commit that no ref can reach any more turns into a dotted circle. Use it to show what a rebase or reset leaves behind.

## How to write it well

- Put the command in `code` (`code git rebase main`) and say in `say` what changed in the graph.
- Keep a strip of refs and `set` it whenever a ref moves, so readers can follow `HEAD`.
- One step per command is usually right. Group several commits made by one command (a rebase replaying two commits) only when the step is about the command, not each commit.

## Example

```dragon
git Fast-forward a feature into main

branch main [note: Release branch]
branch feature [note: Work branch]

strip Refs: main, feature

step Start from main
  say main has two commits, and main points at B.
  commit A on main [hash: 3fa0c19, note: First page]
  commit B on main [hash: 8b04f71, note: Add the list]
  set main: B

step Cut a branch and work
  say feature is cut from B and gets two commits. main stays at B.
  code git switch -c feature
  feature from B
  commit C on feature [hash: c41d0e5, note: Add search]
  commit D on feature [hash: d72b9a3, note: Add filters]
  set feature: D

step Fast-forward main
  say No one else changed main, so main can move up to D without a merge commit.
  code git switch main && git merge --ff-only feature
  main -> D: fast-forward
  set main: D
```
