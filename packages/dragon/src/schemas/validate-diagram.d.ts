/**
 * `scripts/build-validator.mjs` が `diagram.schema.json` から前もって書き出した検査の関数の型。
 * 中身は ajv が組み立てた関数で、頁で `eval` を使わずに動く。
 */
import type { ErrorObject } from "ajv";

declare const validate: {
  (input: unknown): boolean;
  errors?: ErrorObject[] | null;
};

export default validate;
