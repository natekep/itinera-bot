// frontend/src/services/listItineraryDetails.ts
import { supabase } from "../supabaseClient";

export async function listItineraryDetails(itineraryId: number) {
  console.log("====== FETCHING ITINERARY DETAILS ======");
  console.log("Requesting itinerary id:", itineraryId);

  // -------------------------------------------------------------
  // 1. Fetch the itinerary row
  // -------------------------------------------------------------
  const { data: itineraryRow, error: itinErr } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", itineraryId)
    .single();

  if (itinErr) {
    console.error("Error fetching itinerary:", itinErr);
    throw itinErr;
  }

  console.log("Itinerary row returned:", itineraryRow);

  // -------------------------------------------------------------
  // 2. Fetch all day rows
  // -------------------------------------------------------------
  const { data: rawDays, error: dayErr } = await supabase
    .from("itinerary_days")
    .select("*")
    .eq("itinerary_id", itineraryId)
    .order("day_number", { ascending: true });

  if (dayErr) {
    console.error("Error fetching itinerary_days:", dayErr);
    throw dayErr;
  }

  console.log("Days returned:", rawDays);

  const dayIds = rawDays.map((d) => d.id);
  console.log("Day IDs:", dayIds);

  // -------------------------------------------------------------
  // 3. Fetch ALL activities for these dayIds
  // -------------------------------------------------------------
  console.log("Fetching activities WHERE day_id IN", dayIds);

  const { data: rawActivities, error: actErr } = await supabase
    .from("activities")
    .select(
      `
      id,
      day_id,
      name,
      category,
      description,
      start_time,
      end_time,
      cost,
      is_fixed,
      location_name,
      location_address,
      latitude,
      longitude,
      notes,
      booking_url
    `
    )
    .in("day_id", dayIds);

  if (actErr) {
    console.error("Error fetching activities:", actErr);
    throw actErr;
  }

  console.log("RAW ACTIVITIES RETURNED FROM SUPABASE:", rawActivities);

  // -------------------------------------------------------------
  // 4. Group activities by day_id
  // -------------------------------------------------------------
  const activitiesByDay: Record<number, any[]> = {};
  dayIds.forEach((id) => (activitiesByDay[id] = []));

  rawActivities.forEach((a) => {
    console.log("Placing activity into day:", a.day_id, a);
    if (!activitiesByDay[a.day_id]) {
      activitiesByDay[a.day_id] = [];
    }
    activitiesByDay[a.day_id].push(a);
  });

  console.log("Grouped activities by day:", activitiesByDay);

  // -------------------------------------------------------------
  // 5. Construct final result
  // -------------------------------------------------------------
  const finalDays = rawDays.map((d) => {
    console.log(
      `Day ${d.id} (${d.date}) has activities:`,
      activitiesByDay[d.id]
    );

    return {
      ...d,
      activities: activitiesByDay[d.id] || [],
    };
  });

  const result = {
    itinerary: itineraryRow,
    days: finalDays,
  };

  console.log("====== FINAL RESULT OBJECT ======");
  console.log(result);

  return result;
}
