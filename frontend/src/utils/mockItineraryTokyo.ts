import type { Itinerary } from "../types/itinerary";

const mockItineraryTokyo: Itinerary = {
  id: 2,
  userId: "mock-user",
  title: "Tokyo Adventure",
  destination: "Tokyo, Japan",

  startDate: "2025-09-18",
  endDate: "2025-09-20",
  guests: 1,
  totalCost: 610,

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  days: [
    // -----------------------
    // DAY 1 — Arrival / Shinjuku
    // -----------------------
    {
      date: "2025-09-18",
      activities: [
        {
          id: "t1",
          name: "Flight Arrival at Haneda",
          type: "transport",
          startTime: "2025-09-18T14:30:00.000Z",
          endTime: "2025-09-18T15:00:00.000Z",
          location: {
            name: "Haneda Airport (HND)",
            address: "Tokyo, Japan",
          },
          description: "Arrival and baggage pickup.",
          isFixed: true,
        },
        {
          id: "t2",
          name: "Train to Shinjuku",
          type: "transport",
          startTime: "2025-09-18T15:30:00.000Z",
          endTime: "2025-09-18T16:15:00.000Z",
          location: {
            name: "Shinjuku Station",
            address: "Shinjuku City, Tokyo",
          },
          description: "Keikyu Line → JR transfer to Shinjuku Station.",
          cost: 12,
          isFixed: false,
        },
        {
          id: "t3",
          name: "Check-in at Park Hyatt",
          type: "attraction",
          startTime: "2025-09-18T16:30:00.000Z",
          endTime: "2025-09-18T17:00:00.000Z",
          location: {
            name: "Park Hyatt Tokyo",
            address: "3-7-1-2 Nishi-Shinjuku, Tokyo",
          },
          description: "Drop bags and enjoy coffee at the lobby lounge.",
          cost: 25,
          isFixed: false,
        },
        {
          id: "t4",
          name: "Shinjuku Gyoen Garden Walk",
          type: "attraction",
          startTime: "2025-09-18T17:30:00.000Z",
          endTime: "2025-09-18T19:00:00.000Z",
          location: {
            name: "Shinjuku Gyoen National Garden",
            address: "11 Naito-machi, Shinjuku City, Tokyo",
          },
          description: "Sunset stroll through Tokyo’s most scenic garden.",
          cost: 6,
          isFixed: false,
        },
      ],
    },

    // -----------------------
    // DAY 2 — Shibuya / Harajuku
    // -----------------------
    {
      date: "2025-09-19",
      activities: [
        {
          id: "t5",
          name: "Breakfast at Blue Bottle Coffee",
          type: "restaurant",
          startTime: "2025-09-19T08:00:00.000Z",
          endTime: "2025-09-19T09:00:00.000Z",
          location: {
            name: "Blue Bottle Coffee Shibuya",
            address: "Shibuya City, Tokyo",
          },
          description: "Pour-over and pastries.",
          cost: 18,
          isFixed: false,
        },
        {
          id: "t6",
          name: "Shibuya Crossing + Center-Gai",
          type: "attraction",
          startTime: "2025-09-19T09:30:00.000Z",
          endTime: "2025-09-19T11:00:00.000Z",
          location: {
            name: "Shibuya Crossing",
            address: "Shibuya City, Tokyo",
          },
          description: "Take photos and explore nearby shops.",
          isFixed: false,
        },
        {
          id: "t7",
          name: "Meiji Shrine Visit",
          type: "attraction",
          startTime: "2025-09-19T11:30:00.000Z",
          endTime: "2025-09-19T13:00:00.000Z",
          location: {
            name: "Meiji Jingu",
            address: "1-1 Yoyogikamizonocho, Shibuya City, Tokyo",
          },
          cost: 0,
          description: "Forest walk + shrine courtyard.",
          isFixed: true,
        },
        {
          id: "t8",
          name: "Sushi Lunch",
          type: "restaurant",
          startTime: "2025-09-19T13:15:00.000Z",
          endTime: "2025-09-19T14:30:00.000Z",
          location: {
            name: "Sushi Midori",
            address: "Harajuku, Tokyo",
          },
          cost: 32,
          isFixed: false,
        },
        {
          id: "t9",
          name: "Evening Street Food Tour",
          type: "event",
          startTime: "2025-09-19T18:30:00.000Z",
          endTime: "2025-09-19T21:00:00.000Z",
          location: {
            name: "Omoide Yokocho",
            address: "Nishishinjuku, Tokyo",
          },
          cost: 75,
          description: "Local guide food crawl — yakitori, ramen, and sweets.",
          bookingUrl: "https://tokyostreetfood.tours",
          isFixed: true,
        },
      ],
    },

    // -----------------------
    // DAY 3 — Akihabara / Departure
    // -----------------------
    {
      date: "2025-09-20",
      activities: [
        {
          id: "t10",
          name: "Akihabara Electronics & Anime District",
          type: "attraction",
          startTime: "2025-09-20T10:00:00.000Z",
          endTime: "2025-09-20T12:30:00.000Z",
          location: {
            name: "Akihabara",
            address: "Sotokanda, Chiyoda City, Tokyo",
          },
          description: "Arcades, manga shops, and retro gaming floors.",
          isFixed: false,
        },
        {
          id: "t11",
          name: "Lunch at Ichiran Ramen",
          type: "restaurant",
          startTime: "2025-09-20T12:45:00.000Z",
          endTime: "2025-09-20T13:45:00.000Z",
          location: {
            name: "Ichiran Ramen",
            address: "Shinjuku City, Tokyo",
          },
          cost: 18,
          isFixed: false,
        },
        {
          id: "t12",
          name: "Train to Airport",
          type: "transport",
          startTime: "2025-09-20T14:30:00.000Z",
          endTime: "2025-09-20T15:15:00.000Z",
          location: {
            name: "Haneda Airport (HND)",
            address: "Tokyo, Japan",
          },
          cost: 12,
          isFixed: true,
        },
      ],
    },
  ],
};

export default mockItineraryTokyo;
