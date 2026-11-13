import type { BlockRule } from "./index";

export const flow = {
  "name": "flow",
  "min": 1,
  "max": 1,
  "fields": {
    "buyer": {
      "required": true
    },
    "agent": {
      "required": true
    },
    "seller": {
      "required": true
    },
    "payment": {
      "required": true
    },
    "wire": {
      "required": true,
      "values": [
        "horizontal"
      ]
    },
    "carry": {
      "required": true,
      "values": [
        "message"
      ]
    }
  }
} satisfies BlockRule;
