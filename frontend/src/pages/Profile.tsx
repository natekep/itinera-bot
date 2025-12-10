import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { BsAirplane } from "react-icons/bs";
import { User as UserIcon, MapPin } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [_, setPreferences] = useState({
    user_id: "",
    created_at: "",
    preferred_pace: "",
    travel_style: "",
    preferred_travel_mode: "",
    interests: "",
    dietary_restrictions: "",
    budget_range: "",
    accessibility: "",
    age_range: "",
    gender: "",
    home_location: "",
  });
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [accessibilityState, setAccessibilityState] = useState({
    wheelchair_access: false,
    step_free: false,
    quiet_spaces: false,
    service_animal: false,
    captions: false,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itineraries, setItineraries] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", session?.user.id)
        .then(({ data }) => {
          const pref = data?.[0];
          if (pref) {
            setPreferences(pref);
            setAgeRange(pref.age_range || "");
            setGender(pref.gender || "");
            setHomeLocation(pref.home_location || "");
            setInterests(pref.interests || "");
            setBudgetRange(pref.budget_range || "");
            const acc = (pref.accessibility || "")
              .toLowerCase()
              .split(",")
              .map((s: string) => s.trim());
            setAccessibilityState({
              wheelchair_access: acc.includes("wheelchair access"),
              step_free: acc.includes("step free"),
              quiet_spaces: acc.includes("quiet spaces"),
              service_animal: acc.includes("service animal"),
              captions: acc.includes("captions"),
            });
          }
        });
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  useEffect(() => {
    const fetchItineraries = async () => {
      const { data } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", user?.id);
      setItineraries(data || []);
    };
    if (user) {
      fetchItineraries();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const selectedAccessibility = Object.keys(accessibilityState)
      .filter((key) => (accessibilityState as any)[key])
      .map((key) => key.replace("_", " "))
      .join(", ");

    const { error } = await supabase
      .from("user_onboarding")
      .update({
        age_range: ageRange,
        gender: gender,
        home_location: homeLocation,
        interests: interests,
        budget_range: budgetRange,
        accessibility: selectedAccessibility,
      })
      .eq("user_id", user.id);

    if (!error) {
      setPreferences((prev) => ({
        ...prev,
        age_range: ageRange,
        gender: gender,
        home_location: homeLocation,
        interests: interests,
        budget_range: budgetRange,
        accessibility: selectedAccessibility,
      }));
      setIsDirty(false);
    } else {
      console.error("Error updating preferences:", error.message);
    }

    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-24 container mx-auto px-4">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b4d6ff] via-[#dceeff] to-white">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">My Profile</h1>

          <div className="grid gap-6">
            {/* Account Info Card */}
            <div
              className="
  bg-white/50 backdrop-blur-xl 
  p-6 rounded-2xl shadow-lg border border-white/30
"
            >
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <UserIcon className="h-6 w-6 text-[#4b8ce8]" /> Account
                Information
              </h2>

              <span className="text-gray-500 text-sm">
                Your account details
              </span>
              <p className="mt-4 text-gray-500 text-sm">Full Name</p>
              <p className="text-black-400 text-lg">
                {user?.user_metadata.full_name}
              </p>
              <p className="mt-4 text-gray-500 text-sm">Email</p>
              <p className="text-black-400 text-lg">{user?.email}</p>
            </div>

            {/* Travel Preferences Card */}
            <div
              className="
  bg-white/50 backdrop-blur-xl 
  p-6 rounded-2xl shadow-lg border border-white/30
"
            >
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <BsAirplane className="text-[#4b8ce8]" /> Travel Preferences
              </h2>

              <span className="text-gray-500 text-sm">
                Customize your travel experience
              </span>
              <p className="mt-4 text-gray-500 text-sm">Accessibility</p>
              <div className="mt-2 space-y-2">
                {[
                  "wheelchair_access",
                  "step_free",
                  "quiet_spaces",
                  "service_animal",
                  "captions",
                ].map((key) => {
                  const label = key.replace("_", " ");
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={(accessibilityState as any)[key]}
                        onChange={(e) => {
                          setAccessibilityState((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }));
                          setIsDirty(true);
                        }}
                        className="
  border border-[#c7d9f5] 
  rounded-lg p-2.5
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-4 text-gray-500 text-sm">Age Range</p>
              <select
                className="text-black-400 text-lg border border-gray-300 rounded-lg p-2 w-full"
                value={ageRange}
                onChange={(e) => {
                  setAgeRange(e.target.value);
                  setIsDirty(true);
                }}
              >
                <option value="">-- Select --</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55-64">55-64</option>
                <option value="65+">65+</option>
              </select>
              <p className="mt-4 text-gray-500 text-sm">Budget Range</p>
              <select
                className="text-black-400 text-lg border border-gray-300 rounded-lg p-2 w-full"
                value={budgetRange}
                onChange={(e) => {
                  setBudgetRange(e.target.value);
                  setIsDirty(true);
                }}
              >
                <option value="Budget">Budget (Under 100$)</option>
                <option value="Mid-Range">Mid-Range (100$ - 250$)</option>
                <option value="Luxury">Luxury (Over $250)</option>
              </select>
              <p className="mt-4 text-gray-500 text-sm">Gender</p>
              <select
                className="text-black-400 text-lg border border-gray-300 rounded-lg p-2 w-full"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setIsDirty(true);
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <p className="mt-4 text-gray-500 text-sm">Home Location</p>
              <input
                className="
  border border-[#c7d9f5] 
  rounded-lg p-2.5
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
                placeholder="Ex: Paris, le-de-France, France or San Francisco, CA, USA"
                value={homeLocation}
                onChange={(e) => {
                  setHomeLocation(e.target.value);
                  setIsDirty(true);
                }}
              />
              <p className="mt-4 text-gray-500 text-sm">Interests</p>
              <input
                className="
  border border-[#c7d9f5] 
  rounded-lg p-2.5
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
                placeholder="e.g. Museums, Beaches, Food Tours"
                value={interests}
                onChange={(e) => {
                  setInterests(e.target.value);
                  setIsDirty(true);
                }}
              />
              <p className="text-gray-500 text-sm mt-1">
                Separate multiple interests with commas
              </p>
              {isDirty && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`
    mt-4 px-6 py-3 rounded-xl font-semibold
    bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8]
    text-white shadow-md transition-all
    hover:shadow-xl hover:scale-[1.02]
    hover:from-[#81c2ff] hover:to-[#5d9bf0]
    active:scale-[0.97]
    ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
  `}
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
              )}
            </div>

            {/* Itinerary History Card */}
            <div
              className="
  bg-white/50 backdrop-blur-xl 
  p-6 rounded-2xl shadow-lg border border-white/30
"
            >
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-[#4b8ce8]" /> Saved Itineraries
              </h2>

              <span className="text-gray-500 text-sm">Your travel plans</span>
              {itineraries.length === 0 && (
                <div className="flex items-center flex-col mt-6">
                  <BsAirplane size={50} />
                  <p className="mt-4 text-gray-500 text-sm mb-4">
                    You haven't created any itineraries yet.
                  </p>
                  <a
                    href="/create"
                    className="bg-[#81b4fa] text-white px-3 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Create Itinerary
                  </a>
                </div>
              )}
              {itineraries.length !== 0 && (
                <div className="mt-6 grid grid-cols-1 gap-4 w-full">
                  {itineraries
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((itinerary) => (
                      <div
                        key={itinerary.id}
                        className="w-full border border-gray-200 rounded-lg p-4 flex flex-col gap-2 bg-white/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-500">Trip</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {itinerary.title ||
                                `Trip to ${itinerary.destination}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {itinerary.destination}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>
                              Created:{" "}
                              {itinerary.created_at
                                ? new Date(
                                    itinerary.created_at
                                  ).toLocaleDateString()
                                : "—"}
                            </p>
                            <p className="mt-1">
                              Guests: {itinerary.num_guests || 1}
                            </p>
                            <Link
                              to={`/edit/${itinerary.id}`}
                              className="
                              inline-block mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                              bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8] text-white
                              shadow-sm hover:shadow-md transition hover:scale-105
                            "
                            >
                              Edit Itinerary
                            </Link>
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-sm text-gray-700">
                          <div>
                            <span className="text-gray-500 text-xs">Dates</span>
                            <p className="text-sm">
                              {itinerary.start_date}
                              <span className="text-gray-400 mx-1">→</span>
                              {itinerary.end_date}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
