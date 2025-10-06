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
        interests: interests ? interests.split(",").map((s) => s.trim()) : undefined,
        accessibility_needs: accessibility,
      };
      const resp = await axios.post("http://127.0.0.1:8000/onboarding/profiles", payload);
      setCreatedId(resp.data.id);
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h2>User Onboarding</h2>
      <p>Fill in your travel preferences.</p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Preferred pace of travel
          <select value={preferredPace} onChange={(e) => setPreferredPace(e.target.value)}>
            <option value="">-- Select --</option>
            <option value="slow">Slow</option>
            <option value="moderate">Moderate</option>
            <option value="fast">Fast</option>
          </select>
        </label>

        <label>
          Travel style
          <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)}>
            <option value="">-- Select --</option>
            <option value="budget">Budget</option>
            <option value="mid-range">Mid-range</option>
            <option value="luxury">Luxury</option>
            <option value="cultural">Cultural</option>
            <option value="adventure">Adventure</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </label>

        <label>
          Dietary restrictions (comma-separated)
          <input
            type="text"
            placeholder="vegetarian, halal"
            value={dietaryRestrictions}
            onChange={(e) => setDietaryRestrictions(e.target.value)}
          />
        </label>

        <label>
          Interests (comma-separated)
          <input
            type="text"
            placeholder="museums, hiking"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </label>

        <fieldset style={{ display: "grid", gap: 8 }}>
          <legend>Accessibility</legend>
          {Object.keys(accessibility).map((key) => (
            <label key={key} style={{ textTransform: "capitalize" }}>
              <input
                type="checkbox"
                checked={(accessibility as any)[key]}
                onChange={(e) =>
                  setAccessibility((prev) => ({ ...prev, [key]: e.target.checked }))
                }
              />
              {key.replace("_", " ")}
            </label>
          ))}
        </fieldset>

        <button type="submit">Save Preferences</button>
      </form>

      {createdId && <p>Profile created with id: {createdId}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
