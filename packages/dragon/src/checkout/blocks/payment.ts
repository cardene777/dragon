import type { BlockRule } from "./index";

export const payment = {
  "name": "payment",
  "min": 1,
  "max": 1,
  "fields": {
    "approval": {
      "required": true
    },
    "limit": {
      "required": true,
      "values": [
        "approved-total"
      ]
    }
  }
} satisfies BlockRule;
