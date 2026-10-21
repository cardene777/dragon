/**
 * 図の原本の JSON を、人が書く記法へ書き戻す。
 *
 * 並べ方は決まった形に整える。JSON の欄の並び順は見ず、欄の名前で読むので、
 * 同じ内容の JSON からは毎回同じ文字列になる。書き手の行の並べ方とコメントは保たない。
 * 段の中で起きることは JSON の並び順 (起きる順) のまま書く。
 *
 * 語は渡した言葉で書く (#2997)。渡さなければ日本語で書く。
 * 英語では添え書きと下の字と書き換えの字を `"…"` で囲み、名前か字に `"` を含む物だけ「」で囲む。
 * 英語の語の file でも「」は読めるので、読み直すと同じ JSON に戻る。
 */
import type { Box, Carry, Diagram, DiagramEvent, Region } from "./schema";
import { type NotationLang, type WORDS, wordOf } from "./words";

type AttrKey = keyof typeof WORDS.attr;

export interface PrintOptions {
  /** 記法の語の言葉。既定は日本語 */
  lang?: NotationLang;
}

/** 名前の後ろに `text` を囲んで付ける。`text` が無ければ何も付けない */
function quoted(name: string, text: string | undefined, lang: NotationLang): string {
  if (text === undefined) return "";
  if (lang === "en" && !name.includes('"') && !text.includes('"')) return ` "${text}"`;
  return `「${text}」`;
}

export function printNotation(diagram: Diagram, options: PrintOptions = {}): string {
  const lang = options.lang ?? "ja";
  const attrs = (pairs: [AttrKey, string | undefined][]): string =>
    pairs
      .filter((pair): pair is [AttrKey, string] => pair[1] !== undefined)
      .map(([key, value]) => ` [${wordOf("attr", key, lang)} ${value}]`)
      .join("");

  const region = (r: Region): string =>
    `${wordOf("head", "region", lang)} ${r.id} = ${r.name}${quoted(r.name, r.note, lang)}${attrs([["color", r.color], ["icon", r.icon]])}`;
  const box = (b: Box): string =>
    `${b.id} = ${b.name}${quoted(b.name, b.sub, lang)}${attrs([["color", b.color], ["icon", b.icon], ["region", b.region]])}`;

  const carry = (c: Carry): string => {
    if (c.kind === "envelope") return "";
    if (c.kind === "tag") return ` [${wordOf("carry", "tag", lang)} ${c.text}]`;
    return ` [${wordOf("carry", c.kind, lang)}]`;
  };

  const event = (e: DiagramEvent): string => {
    switch (e.type) {
      case "edge":
        return `${e.from} -> ${e.to}${e.label === undefined ? "" : ` : ${e.label}`}${carry(e.carry)}${e.labelSide ? ` [${wordOf("attr", "label", lang)} ${wordOf("side", e.labelSide, lang)}]` : ""}`;
      case "action":
        return `${e.box} : ${e.label}`;
      case "swap":
        return `${e.box}${quoted("", e.text, lang)}`;
      case "strip":
        return `${wordOf("head", "strip", lang)} ${e.field}${e.value === undefined ? "" : ` = ${e.value}`}${e.tag === undefined ? "" : ` [${e.tag}]`}`;
    }
  };

  const head = [
    ...(diagram.view ? [`${wordOf("head", "view", lang)} ${wordOf("view", diagram.view, lang)}`] : []),
    ...(diagram.regions ?? []).map(region),
    ...diagram.boxes.map(box),
    ...(diagram.strip ? [`${wordOf("head", "strip", lang)} ${diagram.strip.title} = ${diagram.strip.fields.join(", ")}`] : []),
  ];
  const steps = diagram.steps.map((step) =>
    [
      `# ${step.title}`,
      ...step.body.split("\n").map((line) => `> ${line}`),
      ...(step.code === undefined ? [] : [`\`${step.code}\``]),
      ...step.events.map(event),
    ].join("\n"),
  );
  return [`${wordOf("kind", diagram.kind, lang)} ${diagram.title}`, head.join("\n"), ...steps].join("\n\n") + "\n";
}
