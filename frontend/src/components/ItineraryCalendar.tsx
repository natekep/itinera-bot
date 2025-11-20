// frontend/src/components/ItineraryCalendar.tsx

import React, { useMemo, useState, useCallback } from "react";
import {
    Calendar as BigCalendar,
    dateFnsLocalizer,
    type Event as RBCEvent,
    type View,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import type { Activity, Itinerary } from "../types/itinerary";
import { Button } from "./ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Maximize2,
    X,
    MapPin,
    Clock,
    Link,
    FileText,
} from "lucide-react";

// ---------- Localizer ----------
const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales,
});

// ---------- Types ----------
interface CalendarEvent extends RBCEvent {
    resource: Activity;
}
type BigCalendarEvent = CalendarEvent;

interface ItineraryCalendarProps {
    itinerary: Itinerary | null;
    onItineraryChange: (updated: Itinerary) => void;
    onSave?: () => void;
    onClear?: () => void;
}

// ---------- Colors & Icons ----------
const typeColors: Record<Activity["type"], string> = {
    event: "#8DB3E5", // Blue
    restaurant: "#EE2E31", // Red
    attraction: "#1D7874", // ocean
    transport: "#D4AA7D", // clay
};

const typeIcons: Record<Activity["type"], string> = {
    event: "🎟️",
    restaurant: "🍽️",
    attraction: "📍",
    transport: "🚕",
};

// ---------- Activity Details Panel ----------
interface ActivityDetailsPanelProps {
    activity: Activity | null;
    onClose: () => void;
}

const ActivityDetailsPanel: React.FC<ActivityDetailsPanelProps> = ({
    activity,
    onClose,
}) => {
    if (!activity) return null;

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "320px",
                height: "100%",
                backgroundColor: "white",
                borderLeft: "1px solid #e5e7eb",
                boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
                zIndex: 50,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "4px",
                            }}
                        >
                            <span style={{ fontSize: "20px" }}>{typeIcons[activity.type]}</span>
                            <h3
                                style={{
                                    fontWeight: 600,
                                    fontSize: "16px",
                                    margin: 0,
                                }}
                            >
                                {activity.name}
                            </h3>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "12px",
                            }}
                        >
                            <span
                                style={{
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    color: "white",
                                    fontWeight: 500,
                                    backgroundColor: typeColors[activity.type],
                                }}
                            >
                                {activity.type}
                            </span>
                            {activity.isFixed && (
                                <span
                                    style={{
                                        padding: "2px 8px",
                                        backgroundColor: "#fef3c7",
                                        color: "#92400e",
                                        borderRadius: "4px",
                                    }}
                                >
                                    🔒 Fixed
                                </span>
                            )}
                        </div>
                    </div>
                    <Button
                        style={{ height: "32px", width: "32px" }}
                        onClick={onClose}
                        variant="outline"
                    >
                        X
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Time */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        <Clock className="h-4 w-4 mt-1" style={{ color: "#6b7280" }} />
                        <div style={{ fontSize: "14px" }}>
                            <div style={{ fontWeight: 500 }}>
                                {format(new Date(activity.startTime), "EEEE, MMMM d")}
                            </div>
                            <div style={{ color: "#6b7280" }}>
                                {format(new Date(activity.startTime), "h:mm a")} –{" "}
                                {format(new Date(activity.endTime), "h:mm a")}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        <MapPin className="h-4 w-4 mt-1" style={{ color: "#6b7280" }} />
                        <div style={{ fontSize: "14px" }}>
                            <div style={{ fontWeight: 500 }}>{activity.location.name}</div>
                            <div style={{ color: "#6b7280" }}>
                                {activity.location.address}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {activity.description && (
                        <div style={{ display: "flex", gap: "12px" }}>
                            <FileText className="h-4 w-4 mt-1" style={{ color: "#6b7280" }} />
                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    margin: 0,
                                }}
                            >
                                {activity.description}
                            </p>
                        </div>
                    )}

                    {/* Cost */}
                    {activity.cost && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <span style={{ fontSize: "14px", fontWeight: 500 }}>Cost:</span>
                            <span style={{ fontSize: "14px" }}>
                                ${activity.cost.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    {activity.notes && (
                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: "#f3f4f6",
                                borderRadius: "6px",
                            }}
                        >
                            <p style={{ fontSize: "14px", margin: 0 }}>{activity.notes}</p>
                        </div>
                    )}

                    {/* Booking Link */}
                    {activity.bookingUrl && (
                        <Button
                            variant="outline"
                            style={{ width: "100%" }}
                            onClick={() => window.open(activity.bookingUrl!, "_blank")}
                        >
                            <Link className="h-4 w-4 mr-2" />
                            View Booking
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ---------- Custom Event Component ----------
interface EventComponentProps {
    event: CalendarEvent;
}

const EventComponent: React.FC<EventComponentProps> = ({ event }) => {
    const activity = event.resource as Activity;

    return (
        <div
            style={{
                height: "100%",
                padding: "2px 4px",
                color: "white",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 500,
                overflow: "hidden",
                cursor: "pointer",
            }}
        >
            <span style={{ flexShrink: 0 }}>{typeIcons[activity.type]}</span>
            <span
                style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                }}
            >
                {activity.name}
            </span>
            {activity.isFixed && (
                <span style={{ flexShrink: 0, fontSize: "10px" }}>🔒</span>
            )}
        </div>
    );
};

