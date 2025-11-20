import type { StructuredItinerary } from "../types/chat";

interface Props {
  itinerary: StructuredItinerary;
}

export default function ItineraryView({ itinerary }: Props) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        {itinerary.title || `Your trip to ${itinerary.destination}`}
      </h2>
      <p className="text-gray-600 mb-4">
        {itinerary.startDate} to {itinerary.endDate} • {itinerary.guests} Guests
      </p>
      <div className="space-y-6">
        {itinerary.days && itinerary.days.map((day, i) => (
          <div key={i} className="border-b pb-4 last:border-none">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Day {i + 1} ({day.date})
            </h3>
            <ul className="space-y-4">
              {day.activities.map((activity, index) => (
                <li key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                  <div className="flex-shrink-0 w-32 text-sm text-gray-500 font-medium">
                    {new Date(activity.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                    {new Date(activity.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{activity.name}</div>
                    <div className="text-sm text-gray-600 mb-1">{activity.description}</div>
                    {activity.location && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        📍 {activity.location.name} {activity.location.address ? `(${activity.location.address})` : ''}
                      </div>
                    )}
                    {activity.cost ? (
                      <div className="text-xs text-green-600 mt-1">
                        💰 Est. ${activity.cost}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}