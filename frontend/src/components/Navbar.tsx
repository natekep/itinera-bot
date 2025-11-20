import ItineraLogo from "../assets/ItineraLogo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { FiUser } from "react-icons/fi";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      console.log(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <nav className="flex justify-between items-center w-[92%] mx-auto">
        <div className="">
          <img className="w-25" src={ItineraLogo}></img>
        </div>
        <div className="text-black">
          <ul className=" flex items-center gap-[6vw]">
            <li>
              <Link className="hover:text-gray-500" to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/create">
                Create Itinerary
              </Link>
            </li>
            {/* <li>
              <Link className="hover:text-gray-500" to="/trevor">
                Trevor
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/iram">
                Iram
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/hongjie">
                Hongjie
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/nate">
                Nate
              </Link>
            </li> */}
          </ul>
        </div>
        <div className="">
          {session ? (
            <div className="relative text-left align-center justify-center flex">
              <span className="mr-5">
                Welcome, {session.user?.user_metadata.full_name}!
              </span>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="text-black rounded-full cursor-pointer"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <FiUser size={19} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-6 w-40 origin-top-right rounded-md bg-white shadow-lg focus:outline-none z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      role="menuitem"
                      onClick={async () => {
                        setMenuOpen(false);
                        await supabase.auth.signOut();
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/signup">
              <button className="bg-[#81b4fa] text-white px-3 py-2 rounded-lg hover:bg-gray-300">
                Sign Up
              </button>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
