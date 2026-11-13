import type { BlockRule } from "./index";

export const product = {
  "name": "product",
  "min": 1,
  "max": 1,
  "fields": {
    "price": {
      "number": true,
      "required": true
    },
    "min": {
      "number": true,
      "default": "1"
    },
    "max": {
      "number": true,
      "default": "3"
    },
    "initial": {
      "number": true,
      "default": "1"
    },
    "unit": {
      "required": true
    },
    "merchant": {
      "required": true
    },
    "art": {
      "default": "none",
      "values": [
        "none",
        "shoe"
      ]
    }
  }
} satisfies BlockRule;
