---
type: tool_used
tool: Bash
input_match: 'dragon[^\s"]*\s+check\s+(?![^"&;|]*--blocks)(?:-[^"\s]+\s+)*(?:[^"\s]*blocks/)?[a-z0-9-]+\.dragon'
---
The agent must run `dragon check` on the new definition file on its own, as step 4 of the skill's pull request steps requires.
