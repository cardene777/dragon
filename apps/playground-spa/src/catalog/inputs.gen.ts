// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
export const CHECKOUT_INPUTS = [
  {
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
  },
  {
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
  },
  {
    "name": "delivery",
    "min": 1,
    "max": 1,
    "fields": {
      "initial": {
        "required": true
      }
    }
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    "name": "scenario",
    "min": 3,
    "max": 3,
    "fields": {
      "outcome": {
        "required": true,
        "values": [
          "normal",
          "decline",
          "lost"
        ]
      }
    }
  },
  {
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
  }
];
