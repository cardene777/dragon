import type { BlockRule } from "./index";

export const budget = {
  "name": "budget",
  "min": 1,
  "max": 1,
  "fields": {
    "min": {
      "number": true,
      "required": true
    },
    "max": {
      "number": true,
      "required": true
    },
    "step": {
      "number": true,
      "required": true
    },
    "initial": {
      "number": true,
      "required": true
    }
  }
} satisfies BlockRule;
