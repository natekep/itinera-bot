import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Compass,
  Car,
  Heart,
  Utensils,
  Accessibility,
  Wallet,
  Plane,
  Loader2,
  X,
  Plus,
  Armchair,
  Footprints,
  Volume2,
  Dog,
  Captions,
} from "lucide-react";

const INTEREST_SUGGESTIONS = [
  "Museums",
  "Beaches",
  "Food Tours",
  "Hiking",
  "Historical Sites",
  "Nightlife",
  "Shopping",
  "Photography",
  "Art Galleries",
  "Local Markets",
  "Adventure Sports",
  "Wine Tasting",
];

export default function UserOnboarding() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [preferredPace, setPreferredPace] = useState("");
  const [preferredTravelMode, setPreferredTravelMode] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [accessibility, setAccessibility] = useState({
    wheelchair_access: false,
    step_free: false,
    quiet_spaces: false,
    service_animal: false,
    captions: false,
  });
  const [budgetRange, setBudgetRange] = useState("");

  const accessibilityOptions = [
    { key: "wheelchair_access", label: "Wheelchair Access", icon: <Armchair className="h-4 w-4 text-[#4b8ce8]" /> },
    { key: "step_free", label: "Step-Free Routes", icon: <Footprints className="h-4 w-4 text-[#4b8ce8]" /> },
    { key: "quiet_spaces", label: "Quiet Spaces", icon: <Volume2 className="h-4 w-4 text-[#4b8ce8]" /> },
    { key: "service_animal", label: "Service Animal Friendly", icon: <Dog className="h-4 w-4 text-[#4b8ce8]" /> },
    { key: "captions", label: "Audio/Visual Captions", icon: <Captions className="h-4 w-4 text-[#4b8ce8]" /> },
  ];

  const isFormValid =
    preferredPace &&
    gender &&
    preferredTravelMode &&
    budgetRange &&
    ageRange &&
    homeLocation;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests((prev) => [...prev, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests((prev) => prev.filter((i) => i !== interest));
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      navigate("/login");
      setIsSubmitting(false);
      return;
    }

    // Turn accessibility object into comma-separated list
    const selectedAccessibility = Object.keys(accessibility)
      .filter((key) => (accessibility as any)[key])
      .map((key) => key.replace("_", " "))
      .join(", ");

    // Convert interests array to comma-separated string
    const interestsString = selectedInterests.join(", ");

    const { error } = await supabase.from("user_onboarding").insert([
      {
        user_id: user.id,
        preferred_pace: preferredPace,
        preferred_travel_mode: preferredTravelMode,
        interests: interestsString,
        dietary_restrictions: dietaryRestrictions,
        accessibility: selectedAccessibility,
        budget_range: budgetRange,
        age_range: ageRange,
        gender: gender,
        home_location: homeLocation,
      },
    ]);

    if (error) {
      console.error("Error inserting data:", error.message);
      alert("Something went wrong — please try again!");
    } else {
      alert("Onboarding info saved successfully!");
      navigate("/create");
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#81b4fa] to-[#4b8ce8] px-6 pb-20 pt-12 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Plane className="h-4 w-4" />
            Let's personalize your journey
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Welcome to Itinera
          </h1>
          <p className="text-lg text-white/90">
            Tell us about yourself so we can craft the perfect travel experience for you
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="relative z-10 mx-auto -mt-12 max-w-3xl px-4 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* About You Section */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#4b8ce8]" />
              <h2 className="text-xl font-semibold">About You</h2>
            </div>
            <p className="mb-6 text-sm text-gray-600">Basic info to personalize your experience</p>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Age Range</label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
                  >
                    <option value="">-- Select --</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55-64">55-64</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
                  >
                    <option value="">-- Select --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  <MapPin className="mb-1 inline h-4 w-4" /> Home Location
                </label>
                <input
                  type="text"
                  placeholder="Ex: Paris, Île-de-France, France or San Francisco, CA, USA"
                  value={homeLocation}
                  onChange={(e) => setHomeLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
                />
              </div>
            </div>
          </div>

          {/* Travel Style Section */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#4b8ce8]" />
              <h2 className="text-xl font-semibold">Travel Style</h2>
            </div>
            <p className="mb-6 text-sm text-gray-600">How do you like to explore?</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Preferred Pace</label>
                <select
                  value={preferredPace}
                  onChange={(e) => setPreferredPace(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
                >
                  <option value="">-- Select --</option>
                  <option value="Relaxed">🌴 Relaxed — Take it easy</option>
                  <option value="Balanced">⚖️ Balanced — Mix of both</option>
                  <option value="Fast-paced">🚀 Fast-paced — See it all</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  <Car className="mb-1 inline h-4 w-4" /> Travel Mode
                </label>
                <select
                  value={preferredTravelMode}
                  onChange={(e) => setPreferredTravelMode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
                >
                  <option value="">-- Select --</option>
                  <option value="Walking">🚶 Walking</option>
                  <option value="Public Transit">🚇 Public Transit</option>
                  <option value="Ride-share">🚗 Ride-share</option>
                  <option value="Rental Car">🚙 Rental Car</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#4b8ce8]" />
              <h2 className="text-xl font-semibold">Your Interests</h2>
            </div>
            <p className="mb-6 text-sm text-gray-600">What makes a trip memorable for you?</p>
            
            {/* Selected interests display */}
            {selectedInterests.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Selected interests:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 rounded-full bg-[#81b4fa]/20 px-3 py-1 text-sm font-medium text-[#4b8ce8]"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested interests bubbles */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Popular interests (click to add):</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_SUGGESTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedInterests.includes(interest)
                        ? "bg-[#4b8ce8] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom interest input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add your own interest..."
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomInterest();
                  }
                }}
                className="flex-1 rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
              />
              <button
                type="button"
                onClick={addCustomInterest}
                className="rounded-lg bg-[#4b8ce8] px-4 py-2 text-white hover:bg-[#3a7dd8] transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Dietary Section */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-[#4b8ce8]" />
              <h2 className="text-xl font-semibold">Dietary Preferences</h2>
            </div>
            <p className="mb-6 text-sm text-gray-600">Help us recommend the best dining spots</p>
            
            <input
              type="text"
              placeholder="e.g., Vegetarian, Gluten-Free, Halal"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
            />
            <p className="mt-2 text-sm text-gray-500">Separate multiple restrictions with commas. Leave blank if none.</p>
          </div>

          {/* Accessibility Section */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-[#4b8ce8]" />
              <h2 className="text-xl font-semibold">Accessibility Needs</h2>
            </div>
            <p className="mb-6 text-sm text-gray-600">Select all that apply</p>
            
            <div className="space-y-3">
              {accessibilityOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={accessibility[option.key as keyof typeof accessibility]}
                    onChange={(e) =>
                      setAccessibility((prev) => ({
                        ...prev,
                        [option.key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#4b8ce8] focus:ring-[#81b4fa]"
                  />
                  <span className="flex items-center gap-2">
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Section */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#4b8ce8]" />
              <h2 className="text-xl font-semibold">Budget</h2>
            </div>
            <p className="mb-6 text-sm text-gray-600">Your daily spending range</p>
            
            <select
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-[#4b8ce8] focus:outline-none focus:ring-2 focus:ring-[#81b4fa]/50"
            >
              <option value="">-- Select --</option>
              <option value="Budget">💰 Budget — Under $100/day</option>
              <option value="Mid-Range">💵 Mid-Range — $100-$250/day</option>
              <option value="Luxury">💎 Luxury — Over $250/day</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`group relative w-full overflow-hidden rounded-xl px-8 py-4 font-semibold text-white transition-all duration-300 ${
                !isFormValid || isSubmitting
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-gradient-to-r from-[#81b4fa] to-[#4b8ce8] hover:shadow-lg hover:scale-[1.02]"
              }`}
            >
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving your preferences...
                  </>
                ) : (
                  <>
                    Get Started!
                    <Plane className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
            {!isFormValid && (
              <p className="mt-3 text-center text-sm text-gray-500">
                Please fill in all required fields to continue
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}