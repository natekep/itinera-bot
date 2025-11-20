// frontend/src/components/ui/ItinerarySidebar.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

type SidebarTrip = {
  id: number;
  title: string | null;
  destination: string | null;
  startDate: string;
  endDate: string;
};

interface Props {
  onSelect: (itineraryId: number) => void;
  selectedId?: number;
  /** change this value (e.g. ++key) to force a reload */
  refreshKey?: number;
}

const ItinerarySidebar: React.FC<Props> = ({
  onSelect,
  selectedId,
  refreshKey,
}) => {
  const [trips, setTrips] = useState<SidebarTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTrips([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("itineraries")
        .select("id, title, destination, start_date, end_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading itineraries:", error);
        setTrips([]);
      } else if (data) {
        const mapped: SidebarTrip[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          destination: row.destination,
          startDate: row.start_date,
          endDate: row.end_date,
        }));
        setTrips(mapped);
      }

      setLoading(false);
    }

    load();
  }, [refreshKey]);

  return (
    <aside
      style={{
        width: "260px",
        borderRight: "1px solid #e5e7eb",
        padding: "12px 12px 16px",
        overflowY: "auto",
        background: "#f9fafb",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Your Trips</h3>
        <p style={{ fontSize: "12px", color: "#6b7280" }}>
          Click a trip to load it into the editor
        </p>
      </div>

      {loading && <p style={{ fontSize: "13px" }}>Loading...</p>}

      {!loading && trips.length === 0 && (
        <p style={{ fontSize: "13px", color: "#6b7280" }}>
          No trips yet. Create one on the right and hit Save.
        </p>
      )}

      {trips.map((trip) => {
        const isSelected = trip.id === selectedId;

        return (
          <button
            key={trip.id}
            onClick={() => onSelect(trip.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "6px",
              cursor: "pointer",
              background: isSelected ? "#e0f2fe" : "#ffffff",
              border: isSelected
                ? "1px solid #38bdf8"
                : "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "14px",
                marginBottom: "2px",
              }}
            >
              {trip.title || "Untitled trip"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#4b5563",
                marginBottom: "2px",
              }}
            >
              {trip.destination}
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
              {trip.startDate} → {trip.endDate}
            </div>
          </button>
        );
      })}
    </aside>
  );
};

export default ItinerarySidebar;
