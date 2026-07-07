import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./styles/globals.css";
import "./styles/cdl-theme.css";
import { SvgDefs } from "./components/SvgDefs";
import { ToastProvider } from "./components/Toast";
import { CatalogPage } from "./pages/CatalogPage";
import { EditorPage } from "./pages/EditorPage";
import { DocsPage } from "./pages/DocsPage";
import { ComparePage } from "./pages/ComparePage";
import { PresetDetailPage } from "./pages/PresetDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SvgDefs />
      <ToastProvider>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/preset/:id" element={<PresetDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
