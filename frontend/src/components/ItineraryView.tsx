import type { StructuredItinerary } from "../types/chat";

interface Props {
  itinerary: StructuredItinerary;
}

export default function ItineraryView({ itinerary }: Props) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        Your trip to {itinerary.destination}
      </h2>
      <p className="text-gray-600 mb-4">
        {itinerary.start_date} to {itinerary.end_date}
      </p>
      <div className="space-y-4">
        {itinerary.days && itinerary.days.map((day) => (
          <div key={day.day}>
            <h3 className="text-lg font-semibold text-gray-700">
              Day {day.day}: {day.title} ({day.date})
            </h3>
            <ul className="mt-2 space-y-2">
              {day.activities.map((activity, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-semibold text-gray-600 w-40">
                    {activity.start_time} - {activity.end_time}
                  </span>
                  <span className="text-gray-800">{activity.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}