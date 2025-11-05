import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return; // Supabase not configured in dev

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-50/90 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-8 py-4">
        {/* Left: Gradient Itinera logo text */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-semibold bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent select-none">
            Itinera
          </span>
        </Link>

        {/* Right: Auth buttons */}
        <div className="flex items-center space-x-6">
          {session ? (
            <button
              onClick={async () => {
                if (!supabase) return;
                await supabase.auth.signOut();
              }}
              className="text-gray-800 font-medium hover:text-blue-600 transition"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-800 font-medium hover:text-blue-600 transition"
              >
                Login
              </Link>
              <Link to="/signup">
                <button className="bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold px-6 py-2 rounded-xl shadow-sm hover:opacity-90 transition">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
