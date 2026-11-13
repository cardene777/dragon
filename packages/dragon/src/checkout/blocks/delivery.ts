import type { BlockRule } from "./index";

export const delivery = {
  "name": "delivery",
  "min": 1,
  "max": 1,
  "fields": {
    "initial": {
      "required": true
    }
  }
} satisfies BlockRule;
