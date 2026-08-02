import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";

/**
 * URL で渡された図を 1 件だけ描く頁 (cardene777/cdl#397)。
 *
 * 実ブラウザでしか測れない検査 (行の実寸が枠に収まっているか) に、 **見本に無い形** の図を
 * 通すために要る。 `renderOffsetX/Y` で動いた node や `wBind` で縮んだ node に行を持たせた図は
 * 見本 412 件に 1 つも無く、 実寸の経路がその形で一度も走っていなかった。
 *
 * 見本 (`topics/catalog/*.cdl.ts`) に足す案は採らない。 見本の総数と `visual-validate-sweep` の
 * 件数が動き、 別の回帰 gate を揺らすため。
 *
 * **開発時のみ登録する** (`main.tsx` が `import.meta.env.DEV` で分岐)。 公開ビルドには出ない。
 *
 * 使い方 = `/__render#d=<base64url の CdlDiagram JSON>`。
 */
export function RenderProbePage(): React.ReactElement {
  // `useMemo` にしない。 hash は React の管理外なので、 依存に書けるものが無い
  // (React Compiler が「保てない memo」 として弾く)。 解く処理は base64 の decode 1 回で、
  // 描くたびに走っても問題にならない。
  const { diagram, error } = ((): { diagram: CdlDiagram | null; error: string | null } => {
    const raw = window.location.hash.replace(/^#d=/, "");
    if (!raw) return { diagram: null, error: "hash に #d=<base64url> が無い" };
    try {
      // base64url → base64 → UTF-8。 図の題名に日本語が入るので byte 列を経由する。
      const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      return { diagram: JSON.parse(json) as CdlDiagram, error: null };
    } catch (e) {
      return { diagram: null, error: `解けなかった: ${String(e)}` };
    }
  })();

  if (!diagram) return <p data-render-probe-error>{error}</p>;
  return (
    <div data-render-probe style={{ width: 1200 }}>
      <CdlDiagramView diagram={diagram} hideHeader hideMiniPhaseIndicator />
    </div>
  );
}
