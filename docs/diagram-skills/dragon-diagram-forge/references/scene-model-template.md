# Scene Model Template

Create this before rendering.

```markdown
# Scene Model: <topic>

## Teaching Target

- Audience:
- Misconception:
- Primary mechanism:
- Non-goals:

## Required Data

- Exact protocol fields:
- Numeric values:
- State variables:
- Messages/functions/events/proofs:

## Scenes

### Scene 1: <name>

- Purpose:
- Actors:
- Boundaries:
- Input:
- Execution boundary:
- State before:
- Active data:
- Active operation:
- What changes / state delta:
- State after:
- Output:
- Active path:
- Inactive context:
- Visual grammar:
- Animation:
- Review risk:

### Scene 2: <name>

- Purpose:
- Actors:
- Boundaries:
- Input:
- Execution boundary:
- State before:
- Active data:
- Active operation:
- What changes / state delta:
- State after:
- Output:
- Active path:
- Inactive context:
- Visual grammar:
- Animation:
- Review risk:
```

## Rules

- One scene has one dominant mechanism.
- Required scene fields must not be empty.
- `N/A` is allowed only with a concrete reason.
- Abstract placeholders such as "process", "data", "state changes", or "proof happens" do not satisfy required fields.
- Do not put long prose in the diagram canvas.
- For smart contracts, function, storage, and event live inside the contract boundary.
- For fee markets, show formula, parent-child dependency, and money split.
- For consensus, separate inclusion, head choice, justified, and finalized.
- For bridges, separate message, proof, relayer/watcher, finality or challenge delay, and replay protection.
