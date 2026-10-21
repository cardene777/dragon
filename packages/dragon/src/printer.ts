/**
 * 図の原本の JSON を、人が書く記法へ書き戻す。
 *
 * 並べ方は決まった形に整える。JSON の欄の並び順は見ず、欄の名前で読むので、
 * 同じ内容の JSON からは毎回同じ文字列になる。書き手の行の並べ方とコメントは保たない。
 * 段の中で起きることは JSON の並び順 (起きる順) のまま書く。
 */
import { CARRIES, KINDS, SIDES } from "./parser";
import type { Box, Carry, Diagram, DiagramEvent, LabelSide, Region } from "./schema";

const invert = <V extends string>(table: Readonly<Record<string, V>>): Record<V, string> =>
  Object.fromEntries(Object.entries(table).map(([word, value]) => [value, word])) as Record<V, string>;

const KIND_WORD = invert(KINDS);
const CARRY_WORD = invert(CARRIES);
const SIDE_WORD = invert<LabelSide>(SIDES);

const note = (text: string | undefined): string => (text === undefined ? "" : `「${text}」`);
const attrs = (pairs: [string, string | undefined][]): string =>
  pairs
    .filter((pair): pair is [string, string] => pair[1] !== undefined)
    .map(([key, value]) => ` [${key} ${value}]`)
    .join("");

const region = (r: Region): string => `区画 ${r.id} = ${r.name}${note(r.note)}${attrs([["色", r.color], ["印", r.icon]])}`;
const box = (b: Box): string =>
  `${b.id} = ${b.name}${note(b.sub)}${attrs([["色", b.color], ["印", b.icon], ["区画", b.region]])}`;

function carry(c: Carry): string {
  if (c.kind === "envelope") return "";
  if (c.kind === "tag") return ` [${CARRY_WORD.tag} ${c.text}]`;
  return ` [${CARRY_WORD[c.kind]}]`;
}

function event(e: DiagramEvent): string {
  switch (e.type) {
    case "edge":
      return `${e.from} -> ${e.to}${e.label === undefined ? "" : ` : ${e.label}`}${carry(e.carry)}${e.labelSide ? ` [名前 ${SIDE_WORD[e.labelSide]}]` : ""}`;
    case "action":
      return `${e.box} : ${e.label}`;
    case "swap":
      return `${e.box}「${e.text}」`;
    case "strip":
      return `帯 ${e.field}${e.value === undefined ? "" : ` = ${e.value}`}${e.tag === undefined ? "" : ` [${e.tag}]`}`;
  }
}

export function printNotation(diagram: Diagram): string {
  const head = [
    ...(diagram.regions ?? []).map(region),
    ...diagram.boxes.map(box),
    ...(diagram.strip ? [`帯 ${diagram.strip.title} = ${diagram.strip.fields.join(", ")}`] : []),
  ];
  const steps = diagram.steps.map((step) =>
    [
      `# ${step.title}`,
      ...step.body.split("\n").map((line) => `> ${line}`),
      ...(step.code === undefined ? [] : [`\`${step.code}\``]),
      ...step.events.map(event),
    ].join("\n"),
  );
  return [`${KIND_WORD[diagram.kind]} ${diagram.title}`, head.join("\n"), ...steps].join("\n\n") + "\n";
}
