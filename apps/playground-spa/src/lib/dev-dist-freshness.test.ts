import { describe, expect, it, vi } from "vitest";

import {
  BUILD_COMMAND,
  createDevDistFreshnessPlugin,
  ensureFreshDist,
} from "../../vite-dev-dist-freshness";
import { SKIP_ENV } from "../../../../test-support/dist-freshness-check";

const 古い問題 = "@cardenelabs/dragon の dist が src より古い";
const 未生成の問題 = "@cardenelabs/dragon を解決できない。 dist が未生成";

describe("開発 server を立てる前の dist 鮮度確認", () => {
  it("古ければ 1 回組み立て、組み立て後に問題が無ければ続ける", () => {
    const 判定 = vi.fn<() => string[]>().mockReturnValueOnce([古い問題]).mockReturnValueOnce([]);
    const 組み立て = vi.fn(() => ({ status: 0, error: undefined }));
    const 知らせる = vi.fn<(message: string) => void>();

    expect(() => ensureFreshDist({ env: {}, 判定, 組み立て, 知らせる })).not.toThrow();

    expect(判定).toHaveBeenCalledTimes(2);
    expect(組み立て).toHaveBeenCalledTimes(1);
    expect(知らせる).toHaveBeenCalledTimes(1);
    expect(知らせる).toHaveBeenCalledWith(
      `開発サーバーは記法を dist から読むため、立てる前に ${BUILD_COMMAND} で組み立て直す (#2856)。\n\n${古い問題}`,
    );
  });

  it("dist が無く解決できない時も組み立て、組み立て後に問題が無ければ続ける", () => {
    const 判定 = vi
      .fn<() => string[]>()
      .mockReturnValueOnce([未生成の問題])
      .mockReturnValueOnce([]);
    const 組み立て = vi.fn(() => ({ status: 0, error: undefined }));

    expect(() => ensureFreshDist({ env: {}, 判定, 組み立て, 知らせる: vi.fn() })).not.toThrow();

    expect(判定).toHaveBeenCalledTimes(2);
    expect(組み立て).toHaveBeenCalledTimes(1);
  });

  it("新しければ組み立てない", () => {
    const 判定 = vi.fn<() => string[]>().mockReturnValue([]);
    const 組み立て = vi.fn(() => ({ status: 0, error: undefined }));
    const 知らせる = vi.fn<(message: string) => void>();

    ensureFreshDist({ env: {}, 判定, 組み立て, 知らせる });

    expect(判定).toHaveBeenCalledTimes(1);
    expect(組み立て).toHaveBeenCalledTimes(0);
    expect(知らせる).toHaveBeenCalledTimes(0);
  });

  it("組み立てが失敗したら command、exit code、手で確かめる方法を含めて止める", () => {
    const 判定 = vi.fn<() => string[]>().mockReturnValue([古い問題]);
    const 組み立て = vi.fn(() => ({ status: 7, error: undefined }));

    expect(() => ensureFreshDist({ env: {}, 判定, 組み立て, 知らせる: vi.fn() })).toThrowError(
      new RegExp(`${BUILD_COMMAND}.*exit code.*7.*手で.*${BUILD_COMMAND}`, "s"),
    );

    expect(判定).toHaveBeenCalledTimes(1);
    expect(組み立て).toHaveBeenCalledTimes(1);
  });

  it("外す指定が 1 なら判定も組み立ても行わない", () => {
    const 判定 = vi.fn<() => string[]>().mockReturnValue([古い問題]);
    const 組み立て = vi.fn(() => ({ status: 0, error: undefined }));
    const 知らせる = vi.fn<(message: string) => void>();

    ensureFreshDist({ env: { [SKIP_ENV.dist]: "1" }, 判定, 組み立て, 知らせる });

    expect(判定).toHaveBeenCalledTimes(0);
    expect(組み立て).toHaveBeenCalledTimes(0);
    expect(知らせる).toHaveBeenCalledTimes(0);
  });

  it("組み立て後も問題が残れば止める", () => {
    const 判定 = vi.fn<() => string[]>().mockReturnValue([古い問題]);
    const 組み立て = vi.fn(() => ({ status: 0, error: undefined }));

    expect(() => ensureFreshDist({ env: {}, 判定, 組み立て, 知らせる: vi.fn() })).toThrowError(
      /組み立て後も.*dist.*古い/s,
    );

    expect(判定).toHaveBeenCalledTimes(2);
    expect(組み立て).toHaveBeenCalledTimes(1);
  });
});

describe("Vite plugin の適用範囲", () => {
  it("開発 server だけに適用し、preview と build を外す", () => {
    const plugin = createDevDistFreshnessPlugin();
    expect(typeof plugin.apply).toBe("function");
    expect(typeof plugin.config).toBe("function");
    if (typeof plugin.apply !== "function") throw new Error("plugin.apply が関数ではない");

    expect(plugin.apply({}, { command: "serve", mode: "development" })).toBe(true);
    expect(plugin.apply({}, { command: "serve", mode: "production", isPreview: true })).toBe(false);
    expect(plugin.apply({}, { command: "build", mode: "production" })).toBe(false);
  });
});
