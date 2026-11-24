/**
 * 原本の検査の塊 (#3400、#3493)。ajv が書き出した形の検査の関数と、形に書けない決まりの検査を 1 つにする。
 *
 * 形に書けない決まりは、絵柄集の絵柄 (`tabler:<名前>`) が絵柄集に在るか。5,000 を超える名前を形に並べると検査の関数が大きくなるので、
 * 形は名前の書き方だけを決め、在るかは原本の検査 (`validateDiagram`) が登録した絵柄集の表と比べる。
 * 量の図の漏斗の見た目 (#3621) で前の項目より大きい値を書いていないかと、折れ線の見た目 (#3802) の段の数と値を書かない項目と `none` の値も、
 * 形に書けないので、ここで確かめる。配管の図の箱の名前の下の字 (`sub`) がトークンの箱だけに在るか (#3803) も、残高の欄と比べるのでここで確かめる。
 * 原本の誤りの文の表 (`field-messages.ts`) と、ajv の誤りを欄の場所と文にする処理 (`field-errors.ts`) も検査と一緒にこの塊が持ち、最初に読む束に入れない (#3846)。
 * 全部を持つ入口は読み込みの時に登録し、軽い入口は原本の JSON を読む前にだけこの塊を後から読む
 */
import type { ErrorObject } from "ajv";
import { funnelErrors } from "../blocks/chart-shape/funnel";
import { lineErrors } from "../blocks/chart-shape/line";
import { holdLinkErrors } from "../blocks/hold/link-fields";
import { holdNoteErrors } from "../blocks/hold/note-fields";
import { tablerErrors } from "../blocks/icon/set-fields";
import { FIELD_MESSAGES } from "../field-messages";
import { readyParts } from "../kinds/registry";
import { FORMAT_VERSION, isVersion1, upgrade } from "../model";
import type { Checked, Diagram, FieldError } from "../schema";
import type { NotationLang } from "../words";
import { branchesOf, toFieldError, toVersion1Error } from "./field-errors";
import shape from "./validate-diagram.js";

/** 量の図の見た目ごとの値の誤り。見た目の違う図の誤りは返さない */
const chartErrors = (input: unknown, lang: NotationLang): FieldError[] => [...funnelErrors(input, lang), ...lineErrors(input, lang)];

/** 原本の JSON を `lang` の誤りの文で検査する。誤りの扱いは `validateDiagram` (`schema.ts`) の説明のとおり */
function check(input: unknown, lang: NotationLang): Checked {
  const version1 = isVersion1(input);
  const m = FIELD_MESSAGES[lang];
  // 絵柄集の絵柄は、形が名前の書き方だけを決めるので、絵柄集に在るかをここで確かめる (#3493)。
  // 原本を書いた形 (版1か版2) のまま辿るので、誤りの場所は書いた原本の欄になる。
  // 量の図の漏斗の見た目の値が段を進むほど減るかと、折れ線の見た目の段の数と値を書かない項目も、形に書けないのでここで確かめる (#3621、#3802)。
  // 値の持ち分の線が別の2人を結ぶかと、配管の図の名前の下の字がトークンの箱だけに在るかも、形が2つの欄を比べられないのでここで確かめる (Tracelyth #133、#3803)
  const sets = [...tablerErrors(input, m), ...chartErrors(input, lang), ...holdLinkErrors(input, m.oneOf), ...holdNoteErrors(input, lang)];
  if (typeof input === "object" && input !== null && (input as Diagram).kind) {
    const native = readyParts((input as Diagram).kind)?.validate;
    if (native) sets.push(...native(input as Diagram).map((message) => ({ pointer: "/blocks", message })));
  }
  if (shape(version1 ? upgrade(input, FORMAT_VERSION) : input)) return sets.length === 0 ? { ok: true } : { ok: false, errors: sets };
  const all = (shape.errors ?? []).map((error: ErrorObject) => (version1 ? toVersion1Error(error) : error));
  const inBranch = new Set(all.filter((error) => error.keyword === "anyOf").flatMap((anyOf) => branchesOf(anyOf, all)));
  // 条件付きの決まり (if / then) は中で落ちた決まりの誤りを別に出すので、包む側の if の誤りは出さない
  const found = all.filter((error) => error.keyword !== "if" && !inBranch.has(error)).map((error) => toFieldError(error, all, m, input));
  const errors = [...found, ...sets];
  return { ok: false, errors: errors.filter((error, i) => errors.findIndex((other) => other.pointer === error.pointer && other.message === error.message) === i) };
}

export const VALIDATOR = { check };
