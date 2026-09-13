// このファイルは自動生成です。 手で編集しないでください。
//
// 出どころ = 描画側 (`@cardenelabs/cdl`) の型定義 `CdlInput`。
// 作り直す = `node packages/dragon/scripts/gen-input-table.mjs`
// ずれの検知 = `packages/dragon/test/input-table-generated.test.ts`

import type { 図形の定義 } from "./parser-types";

/** 記法が受けるつまみと、その欄 (`CdlInput` の全種を覆う) */
export const つまみの表: Record<string, 図形の定義> = {
  color: {
    必須: ["defaultValue"],
    欄: {
      defaultValue: "文字列",
      label: "文字列",
    },
  },
  datetime: {
    必須: ["defaultValue"],
    欄: {
      defaultValue: "文字列",
      label: "文字列",
    },
  },
  dropdown: {
    必須: ["options", "defaultValue"],
    欄: {
      options: "選択肢の並び",
      defaultValue: "文字列",
      label: "文字列",
    },
  },
  "multi-select": {
    必須: ["options", "defaultValues"],
    欄: {
      options: "選択肢の並び",
      defaultValues: "文字列の並び",
      label: "文字列",
    },
  },
  number: {
    必須: ["defaultValue"],
    欄: {
      min: "数",
      max: "数",
      defaultValue: "数",
      label: "文字列",
    },
  },
  radio: {
    必須: ["options", "defaultValue"],
    欄: {
      options: "選択肢の並び",
      defaultValue: "文字列",
      label: "文字列",
    },
  },
  range: {
    必須: ["min", "max", "defaultLo", "defaultHi"],
    欄: {
      min: "数",
      max: "数",
      step: "数",
      defaultLo: "数",
      defaultHi: "数",
      label: "文字列",
    },
  },
  slider: {
    必須: ["min", "max", "defaultValue"],
    欄: {
      min: "数",
      max: "数",
      step: "数",
      defaultValue: "数",
      label: "文字列",
    },
  },
  stepper: {
    必須: ["defaultValue"],
    欄: {
      min: "数",
      max: "数",
      step: "数",
      defaultValue: "数",
      label: "文字列",
    },
  },
  tabs: {
    必須: ["options", "defaultValue"],
    欄: {
      options: "選択肢の並び",
      defaultValue: "文字列",
      label: "文字列",
    },
  },
  text: {
    必須: ["defaultValue"],
    欄: {
      defaultValue: "文字列",
      placeholder: "文字列",
      maxLength: "数",
      label: "文字列",
    },
  },
  timeline: {
    必須: ["duration"],
    欄: {
      duration: "数",
      autoplay: "真偽",
      loop: "真偽",
      speeds: "数の並び",
      defaultSpeedIdx: "数",
      label: "文字列",
    },
  },
  toggle: {
    必須: ["defaultValue"],
    欄: {
      defaultValue: "真偽",
      label: "文字列",
      onLabel: "文字列",
      offLabel: "文字列",
    },
  },
  xypad: {
    必須: ["xMin", "xMax", "yMin", "yMax", "defaultX", "defaultY"],
    欄: {
      xMin: "数",
      xMax: "数",
      yMin: "数",
      yMax: "数",
      defaultX: "数",
      defaultY: "数",
      label: "文字列",
    },
  },
};
