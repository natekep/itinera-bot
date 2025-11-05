import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Home() {
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
    <div className="flex flex-col items-center justify-center h-[80vh] mt-[5%] bg-background">
      <h1 className="text-black text-7xl font-semibold">Plan Your Perfect</h1>
      <h1 className="text-blue-600 text-7xl font-semibold">Adventure</h1>
      <p className="text-gray-500 text-2xl font-normal text-center mx-[15%] mt-[1%]">
        Let AI craft personalized travel itineraries tailored to your interests,
        pace, and style. Your dream trip, intelligently planned.
      </p>
      <div className="flex flex-row mt-[3%] gap-8">
        {session ? (
          <>
            <Link to="/create">
              <button className="bg-blue-600 text-white text-xl font-medium px-10 py-4 rounded-xl shadow-sm hover:opacity-90 transition">
                Start Planning Free!
              </button>
            </Link>
            <Link to="/about">
              <button className="bg-white border border-gray-300 text-xl text-black font-medium px-10 py-4 rounded-xl shadow-sm hover:opacity-90 transition">
                About Us
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/signup">
              <button className="bg-blue-600 text-white text-xl font-medium px-10 py-4 rounded-xl shadow-sm hover:opacity-90 transition">
                Start Planning Free!
              </button>
            </Link>
            <Link to="/about">
              <button className="bg-white border border-gray-300 text-xl text-black font-medium px-10 py-4 rounded-xl shadow-sm hover:opacity-90 transition">
                About Us
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
