/**
 * ring のブロックの原本の形の欠片 (#3623)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 輪は手順の箱と線から並べ、原本の blocks に輪の欄は無い。手順の数の決まりは図の種類ごとの決まりと一緒に骨組み (`schemas/base.schema.json`) が持つ。
 * 時計の文字盤の見た目 (#3638) と輪を開いた帯の見た目 (#3639) は原本の根の `cycle` の欄 (`cycleLook`) が持ち、手順の長さは箱の `time` (`clockTime`) が持つ。
 * 骨組みは、時計の文字盤の見た目の図の箱に長さを求め、帯の見た目の図の箱には全てに書くかどれにも書かないかを求め、ほかの図の箱の長さを断る
 */
import type { BlockShape } from "../block";
import { CYCLE_SHAPES, CYCLE_TURNS, TIME_UNITS } from "./limits";

export const shape: BlockShape = {
  definitions: {
    cycleLook: {
      description:
        "回り続ける図の見た目。clock は手順を 12 時から書いた順に、長さを 1 周の長さ (長さの合計) で割った角度の弧で置く時計の文字盤。band は手順を左から右へ等しい幅の山形で並べ、回ごとに帯を積む輪を開いた帯",
      type: "object",
      additionalProperties: false,
      properties: {
        shape: { description: "回り続ける図の見た目の名前", enum: [...CYCLE_SHAPES] },
        turn: { description: "文字盤の回る向き。left は左回りにし、書かない図は右回りにする", enum: [...CYCLE_TURNS] },
      },
      // 回る向きは時計の文字盤の見た目だけが持つ
      if: { not: { required: ["shape"], properties: { shape: { const: CYCLE_SHAPES[0] } } } },
      then: { properties: { turn: { $ref: "#/definitions/absent" } } },
    },
    clockTime: {
      description: `時計の文字盤の見た目と輪を開いた帯の見た目の手順の長さ。0 でない数と単位 (${Object.keys(TIME_UNITS).join(" / ")}) の組で書く (25min など)`,
      type: "string",
      pattern: `^(?=[0-9.]*[1-9])[0-9]+(\\.[0-9]+)?(${Object.keys(TIME_UNITS).join("|")})$`,
    },
  },
};
