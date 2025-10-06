import ItineraLogo from "../assets/Itinera.png";
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
        <div className="text-white">
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
              <Link className="hover:text-gray-500" to="/explore">
                Explore
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/about">
                About Us
              </Link>
            </li>
          </ul>
        </div>
        <div className="">
          {session ? (
            <button
              onClick={async () => await supabase.auth.signOut()}
              className="bg-white text-black px-5 py-2 rounded-full hover:bg-gray-300"
            >
              Logout
            </button>
          ) : (
            <Link to="/signup">
              <button className="bg-white text-black px-5 py-2 rounded-full hover:bg-gray-300">
                Sign Up
              </button>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
