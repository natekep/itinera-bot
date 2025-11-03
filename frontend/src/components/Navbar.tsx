import ItineraLogo from "../assets/ItineraLogo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
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
            <li>
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
            </li>
          </ul>
        </div>
        <div className="">
          {session ? (
            <button
              onClick={async () => await supabase.auth.signOut()}
              className="bg-[#81b4fa] text-white px-3 py-2 rounded-lg hover:bg-gray-300"
            >
              Logout
            </button>
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
