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
        <Navbar />
        <main className="min-h-screen bg-slate-100 pt-16">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<BillsListPage />} />
              <Route path="/add" element={<BillFormPage />} />
              <Route path="/edit/:id" element={<BillFormPage />} />
            </Route>

            {/* Fallback: redirect unknown paths to home (could also go to /login) */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}
