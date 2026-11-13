import type { BlockRule } from "./index";

export const scenario = {
  "name": "scenario",
  "min": 3,
  "max": 3,
  "fields": {
    "outcome": {
      "required": true,
      "values": [
        "normal",
        "decline",
        "lost"
      ]
    }
  }
} satisfies BlockRule;
