/**
 * 原本の検査の塊 (#3400、#3493)。ajv が書き出した形の検査の関数と、形に書けない決まりの検査を 1 つにする。
 *
 * 形に書けない決まりは、絵柄集の絵柄 (`tabler:<名前>`) が絵柄集に在るか。5,000 を超える名前を形に並べると検査の関数が大きくなるので、
 * 形は名前の書き方だけを決め、在るかは原本の検査 (`validateDiagram`) が登録した絵柄集の表と比べる。
 * 全部を持つ入口は読み込みの時に登録し、軽い入口は原本の JSON を読む前にだけこの塊を後から読む
 */
import { tablerErrors } from "../blocks/icon/set-fields";
import shape from "./validate-diagram.js";

export const VALIDATOR = { shape, tablerErrors };
