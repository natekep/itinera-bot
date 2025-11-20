// frontend/src/services/saveItinerary.ts

import { supabase } from "../supabaseClient";
import type { Itinerary, ItineraryDay } from "../types/itinerary";

export default async function saveItinerary(
  itinerary: Itinerary,
  userId: string
) {
  console.log("=== Saving itinerary START ===");
  console.log("Incoming Itinerary Object:", itinerary);

  // -----------------------------
  // 1. INSERT INTO itineraries
  // -----------------------------
  const { data: itineraryRow, error: itineraryErr } = await supabase
    .from("itineraries")
    .insert({
      title: itinerary.title,
      destination: itinerary.destination,
      start_date: itinerary.startDate,
      end_date: itinerary.endDate,
      num_guests: itinerary.guests,  // <-- correct column
      user_id: userId,
    })
    .select()
    .single();

  if (itineraryErr) {
    console.error("Failed to save itinerary:", itineraryErr);
    throw itineraryErr;
  }

  const itineraryId = itineraryRow.id;
  console.log("Inserted itinerary ID:", itineraryId);

  // -----------------------------
  // 2. INSERT INTO itinerary_days
  // -----------------------------
  const dayInserts = itinerary.days.map((day: ItineraryDay, index: number) => ({
    itinerary_id: itineraryId,
    day_number: index + 1,
    date: day.date,
    notes: day.notes ?? null,
  }));

  const { data: dayRows, error: dayErr } = await supabase
    .from("itinerary_days")
    .insert(dayInserts)
    .select();

  if (dayErr) {
    console.error("Failed to save itinerary_days:", dayErr);
    throw dayErr;
  }

  console.log("Inserted itinerary days:", dayRows);

  const dayIdMap: Record<string, number> = {};
  dayRows.forEach((row) => (dayIdMap[row.date] = row.id));

  // -----------------------------
  // 3. INSERT INTO activities
  // -----------------------------
  const activityInserts: any[] = [];

  for (const day of itinerary.days) {
    const dayId = dayIdMap[day.date];
    if (!dayId) continue;

    for (const activity of day.activities) {
      activityInserts.push({
        day_id: Number(dayId),

        // MAIN FIELDS
        name: activity.name,
        category: activity.type, // <-- important fix (DB uses `category`)
        description: activity.description ?? null,

        start_time: activity.startTime,
        end_time: activity.endTime,

        cost: activity.cost ?? null,
        is_fixed: activity.isFixed ?? false,

        // LOCATION FIELDS
        location_name: activity.location.name ?? null,
        location_address: activity.location.address ?? null,

        latitude:
          activity.location.latitude ??
          activity.location.coordinates?.lat ??
          null,

        longitude:
          activity.location.longitude ??
          activity.location.coordinates?.lng ??
          null,

        notes: activity.notes ?? null,

        booking_url: activity.bookingUrl
          ? activity.bookingUrl.trim().replace(/"/g, "")
          : null,
      });
    }
  }

  console.log("Prepared activities:", activityInserts);

  if (activityInserts.length > 0) {
    const { error: actErr } = await supabase
      .from("activities")
      .insert(activityInserts);

    if (actErr) {
      console.error("Failed to save activities:", actErr);
      throw actErr;
    }
  }

  console.log("=== Saving itinerary COMPLETE ===");

  return {
    itineraryId,
    message: "Itinerary, days, and activities saved successfully.",
  };
}
