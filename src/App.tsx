// src/App.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CategoriesProvider } from "./contexts/CategoriesProvider";
import { FullPageSpinner } from "./components/FullPageSpinner";
import { PerformanceHeadLinks } from "./components/PerformanceHeadLinks";

const BillsListPage = lazy(() => import("./pages/BillsListPage"));
const BillFormPage = lazy(() => import("./pages/BillFormPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

export default function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <Router>
          <PerformanceHeadLinks />
          <Navbar />
          <main className="min-h-screen bg-slate-100 pt-16">
            <Suspense fallback={<FullPageSpinner label="Loading view…" />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<BillsListPage />} />
                  <Route path="/bills/new" element={<BillFormPage />} />
                  <Route path="/bills/:id" element={<BillFormPage />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
        </Router>
      </CategoriesProvider>
    </AuthProvider>
  );
}
