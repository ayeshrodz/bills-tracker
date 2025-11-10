// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BillsListPage from "./pages/BillsListPage";
import BillFormPage from "./pages/BillFormPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./contexts/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* OLD UI layout: navbar on top, light background, main does min-h-screen */}
        <Navbar />
        <main className="min-h-screen bg-slate-100 pt-16">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes (NEW logic / paths) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<BillsListPage />} />
              <Route path="/bills/new" element={<BillFormPage />} />
              <Route path="/bills/:id" element={<BillFormPage />} />
            </Route>

            {/* Optional: catch-all redirect */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}
