import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
// 字は同梱する。 配信元から読むと向こうの状態で寸法が変わり、 文字が箱に収まるかを見る検査が
// 実行ごとに別の場所で落ちる (#1122)。 `wght.css` は可変幅の縦書きなし版で、 3 系統で 343KB。
// 太さ 4 段を個別に持つより小さく、 browser は `unicode-range` で必要な字集合だけ取る。
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./styles/globals.css";
import "./styles/cdl-theme.css";
import "./styles/catalog-new.css";
// 図の中に出る操作盤 (.cdl-ip-*) は分量が大きいので catalog-new.css から分けてある。
import "./styles/catalog-widgets.css";
import "./styles/header.css";
import "./styles/home.css";
import "./styles/docs-site.css";
import "./styles/editor.css";
import "./styles/syntax.css";
// 図に重ねるシーンの表示 (#1239)。 エディタ / カタログの分類 / 見本の詳細 が共有する
import "./styles/phase-chrome.css";
// compare.css は PresetDetailPage / ContributePage / ReleaseNotesPage の nm-* class 用、 各 lazy page 側で import。
import { SvgDefs } from "./components/SvgDefs";
import { ToastProvider } from "./components/Toast";
import { LocaleProvider } from "./lib/useLocale";
import { HomePage } from "./pages/HomePage";

// catalog / editor 系ページは catalog-items.ts 経由で 129 diagram を eager 構築するため、
// eager import すると home page 初期 bundle が 450KB+ 膨らむ。 React.lazy で
// route access 時のみ chunk load = 初期 home bundle 大幅圧縮 + user 指摘 "サイト重い" 対応 (CAR-1519 hotfix)。
const CatalogIndexPage = lazy(() => import("./pages/CatalogIndexPage").then((m) => ({ default: m.CatalogIndexPage })));
import { RenderProbePage } from "./pages/RenderProbePage";

const CategoryPage = lazy(() => import("./pages/CategoryPage").then((m) => ({ default: m.CategoryPage })));
const EditorPage = lazy(() => import("./pages/EditorPage").then((m) => ({ default: m.EditorPage })));
const DocsPage = lazy(() => import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })));
const PresetDetailPage = lazy(() => import("./pages/PresetDetailPage").then((m) => ({ default: m.PresetDetailPage })));
const ReleaseNotesPage = lazy(() => import("./pages/ReleaseNotesPage").then((m) => ({ default: m.ReleaseNotesPage })));
const ContributePage = lazy(() => import("./pages/ContributePage").then((m) => ({ default: m.ContributePage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

/** lazy chunk load 中の fallback UI (最小限、 skeleton 相当) */
function RouteLoading(): React.ReactElement {
  return (
    <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--v4-ink-dim, #5a6270)" }}>
      読み込み中…
    </div>
  );
}

// vite の base ("/" in dev, "/dragon/" in GH Pages build) を React Router basename に渡す。
// import.meta.env.BASE_URL は末尾 slash 付きだが react-router 側で許容する (`/dragon/` → `/dragon`)。
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <SvgDefs />
      <LocaleProvider>
        <ToastProvider>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogIndexPage />} />
              <Route path="/catalog/:slug" element={<CategoryPage />} />
              <Route path="/editor" element={<EditorPage />} />
              {/* 拡張子で最初の欄を決める経路 (`/editor/diagram.yml`)。 `resolveInitialTab` が
                  pathname の末尾を見るため、 ここを通さないと 404 に落ちて判定に届かない */}
              <Route path="/editor/:filename" element={<EditorPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/preset/:id" element={<PresetDetailPage />} />
              <Route path="/release-notes" element={<ReleaseNotesPage />} />
              <Route path="/contribute" element={<ContributePage />} />
              {/* 実ブラウザでしか測れない検査に、 見本に無い形の図を通すための頁
                  (cardene777/cdl#397)。 静的 import にしてあるので、 公開ビルドでは分岐ごと
                  落ちて chunk も出ない (`lazy` だと参照の無い chunk が残る)。 */}
              {import.meta.env.DEV && <Route path="/__render" element={<RenderProbePage />} />}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);
