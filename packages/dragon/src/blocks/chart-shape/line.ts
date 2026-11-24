/**
 * 量の図の折れ線の見た目 (#3802) の値の決まり。
 *
 * 折れ線は段の 1 つを時間の軸の点の 1 つにするので、段が 2 つ以上無いと線を引けない。
 * どの段にも値を書かない項目は線を引けず、どの項目にも入らない数 (`set none`) は時間の軸の上に置けない。
 * 記法を読む処理 (`blocks/chart-set/read.ts`) と原本の検査 (`schemas/validator.ts`) が共に使い、誤りの文も両方が同じ文を出す。
 * どちらも後から読む塊なので、描く時と見本帳を開いた時に読む塊に入れない。
 */
import type { FieldError } from "../../schema";
import type { NotationLang } from "../../words";

/** 段を少なくとも幾つ書くか。点が 2 つあって初めて線を引ける */
export const LINE_STEPS_LEAST = 2;

/** 折れ線の見た目の誤りの文 */
export interface LineText {
  /** 段が `LINE_STEPS_LEAST` より少ない */
  fewSteps: string;
  /** 項目 `item` の値をどの段にも書いていない */
  unset: (item: string) => string;
  /** どの項目にも入らない数 `none` の値を書いた。原本の JSON だけが使い、記法は宣言していない項目の誤りで止める */
  none: string;
}

export const LINE_TEXT: Readonly<Record<NotationLang, LineText>> = {
  ja: {
    fewSteps: `折れ線の見た目 (shape: line) は段を ${LINE_STEPS_LEAST} つ以上書く。段の 1 つが時間の軸の点の 1 つになり、点が 2 つあって線を引ける`,
    unset: (item) => `折れ線の見た目 (shape: line) では、${item} の値をどれかの段の set の行で書く。値の無い項目は線を引けない`,
    none: "折れ線の見た目 (shape: line) には none の値を書けない。none はどの項目にも入らない数で、時間の軸の上に置けない",
  },
  en: {
    fewSteps: `A line chart (shape: line) needs at least ${LINE_STEPS_LEAST} steps. Each step is one point on the time axis, and a line needs two points`,
    unset: (item) => `A line chart (shape: line) needs a set line for ${item} in some step. An item without a value has no line`,
    none: "A line chart (shape: line) takes no value for none. none is the count in no item and has no place on the time axis",
  },
};

interface SetLike {
  type?: unknown;
  item?: unknown;
}

/**
 * 原本の JSON の折れ線の見た目の量の図の誤り。段が足りない時は段の並び (`/steps`) を、どの段にも値を書かない項目は項目の名札を、
 * `none` の値はその値の出来事の項目の欄を指す。形の検査が断る原本 (欄の型の違い) は見ない
 */
export function lineErrors(input: unknown, lang: NotationLang): FieldError[] {
  const d = input as { kind?: unknown; chart?: { shape?: unknown; items?: unknown }; steps?: unknown } | null;
  if (d?.kind !== "chart" || d.chart?.shape !== "line" || !Array.isArray(d.chart.items) || !Array.isArray(d.steps)) return [];
  const text = LINE_TEXT[lang];
  const errors: FieldError[] = [];
  if (d.steps.length < LINE_STEPS_LEAST) errors.push({ pointer: "/steps", message: text.fewSteps });
  const items = d.chart.items as { id?: unknown }[];
  // 折れ線の見た目では none も項目の名札に使えるので、none を宣言した図の none の値はその項目の値と読む
  const noneDeclared = items.some((item) => item?.id === "none");
  const written = new Set<string>();
  for (const [s, step] of (d.steps as { events?: unknown }[]).entries()) {
    const events: SetLike[] = Array.isArray(step?.events) ? (step.events as SetLike[]) : [];
    events.forEach((event, e) => {
      if (event?.type !== "set" || typeof event.item !== "string") return;
      written.add(event.item);
      if (event.item === "none" && !noneDeclared) errors.push({ pointer: `/steps/${s}/events/${e}/item`, message: text.none });
    });
  }
  items.forEach((item, i) => {
    if (typeof item?.id === "string" && !written.has(item.id)) errors.push({ pointer: `/chart/items/${i}/id`, message: text.unset(item.id) });
  });
  return errors;
}
