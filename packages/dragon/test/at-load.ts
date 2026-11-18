/**
 * 検査の file を読み込む段で済ませる仕事 (#3738)。
 *
 * 1 件 10 秒の上限は件の中の仕事にだけ掛かり、file を読み込む段 (一番上の `await`) には掛からない (#3410)。
 * 1 回分の重い仕事 (図を描く、書き出す、頁を開く、子の process を起こす) を読み込む段で済ませ、件はその結果を読んで確かめる。
 * 仕事が落ちても読み込む段では投げず、結果を読んだ件だけが仕事の名前と落ちた理由を挙げて落ちる。同じ file のほかの件は回る。
 */

/** 読み込む段で済ませた仕事の結果。`get()` は結果を返すか、仕事の名前と落ちた理由を挙げて投げる */
export interface Loaded<T> {
  get(): T;
}

/** `work` を今済ませ、結果か落ちた理由を持つ物を返す。落ちても投げない */
export async function atLoad<T>(name: string, work: () => T | Promise<T>): Promise<Loaded<T>> {
  try {
    const value = await work();
    return { get: () => value };
  } catch (error) {
    const failure = new Error(`file を読み込む段の仕事「${name}」が落ちた: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    return {
      get: () => {
        throw failure;
      },
    };
  }
}
