// src/components/Navbar.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-slate-800 text-white px-6 py-3 fixed top-0 left-0 right-0 shadow-md z-40">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Bills Tracker
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <span className="hidden sm:inline text-slate-200 truncate max-w-[180px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="px-3 py-1.5 rounded-md bg-slate-700 text-xs font-medium hover:bg-slate-600"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