// ---------- Create DnD Calendar ----------
const DragAndDropCalendar = withDragAndDrop<BigCalendarEvent>(BigCalendar);

// ---------- Main Calendar Component ----------
export const ItineraryCalendar: React.FC<ItineraryCalendarProps> = ({
    itinerary,
    onItineraryChange,
    onSave,
    onClear,
}) => {
    const [currentDate, setCurrentDate] = useState<Date>(
        itinerary ? new Date(itinerary.startDate) : new Date()
    );
    React.useEffect(() => {
        if (itinerary?.startDate) {
            console.log("⏰ Itinerary changed — jumping to:", itinerary.startDate);
            setCurrentDate(new Date(itinerary.startDate));
        }
    }, [itinerary?.startDate]);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
        null
    );
    const [view, setView] = useState<View>("week");
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Convert itinerary to calendar events
    const events = useMemo(() => {
        if (!itinerary) return [];
        const result: CalendarEvent[] = [];

        for (const day of itinerary.days) {
            for (const activity of day.activities) {
                result.push({
                    title: activity.name,
                    start: new Date(activity.startTime),
                    end: new Date(activity.endTime),
                    allDay: false,
                    resource: activity,
                    
                });
            }
        }
        return result;
    }, [itinerary]);

    // Update activity times
    const updateActivityTimes = useCallback(
        (id: string, newStart: Date, newEnd: Date) => {
            if (!itinerary) return;

            const newDays = [...itinerary.days];
            const newDateStr = format(newStart, "yyyy-MM-dd");

            // Find and remove activity from old location
            let activityToMove: Activity | null = null;

            for (const day of newDays) {
                const activityIndex = day.activities.findIndex((a) => a.id === id);
                if (activityIndex !== -1) {
                    activityToMove = { ...day.activities[activityIndex] };
                    day.activities.splice(activityIndex, 1);
                    break;
                }
            }

            if (!activityToMove) return;

            // Update activity times
            activityToMove.startTime = newStart.toISOString();
            activityToMove.endTime = newEnd.toISOString();

            // Add to new day
            let targetDay = newDays.find((d) => d.date === newDateStr);
            if (!targetDay) {
                targetDay = { date: newDateStr, activities: [] };
                newDays.push(targetDay);
            }
            targetDay.activities.push(activityToMove);

            // Sort activities by time
            targetDay.activities.sort(
                (a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );

            // Sort days
            newDays.sort((a, b) => a.date.localeCompare(b.date));

            onItineraryChange({
                ...itinerary,
                days: newDays,
            });
        },
        [itinerary, onItineraryChange]
    );

    // Handle drag and drop
    const handleEventDrop = useCallback(
        (args: any) => {
            const { event, start, end } = args;
            const activity = event.resource as Activity;
            if (activity.isFixed) return;
            updateActivityTimes(activity.id!, start, end);
        },
        [updateActivityTimes]
    );

    const handleEventResize = useCallback(
        (args: any) => {
            const { event, start, end } = args;
            const activity = event.resource as Activity;
            if (activity.isFixed) return;
            updateActivityTimes(activity.id!, start, end);
        },
        [updateActivityTimes]
    );

    // Style events based on type
    const eventPropGetter = (event: CalendarEvent) => {
        const a = event.resource as Activity;
        return {
            style: {
                backgroundColor: typeColors[a.type],
                borderRadius: "8px",
                border: "none",
                cursor: a.isFixed ? "not-allowed" : "pointer",
                opacity: a.isFixed ? 0.75 : 1,
            },
        };
    };

    // Navigation handlers
    const navigateBack = () => {
        setCurrentDate((prev) => addDays(prev, -7));
    };

    const navigateNext = () => {
        setCurrentDate((prev) => addDays(prev, 7));
    };

    const navigateToStart = () => {
        if (itinerary) {
            setCurrentDate(new Date(itinerary.startDate));
        }
    };

    if (!itinerary) {
        return (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <p style={{ marginBottom: "8px" }}>No itinerary generated yet</p>
                    <p style={{ fontSize: "14px" }}>Use the chat to plan your activities</p>
                </div>
            </div>
        );
    }

    // Re-usable inner layout for normal + fullscreen
    const renderCalendarLayout = (fullscreen: boolean) => (
        <div
            style={{
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #e5e7eb",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "4px",
                        }}
                    >
                        Trip Calendar
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                        {itinerary.destination},{" "}
                        <span style={{ fontWeight: 400, color: "#6b7280" }}>
                            {format(new Date(itinerary.startDate), "MMM d")} –{" "}
                            {format(new Date(itinerary.endDate), "MMM d")}
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="outline"
                        onClick={navigateBack}
                        style={{ height: "32px" }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Prev</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={navigateToStart}
                        style={{ height: "32px" }}
                    >
                        Start
                    </Button>
                    {view === "day" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                {format(currentDate, "EEEE, MMM d")}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setView("week")}
                                style={{ height: "32px" }}
                            >
                                Back to Week
                            </Button>
                        </div>
                    )}


                    <Button
                        variant="outline"
                        onClick={navigateNext}
                        style={{ height: "32px" }}
                    >
                        <span className="hidden sm:inline mr-1">Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() =>
                            fullscreen ? setIsFullscreen(false) : setIsFullscreen(true)
                        }
                        style={{ height: "32px" }}
                    >
                        {fullscreen ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Calendar Container */}
            <div
                style={{
                    position: "relative",
                    flex: 1,
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
            >
                <DndProvider backend={HTML5Backend}>
                    <DragAndDropCalendar
                        localizer={localizer}
                        events={events}
                        date={currentDate}
                        view={view}
                        onView={(newView: View) => setView(newView)}
                        onNavigate={setCurrentDate}
                        toolbar={false}
                        startAccessor="start"
                        endAccessor="end"
                        titleAccessor="title"
                        eventPropGetter={eventPropGetter}
                        components={{
                            event: EventComponent as any,
                        }}
                        selectable
                        onSelectSlot={(slotInfo) => {
                            setView("day");
                            setCurrentDate(slotInfo.start);
                        }}

                        onEventDrop={handleEventDrop}
                        onEventResize={handleEventResize}
                        onSelectEvent={(event: any) =>
                            setSelectedActivity(event.resource as Activity)
                        }
                        draggableAccessor={(event: any) => !event.resource.isFixed}
                        resizable
                        style={{
                            height: "100%",
                            padding: "8px",
                        }}
                        min={new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth(),
                            currentDate.getDate(),
                            0,
                            0
                        )}
                        max={new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth(),
                            currentDate.getDate(),
                            23,
                            59
                        )}
                    />
                </DndProvider>

                {/* Activity Details Panel */}
                <ActivityDetailsPanel
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                />
            </div>

            {/* Footer with Legend and Actions */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e5e7eb",
                }}
            >
                <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                    {Object.entries(typeColors).map(([type, color]) => (
                        <div
                            key={type}
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            <div
                                style={{
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "3px",
                                    backgroundColor: color,
                                }}
                            />
                            <span
                                style={{ textTransform: "capitalize", color: "#6b7280" }}
                            >
                                {type}
                            </span>
                        </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🔒</span>
                        <span style={{ color: "#6b7280" }}>Fixed</span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    {onClear && (
                        <Button variant="outline" onClick={onClear}>
                            Clear
                        </Button>
                    )}
                    {onSave && <Button onClick={onSave}>Save</Button>}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Normal in-card layout */}
            {renderCalendarLayout(false)}

            {/* Fullscreen overlay */}
            {isFullscreen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 60,
                        backgroundColor: "rgba(15,23,42,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            width: "min(1100px, 96vw)",
                            height: "80vh",
                            padding: "16px",
                            boxShadow: "0 20px 40px rgba(15,23,42,0.35)",
                        }}
                    >
                        {renderCalendarLayout(true)}
                    </div>
                </div>
            )}
        </>
    );
};
