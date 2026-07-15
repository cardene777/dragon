import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./styles/globals.css";
import "./styles/cdl-theme.css";
import "./styles/catalog-new.css";
import "./styles/header.css";
import "./styles/home.css";
import "./styles/docs-site.css";
import "./styles/editor.css";
import "./styles/compare.css";
import { SvgDefs } from "./components/SvgDefs";
import { ToastProvider } from "./components/Toast";
import { LocaleProvider } from "./lib/useLocale";
import { HomePage } from "./pages/HomePage";

// catalog / editor 系ページは catalog-items.ts 経由で 129 diagram を eager 構築するため、
// eager import すると home page 初期 bundle が 450KB+ 膨らむ。 React.lazy で
// route access 時のみ chunk load = 初期 home bundle 大幅圧縮 + user 指摘 "サイト重い" 対応 (CAR-1519 hotfix)。
const CatalogIndexPage = lazy(() => import("./pages/CatalogIndexPage").then((m) => ({ default: m.CatalogIndexPage })));
const CategoryPage = lazy(() => import("./pages/CategoryPage").then((m) => ({ default: m.CategoryPage })));
const EditorPage = lazy(() => import("./pages/EditorPage").then((m) => ({ default: m.EditorPage })));
const DocsPage = lazy(() => import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })));
const ComparePage = lazy(() => import("./pages/ComparePage").then((m) => ({ default: m.ComparePage })));
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SvgDefs />
      <LocaleProvider>
        <ToastProvider>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogIndexPage />} />
              <Route path="/catalog/:slug" element={<CategoryPage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/preset/:id" element={<PresetDetailPage />} />
              <Route path="/release-notes" element={<ReleaseNotesPage />} />
              <Route path="/contribute" element={<ContributePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);
