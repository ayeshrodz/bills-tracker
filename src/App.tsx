// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { lazy, Suspense } from "react";

const BillsListPage = lazy(() => import("./pages/BillsListPage"));
const BillFormPage = lazy(() => import("./pages/BillFormPage"));

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-screen bg-slate-100 pt-16">
        <Suspense fallback={<p className="px-4 pt-4 text-slate-500">Loading…</p>}>
          <Routes>
            <Route path="/" element={<BillsListPage />} />
            <Route path="/add" element={<BillFormPage />} />
            <Route path="/edit/:id" element={<BillFormPage />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}
