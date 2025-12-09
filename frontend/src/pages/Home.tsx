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
    <>
      {/* Hero Section - The parent div for the indicator must be relative */}
      <div className="min-h-screen relative">
        <div className="min-h-screen flex flex-col justify-end pb-32 mx-[5%]">
          <h1 className="text-white xl:text-8xl text-6xl font-bold">
            Pack your bags, let's go <br />
            somewhere amazing
          </h1>
          <div className="flex justify-between mt-[2%]">
            <p className="text-white text-xl opacity-90">
              Hidden gems, breathtaking views, unforgettable adventures—where
              <br />
              will you go next?
            </p>
            <Link to={session ? "/create" : "/signup"}>
              <button className="bg-white text-black border border-white py-4 px-8 rounded-full hover:bg-transparent hover:text-white transition-all duration-300 font-medium">
                Create your dream trip
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section
        id="about-section"
        className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-20"
      >
        <div className="max-w-7xl mx-auto px-[5%]">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-5xl xl:text-6xl font-bold text-white mb-6">
              Meet Itinera
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto rounded-full"></div>
          </div>

          {/* Main Description */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 mb-16 border border-white/20">
            <p className="text-xl xl:text-2xl text-white/90 text-center leading-relaxed">
              Itinera is your AI-powered travel companion that creates
              personalized, real-time itineraries based on your budget,
              destination, and preferences. By integrating data on attractions,
              personal interests, and travel times, it crafts balanced daily
              schedules and explains each recommendation.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="group">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 h-full backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Conversational Flexibility
                </h3>
                <p className="text-white/70">
                  Chat naturally in your own words. No rigid forms or limited
                  options—just tell us what you want, and we'll understand.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-2xl p-8 h-full backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Smart Constraints
                </h3>
                <p className="text-white/70">
                  Respects your budget, time, and personal interests. Every
                  itinerary is tailored to work within your real-world
                  limitations.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-8 h-full backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Transparent Choices
                </h3>
                <p className="text-white/70">
                  Know exactly why each activity made the cut. We explain our
                  recommendations so you can travel with confidence.
                </p>
              </div>
            </div>
          </div>

          {/* How It's Different */}
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl p-10 backdrop-blur-md border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">
              Why Choose Itinera?
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-teal-400 text-xl">→</span>
                  <p className="text-white/80">
                    <span className="font-semibold text-white">
                      Real-time planning:
                    </span>{" "}
                    Generate same-day itineraries right after landing
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-teal-400 text-xl">→</span>
                  <p className="text-white/80">
                    <span className="font-semibold text-white">
                      Weather-aware:
                    </span>{" "}
                    Automatically adjusts outdoor activities based on forecasts
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-teal-400 text-xl">→</span>
                  <p className="text-white/80">
                    <span className="font-semibold text-white">
                      Local insights:
                    </span>{" "}
                    Discover hidden gems and unique experiences
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-purple-400 text-xl">→</span>
                  <p className="text-white/80">
                    <span className="font-semibold text-white">
                      Smart routing:
                    </span>{" "}
                    Optimized travel times between attractions
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-purple-400 text-xl">→</span>
                  <p className="text-white/80">
                    <span className="font-semibold text-white">
                      Multi-day trips:
                    </span>{" "}
                    Seamlessly plan entire vacations with balanced schedules
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-purple-400 text-xl">→</span>
                  <p className="text-white/80">
                    <span className="font-semibold text-white">
                      Budget-conscious:
                    </span>{" "}
                    Find amazing experiences within your price range
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-xl text-white/70 mb-8">
              Ready to transform the way you travel?
            </p>
            <Link to={session ? "/create" : "/signup"}>
              <button className="bg-gradient-to-r from-blue-500 to-teal-500 text-white py-4 px-10 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all duration-300">
                Start Your Adventure
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
