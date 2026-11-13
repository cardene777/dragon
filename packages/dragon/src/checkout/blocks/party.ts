import type { BlockRule } from "./index";

export const party = {
  "name": "party",
  "min": 4,
  "max": 4,
  "fields": {
    "role": {
      "required": true,
      "values": [
        "buyer",
        "agent",
        "seller",
        "payment"
      ]
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
