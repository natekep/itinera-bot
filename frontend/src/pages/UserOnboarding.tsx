import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraLogo from "../assets/ItineraLogo.png";

export default function UserOnboarding() {
  const navigate = useNavigate();
  const [preferredPace, setPreferredPace] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [preferredTravelMode, setPreferredTravelMode] = useState("");
  const [interests, setInterests] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [accessibility, setAccessibility] = useState({
    wheelchair_access: false,
    step_free: false,
    quiet_spaces: false,
    service_animal: false,
    captions: false,
  });
  const [budgetRange, setBudgetRange] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // prevents page reload when form is submitted

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }

    // turn accessibility object into comma-separated list
    const selectedAccessibility = Object.keys(accessibility)
      .filter((key) => (accessibility as any)[key])
      .map((key) => key.replace("_", " "))
      .join(", ");

    const { error } = await supabase.from("user_onboarding").insert([
      {
        id: user.id,
        preferred_pace: preferredPace,
        travel_style: travelStyle,
        preferred_travel_mode: preferredTravelMode,
        interests: interests,
        dietary_restrictions: dietaryRestrictions,
        accessibility: selectedAccessibility,
        budget_range: budgetRange,
      },
    ]);

    if (error) {
      console.error("Error inserting data:", error.message);
      alert("Something went wrong — please try again!");
    } else {
      alert("Onboarding info saved successfully!");
      navigate("/");
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen mt-20 mb-20">
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 w-[80%] max-w-4xl mx-auto">
        <h1 className="text-3xl text-center font-semibold bg-gradient-to-r from-[#81b4fa] to-[#4b8ce8] bg-clip-text text-transparent">
          Welcome to Itinera
        </h1>

        <p className="text-gray-500 mt-2 text-center">
          Help us personalize your travel experience!
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full mt-5"
        >
          <label>Preferred Pace of Travel</label>
          <select
            id="preferredPace"
            value={preferredPace}
            onChange={(e) => setPreferredPace(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select --</option>
            <option value="Relaxed">Relaxed</option>
            <option value="Balanced">Balanced</option>
            <option value="Fast-paced">Fast-paced</option>
          </select>
          <label>Travel Style</label>
          <select
            id="travelStyle"
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select --</option>
            <option value="Solo">Solo</option>
            <option value="Couple">Couple</option>
            <option value="Friends">Friends</option>
            <option value="Family">Family</option>
            <option value="Business">Business</option>
          </select>
          <label>Preferred Mode of Travel</label>
          <select
            id="preferredTravelMode"
            value={preferredTravelMode}
            onChange={(e) => setPreferredTravelMode(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select --</option>
            <option value="Walking">Walking</option>
            <option value="Public Transit">Public Transit</option>
            <option value="Ride-share">Ride-share</option>
            <option value="Rental Car">Rental Car</option>
          </select>
          <label>Primary Interests</label>
          <input
            type="text"
            placeholder="e.g. Museums, Beaches, Food Tours"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={interests}
            onChange={(e) => {
              setInterests(e.target.value);
            }}
          />
          <p className="text-gray-500 text-sm">
            Separate multiple interests with commas
          </p>
          <label>Dietary Restrictions</label>
          <input
            type="text"
            placeholder="e.g. Vegetarian, Gluten-Free"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dietaryRestrictions}
            onChange={(e) => {
              setDietaryRestrictions(e.target.value);
            }}
          />
          <p className="text-gray-500 text-sm">
            Separate multiple restrictions with commas
          </p>
          <fieldset style={{ display: "grid", gap: 8 }}>
            <legend className="font-semibold mb-2">Accessibility</legend>
            {Object.keys(accessibility).map((key) => (
              <label key={key} className="flex items-center gap-2 capitalize">
                <input
                  type="checkbox"
                  checked={(accessibility as any)[key]}
                  onChange={(e) =>
                    setAccessibility((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-blue-500"
                />
                <span>{key.replace("_", " ")}</span>
              </label>
            ))}
          </fieldset>
          <label>Budget Range per Day</label>
          <select
            id="budgetRange"
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select --</option>
            <option value="Budget">Budget (Under 100$)</option>
            <option value="Mid-Range">Mid-Range (100$ - 250$)</option>
            <option value="Luxury">Luxury (Over $250) </option>
          </select>
          <button
            type="submit"
            disabled={
              !preferredPace ||
              !travelStyle ||
              !preferredTravelMode ||
              !budgetRange
            }
            className={`p-2 rounded-lg border-2 transition-colors duration-300
    ${
      !preferredPace || !travelStyle || !preferredTravelMode || !budgetRange
        ? "bg-gray-300 border-gray-300 text-white cursor-not-allowed"
        : "bg-[#81b4fa] border-[#81b4fa] text-white hover:bg-white hover:text-[#81b4fa]"
    }`}
          >
            Get Started!
          </button>
        </form>
      </div>
    </div>
  );
}
