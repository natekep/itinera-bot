import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
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
    <div className="h-15/20 grid content-end mx-[5%]">
      <h1 className="text-white xl:text-8xl text-6xl">
        Pack your bags, let's go <br></br>somewhere amazing
      </h1>
      <div className="flex justify-between mt-[2%]">
        <p className="text-white text-xl">
          Hidden gems, breathtaking views, unforgettable adventures-where
          <br></br>will you go next?
        </p>
        <Link to={session ? "/create" : "/signup"}>
          <button className="bg-white border border-white py-4 px-8 rounded-full hover:bg-transparent hover:text-white">
            Create your dream trip
          </button>
        </Link>
      </div>
    </div>
  );
}
