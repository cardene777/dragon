import type { BlockRule } from "./index";

export const approval = {
  "name": "approval",
  "min": 1,
  "max": 1,
  "fields": {
    "total": {
      "required": true
    },
    "invalidates": {
      "required": true,
      "values": [
        "quantity, delivery"
      ]
    }
  }
} satisfies BlockRule;
