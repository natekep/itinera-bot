import { useState } from "react";
import axios from "axios";

export default function Onboarding() {
  const [preferredPace, setPreferredPace] = useState<string>("");
  const [travelStyle, setTravelStyle] = useState<string>("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>("");
  const [interests, setInterests] = useState<string>("");
  const [accessibility, setAccessibility] = useState({
    wheelchair_access: false,
    step_free: false,
    quiet_spaces: false,
    service_animal: false,
    captions: false,
  });
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedId(null);
    try {
      const payload = {
        preferred_pace: preferredPace || undefined,
        travel_style: travelStyle || undefined,
        dietary_restrictions: dietaryRestrictions
          ? dietaryRestrictions.split(",").map((s) => s.trim())
          : undefined,
        interests: interests
          ? interests.split(",").map((s) => s.trim())
          : undefined,
        accessibility_needs: accessibility,
      };
      const resp = await axios.post(
        "http://127.0.0.1:8000/onboarding/profiles",
        payload
      );
      setCreatedId(resp.data.id);
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit");
    }
  }

  return (
    <div className="mt-20 bg-white rounded-xl shadow-lg p-8 w-[100%] max-w-md mx-auto">
      <div className="" style={{ maxWidth: 720, padding: 16 }}>
        <h2 className="text-xl">User Onboarding</h2>
        <form
          className="mt-5"
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 12 }}
        >
          <div className="flex justify-between items-center w-full">
            <label htmlFor="pace" className="font-semibold">
              Preferred pace of travel
            </label>
            <select
              id="pace"
              value={preferredPace}
              onChange={(e) => setPreferredPace(e.target.value)}
              className="border border-gray-400 rounded-md p-2 w-40"
            >
              <option value="">-- Select --</option>
              <option value="slow">Slow</option>
              <option value="moderate">Moderate</option>
              <option value="fast">Fast</option>
            </select>
          </div>

          <div className="flex justify-between items-center w-full">
            <label htmlFor="travelStyle" className="font-medium font-semibold">
              Travel style
            </label>
            <select
              id="travelStyle"
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="border border-gray-400 rounded-md p-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select --</option>
              <option value="budget">Budget</option>
              <option value="mid-range">Mid-range</option>
              <option value="luxury">Luxury</option>
              <option value="cultural">Cultural</option>
              <option value="adventure">Adventure</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>

          <label className="font-semibold">
            Dietary restrictions (comma-separated)
            <input
              type="text"
              placeholder="ex: vegetarian, halal"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              className="mt-1 border border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>

          <label className="font-semibold">
            Interests (comma-separated)
            <input
              type="text"
              placeholder="ex: museums, hiking"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="mt-1 border border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>

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

          <button
            className="bg-black text-white rounded-md p-2 mt-2"
            type="submit"
          >
            Save Preferences
          </button>
        </form>

        {createdId && <p>Profile created with id: {createdId}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
