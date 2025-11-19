import ItineraLogo from "../assets/ItineraLogo.png";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();

  const isHome = location.pathname === "/";

  useEffect(() => {
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

  const navBg = isHome ? "bg-transparent" : "bg-white";
  const buttonBg = isHome ? "bg-transparent" : "bg-[#81b4fa]";
  const navBorder = isHome ? "border-none" : "border-b border-gray-200";

  return (
    <div>
      <nav
        className={`flex justify-between items-center w-[100%] mx-auto ${navBg} ${navBorder}`}
      >
        <div className="ml-5">
          <Link to="/">
            <img className="w-25" src={ItineraLogo}></img>
          </Link>
        </div>
        <div className="mr-5">
          {session ? (
            <div className="">
              <Link to="/profile">
                <button
                  className={`${buttonBg} text-white px-5 py-2 mr-4 rounded-full border border-white hover:bg-white hover:text-black`}
                >
                  Profile
                </button>
              </Link>
              <button
                onClick={async () => await supabase.auth.signOut()}
                className={`${buttonBg} text-white px-3 py-2 rounded-full border border-white hover:bg-white hover:text-black`}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="">
              <Link to="/login">
                <button
                  className={`${buttonBg} text-white px-5 py-2 mr-4 rounded-full border border-white hover:bg-white hover:text-black`}
                >
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button
                  className={`${buttonBg} text-white px-3 py-2 rounded-full border border-white hover:bg-white hover:text-black`}
                >
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
