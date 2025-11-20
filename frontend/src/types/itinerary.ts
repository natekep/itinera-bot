// frontend/src/types/itinerary.ts

// ---------- Activity Location ----------
export interface ActivityLocation {
  name: string;
  address: string;

  // database-compatible fields
  latitude?: number | null;
  longitude?: number | null;

  // some APIs return coordinates
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// ---------- Activity ----------
export interface Activity {
  id?: string; // optional until saved to DB

  name: string;
  type: "event" | "restaurant" | "attraction" | "transport";

  startTime: string; // ISO string
  endTime: string; // ISO string

  location: ActivityLocation;

  description?: string | null;
  bookingUrl?: string | null;

  isFixed: boolean; // false = draggable
  cost?: number | null;
  notes?: string | null;
}

// ---------- Itinerary Day ----------
export interface ItineraryDay {
  id?: number; // Supabase PK
  date: string; // YYYY-MM-DD
  day_number?: number; // actual day index in DB
  notes?: string | null;

  activities: Activity[];
}

// ---------- Itinerary ----------
export interface Itinerary {
  id?: number; // Supabase PK
  userId?: string;

  title: string;
  destination: string;

  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD

  guests: number;

  days: ItineraryDay[];

  totalCost?: number | null;

  createdAt?: string;
  updatedAt?: string;
}
