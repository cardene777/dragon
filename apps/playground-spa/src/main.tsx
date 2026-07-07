import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./styles/globals.css";
import "./styles/cdl-theme.css";
import "./styles/catalog.css";
import "./styles/header.css";
import "./styles/home.css";
import "./styles/docs-site.css";
import "./styles/editor.css";
import { SvgDefs } from "./components/SvgDefs";
import { ToastProvider } from "./components/Toast";
import { HomePage } from "./pages/HomePage";
import { CatalogIndexPage } from "./pages/CatalogIndexPage";
import { CategoryPage } from "./pages/CategoryPage";
import { EditorPage } from "./pages/EditorPage";
import { DocsPage } from "./pages/DocsPage";
import { ComparePage } from "./pages/ComparePage";
import { PresetDetailPage } from "./pages/PresetDetailPage";
import { ReleaseNotesPage } from "./pages/ReleaseNotesPage";
import { ContributePage } from "./pages/ContributePage";
import { NotFoundPage } from "./pages/NotFoundPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SvgDefs />
      <ToastProvider>
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
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
