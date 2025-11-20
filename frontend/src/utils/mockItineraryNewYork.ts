import type { Itinerary } from "../types/itinerary";

const mockItineraryNewYork: Itinerary = {
  id: 3,
  userId: "mock-user",
  title: "New York City Getaway",
  destination: "New York, USA",

  startDate: "2025-10-10",
  endDate: "2025-10-12",
  guests: 1,
  totalCost: 740,

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  days: [
    // -----------------------
    // DAY 1 — Arrival / Midtown
    // -----------------------
    {
      date: "2025-10-10",
      activities: [
        {
          id: "ny1",
          name: "Arrival at JFK Airport",
          type: "transport",
          startTime: "2025-10-10T13:00:00.000Z",
          endTime: "2025-10-10T13:30:00.000Z",
          location: {
            name: "JFK International Airport",
            address: "Queens, NY"
          },
          description: "Landing and baggage claim.",
          isFixed: true
        },
        {
          id: "ny2",
          name: "Taxi to Manhattan",
          type: "transport",
          startTime: "2025-10-10T13:45:00.000Z",
          endTime: "2025-10-10T14:30:00.000Z",
          location: {
            name: "Midtown Manhattan",
            address: "New York, NY"
          },
          description: "Yellow cab ride into the city.",
          cost: 65,
          isFixed: false
        },
        {
          id: "ny3",
          name: "Check-in at Marriott Marquis Times Square",
          type: "attraction",
          startTime: "2025-10-10T14:45:00.000Z",
          endTime: "2025-10-10T15:15:00.000Z",
          location: {
            name: "Marriott Marquis",
            address: "1535 Broadway, New York, NY"
          },
          description: "Drop bags and settle into the room.",
          cost: 20,
          isFixed: false
        },
        {
          id: "ny4",
          name: "Times Square Walk",
          type: "attraction",
          startTime: "2025-10-10T15:30:00.000Z",
          endTime: "2025-10-10T17:00:00.000Z",
          location: {
            name: "Times Square",
            address: "Broadway & 7th Ave, New York, NY"
          },
          description: "Explore shops, lights, and street performers.",
          cost: 0,
          isFixed: false
        }
      ]
    },

    // -----------------------
    // DAY 2 — Central Park / Museums / Broadway
    // -----------------------
    {
      date: "2025-10-11",
      activities: [
        {
          id: "ny5",
          name: "Breakfast at Sarabeth’s",
          type: "restaurant",
          startTime: "2025-10-11T08:30:00.000Z",
          endTime: "2025-10-11T09:30:00.000Z",
          location: {
            name: "Sarabeth’s Central Park South",
            address: "40 Central Park S, New York, NY"
          },
          description: "Brunch classics near Central Park.",
          cost: 28,
          isFixed: false
        },
        {
          id: "ny6",
          name: "Central Park Walk",
          type: "attraction",
          startTime: "2025-10-11T09:45:00.000Z",
          endTime: "2025-10-11T11:15:00.000Z",
          location: {
            name: "Central Park",
            address: "New York, NY"
          },
          description: "Walk through Bethesda Terrace & Bow Bridge.",
          isFixed: false
        },
        {
          id: "ny7",
          name: "Metropolitan Museum of Art",
          type: "attraction",
          startTime: "2025-10-11T11:30:00.000Z",
          endTime: "2025-10-11T13:30:00.000Z",
          location: {
            name: "The Met",
            address: "1000 5th Ave, New York, NY"
          },
          cost: 25,
          description: "Explore world-class galleries and exhibits.",
          isFixed: true
        },
        {
          id: "ny8",
          name: "Lunch at Shake Shack",
          type: "restaurant",
          startTime: "2025-10-11T13:45:00.000Z",
          endTime: "2025-10-11T14:30:00.000Z",
          location: {
            name: "Shake Shack",
            address: "366 Columbus Ave, New York, NY"
          },
          cost: 16,
          isFixed: false
        },
        {
          id: "ny9",
          name: "Broadway Show: Hamilton",
          type: "event",
          startTime: "2025-10-11T19:00:00.000Z",
          endTime: "2025-10-11T21:45:00.000Z",
          location: {
            name: "Richard Rodgers Theatre",
            address: "226 W 46th St, New York, NY"
          },
          cost: 180,
          description: "Evening performance of Hamilton.",
          bookingUrl: "https://broadway.com",
          isFixed: true
        }
      ]
    },

    // -----------------------
    // DAY 3 — Statue of Liberty / Lower Manhattan
    // -----------------------
    {
      date: "2025-10-12",
      activities: [
        {
          id: "ny10",
          name: "Ferry to Statue of Liberty",
          type: "transport",
          startTime: "2025-10-12T09:00:00.000Z",
          endTime: "2025-10-12T09:30:00.000Z",
          location: {
            name: "Battery Park Ferry Terminal",
            address: "New York, NY"
          },
          description: "Board ferry to Liberty Island.",
          cost: 24,
          isFixed: true
        },
        {
          id: "ny11",
          name: "Statue of Liberty + Ellis Island",
          type: "attraction",
          startTime: "2025-10-12T09:45:00.000Z",
          endTime: "2025-10-12T12:00:00.000Z",
          location: {
            name: "Liberty Island",
            address: "New York Harbor"
          },
          description: "Historic sites + museum tour.",
          isFixed: false
        },
        {
          id: "ny12",
          name: "Lunch at Eataly Downtown",
          type: "restaurant",
          startTime: "2025-10-12T12:30:00.000Z",
          endTime: "2025-10-12T13:30:00.000Z",
          location: {
            name: "Eataly NYC Downtown",
            address: "101 Liberty St, New York, NY"
          },
          cost: 35,
          isFixed: false
        },
        {
          id: "ny13",
          name: "Walk the Brooklyn Bridge",
          type: "attraction",
          startTime: "2025-10-12T14:00:00.000Z",
          endTime: "2025-10-12T15:00:00.000Z",
          location: {
            name: "Brooklyn Bridge",
            address: "New York, NY"
          },
          cost: 0,
          isFixed: false
        },
        {
          id: "ny14",
          name: "Subway to JFK",
          type: "transport",
          startTime: "2025-10-12T16:00:00.000Z",
          endTime: "2025-10-12T17:00:00.000Z",
          location: {
            name: "JFK International Airport",
            address: "Queens, NY"
          },
          cost: 11,
          isFixed: true
        }
      ]
    }
  ]
};

export default mockItineraryNewYork;
