---
type: tool_used
tool: Bash
input_match: 'dragon[^\s"]*\s+check\b[^"&;|]*--blocks[^"&;|]*examples/[a-z0-9-]+\.dragon'
---
The agent must check the new example with the definition passed by `dragon check --blocks`, as step 4 of the skill's pull request steps requires.
