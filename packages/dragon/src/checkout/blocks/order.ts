import type { BlockRule } from "./index";

export const order = {
  "name": "order",
  "min": 1,
  "max": 1,
  "fields": {
    "payment": {
      "required": true
    },
    "policy": {
      "required": true,
      "values": [
        "once"
      ]
    }
  }
} satisfies BlockRule;
