import type { BlockRule } from "./index";

export const total = {
  "name": "total",
  "min": 1,
  "max": 1,
  "fields": {
    "product": {
      "required": true
    },
    "delivery": {
      "required": true
    },
    "rule": {
      "required": true,
      "values": [
        "price * quantity + fee"
      ]
    }
  }
} satisfies BlockRule;
