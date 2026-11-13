import type { BlockRule } from "./index";

export const option = {
  "name": "option",
  "min": 1,
  "max": 6,
  "fields": {
    "for": {
      "required": true
    },
    "fee": {
      "number": true,
      "required": true
    },
    "note": {
      "default": ""
    },
    "icon": {
      "default": "bag",
      "values": [
        "user",
        "agent",
        "shop",
        "card",
        "bolt",
        "truck",
        "bag",
        "lock",
        "check",
        "refresh"
      ]
    }
  }
} satisfies BlockRule;
