import { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle, Clock } from "lucide-react";

type ApprovalMap = Record<string, boolean | null>;

export default function ItineraryTabs({
  itinerary,
  onApprovalChange,
}: {
  itinerary: any; // can type later
  onApprovalChange: (approvals: ApprovalMap) => void;
}) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const days = itinerary.days;

  // Store user approvals: { "dayIndex-activityIndex": true/false/null }
  const [activityApproval, setActivityApproval] = useState<
    Record<string, boolean | null>
  >({});

  const handleApproval = (
    dayIndex: number,
    activityIndex: number,
    value: boolean
  ) => {
    const key = `${dayIndex}-${activityIndex}`;
    setActivityApproval((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Icon for time of day
  const timeIcon = (time: string) => {
    switch (time.toLowerCase()) {
      case "morning":
        return <Clock className="w-4 h-4 text-yellow-600 inline-block mr-1" />;
      case "afternoon":
        return <Clock className="w-4 h-4 text-orange-600 inline-block mr-1" />;
      case "evening":
        return <Clock className="w-4 h-4 text-purple-600 inline-block mr-1" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500 inline-block mr-1" />;
    }
  };

  useEffect(() => {
    onApprovalChange(activityApproval);
  }, [activityApproval]);

  return (
    <div>
      {/* Day Tabs */}
      <div className="flex space-x-3 mb-4 overflow-x-auto pb-2">
        {days.map((day: any, index: number) => (
          <button
            key={index}
            onClick={() => setActiveDayIndex(index)}
            className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap ${
              activeDayIndex === index
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {day.date}
          </button>
        ))}
      </div>

      {/* Activities */}
      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
        {days[activeDayIndex].activities.map((activity: any, idx: number) => {
          const key = `${activeDayIndex}-${idx}`;
          const approval = activityApproval[key] ?? null;

          return (
            <div
              key={idx}
              className="border border-gray-200 rounded-xl p-4 bg-gray-50"
            >
              {/* Time */}
              <p className="text-xs text-gray-500 mb-1 flex items-center">
                {timeIcon(activity.time)}
                {activity.time}
              </p>

              {/* Name with icon */}
              <p className="text-md font-semibold text-gray-900 flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-1" />
                {activity.name}
              </p>

              {/* Description */}
              <p className="text-sm text-gray-700 mt-1">
                {activity.description}
              </p>

              {/* Explanation */}
              <p className="text-xs text-gray-500 mt-2 italic">
                {activity.explanation}
              </p>

              {/* Approval Buttons */}
              <div className="flex items-center space-x-3 mt-3">
                <button
                  onClick={() => handleApproval(activeDayIndex, idx, true)}
                  className={`flex items-center px-3 py-1 rounded-full text-sm border ${
                    approval === true
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Yes
                </button>

                <button
                  onClick={() => handleApproval(activeDayIndex, idx, false)}
                  className={`flex items-center px-3 py-1 rounded-full text-sm border ${
                    approval === false
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  No
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
