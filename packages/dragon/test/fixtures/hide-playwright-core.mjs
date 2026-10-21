/**
 * `playwright-core` が入っていない場を作る (#3003)。
 *
 * 命令を走らせる node に `--import` で読ませると、`playwright-core` の解決だけを、入っていない時と同じ
 * `ERR_MODULE_NOT_FOUND` で断る。ほかの解決は今のまま通す。
 */
import { register } from "node:module";

const hook = `export async function resolve(specifier, context, next) {
  if (specifier === "playwright-core") {
    const error = new Error("Cannot find package 'playwright-core'");
    error.code = "ERR_MODULE_NOT_FOUND";
    throw error;
  }
  return next(specifier, context);
}`;

register(`data:text/javascript,${encodeURIComponent(hook)}`);
