import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { BsAirplane } from "react-icons/bs";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
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
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">My Profile</h1>

          <div className="grid gap-6">
            {/* Account Info Card */}
            <div className="bg-white p-6 rounded-lg border-gray-200 border">
              <h2 className="text-2xl font-semibold">Account Information</h2>
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
            <div className="bg-white p-6 rounded-lg border-gray-200 border">
              <h2 className="text-2xl font-semibold">Travel Preferences</h2>
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
                        className="w-4 h-4 accent-blue-500"
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
                className="text-black-400 text-lg border border-gray-300 rounded-lg p-2 w-full"
                placeholder="Ex: Paris, le-de-France, France or San Francisco, CA, USA"
                value={homeLocation}
                onChange={(e) => {
                  setHomeLocation(e.target.value);
                  setIsDirty(true);
                }}
              />
              <p className="mt-4 text-gray-500 text-sm">Interests</p>
              <input
                className="text-black-400 text-lg border border-gray-300 rounded-lg p-2 w-full"
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
                  className={`mt-4 px-4 py-2 rounded-lg border-2 transition-colors duration-300 ${
                    isSaving
                      ? "bg-gray-300 border-gray-300 text-white cursor-not-allowed"
                      : "bg-[#81b4fa] border-[#81b4fa] text-white hover:bg-white hover:text-[#81b4fa]"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
              )}
            </div>

            {/* Itinerary History Card */}
            <div className="bg-white p-6 rounded-lg border-gray-200 border">
              <h2 className="text-2xl font-semibold">Saved Itineraries</h2>
              <span className="text-gray-500 text-sm">Your travel plans</span>
              <div className="flex items-center flex-col mt-6">
                <BsAirplane size={50} />
                <p className="mt-4 text-gray-500 text-sm mb-4">
                  You haven't created any itineraries yet.
                </p>
                <button className="bg-[#81b4fa] text-white px-3 py-2 rounded-lg hover:bg-gray-300">
                  Create Itinerary
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
