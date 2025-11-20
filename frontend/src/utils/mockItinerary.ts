import type { Itinerary } from "../types/itinerary";

const mockItinerary: Itinerary = {
  id: 1,
  userId: "mock-user",
  title: "Barcelona Explorer Getaway",
  destination: "Barcelona, Spain",
  startDate: "2025-06-12",
  endDate: "2025-06-14",
  guests: 2,
  totalCost: 465,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  days: [
    // -----------------------
    // DAY 1
    // -----------------------
    {
      date: "2025-06-12",
      activities: [
        {
          id: "a1",
          name: "Arrival at Barcelona Airport",
          type: "transport",
          startTime: "2025-06-12T09:30:00.000Z",
          endTime: "2025-06-12T10:00:00.000Z",
          location: {
            name: "El Prat Airport (BCN)",
            address: "08820 El Prat de Llobregat, Barcelona",
          },
          description: "Landing and getting luggage.",
          isFixed: true,
        },
        {
          id: "a2",
          name: "Taxi to Hotel",
          type: "transport",
          startTime: "2025-06-12T10:15:00.000Z",
          endTime: "2025-06-12T10:45:00.000Z",
          location: {
            name: "Hotel Casa Fuster",
            address: "Passeig de Gràcia, 132, Barcelona",
          },
          description: "Taxi ride from BCN to the hotel.",
          cost: 45,
          isFixed: false,
        },
        {
          id: "a3",
          name: "Lunch at Brunch & Cake",
          type: "restaurant",
          startTime: "2025-06-12T12:30:00.000Z",
          endTime: "2025-06-12T13:45:00.000Z",
          location: {
            name: "Brunch & Cake",
            address: "C/ Enric Granados, 19, Barcelona",
          },
          description: "Trendy lunch spot with healthy options.",
          cost: 38,
          isFixed: false,
        },
        {
          id: "a4",
          name: "Visit Sagrada Família",
          type: "attraction",
          startTime: "2025-06-12T14:30:00.000Z",
          endTime: "2025-06-12T16:00:00.000Z",
          location: {
            name: "Basílica de la Sagrada Família",
            address: "C/ de Mallorca, 401, Barcelona",
          },
          description: "Explore Gaudí’s most iconic masterpiece.",
          bookingUrl: "https://sagradafamilia.org",
          cost: 32,
          isFixed: true,
        },
      ],
    },

    // -----------------------
    // DAY 2
    // -----------------------
    {
      date: "2025-06-13",
      activities: [
        {
          id: "a5",
          name: "Breakfast at Hotel",
          type: "restaurant",
          startTime: "2025-06-13T08:00:00.000Z",
          endTime: "2025-06-13T09:00:00.000Z",
          location: {
            name: "Hotel Casa Fuster",
            address: "Passeig de Gràcia, 132, Barcelona",
          },
          isFixed: false,
        },
        {
          id: "a6",
          name: "Park Güell Tour",
          type: "attraction",
          startTime: "2025-06-13T10:00:00.000Z",
          endTime: "2025-06-13T12:00:00.000Z",
          location: {
            name: "Park Güell",
            address: "Gràcia, Barcelona",
          },
          description: "Colorful mosaics and incredible views.",
          cost: 22,
          isFixed: true,
        },
        {
          id: "a7",
          name: "Tapas Lunch at Elsa y Fred",
          type: "restaurant",
          startTime: "2025-06-13T13:00:00.000Z",
          endTime: "2025-06-13T14:30:00.000Z",
          location: {
            name: "Elsa y Fred",
            address: "C/ del Rec Comtal, 11, Barcelona",
          },
          description: "Cozy tapas bar in El Born.",
          cost: 40,
          isFixed: false,
        },
        {
          id: "a8",
          name: "Evening Flamenco Show",
          type: "event",
          startTime: "2025-06-13T19:00:00.000Z",
          endTime: "2025-06-13T20:30:00.000Z",
          location: {
            name: "Palau Dalmases",
            address: "Carrer Montcada, 20, Barcelona",
          },
          description: "Live flamenco performance in a historic venue.",
          bookingUrl: "https://palaudalmases.com",
          cost: 42,
          isFixed: true,
        },
      ],
    },

    // -----------------------
    // DAY 3
    // -----------------------
    {
      date: "2025-06-14",
      activities: [
        {
          id: "a9",
          name: "Brunch at La Boqueria",
          type: "restaurant",
          startTime: "2025-06-14T10:30:00.000Z",
          endTime: "2025-06-14T11:45:00.000Z",
          location: {
            name: "Mercado de La Boqueria",
            address: "La Rambla, 91, Barcelona",
          },
          description: "Fresh market stalls, smoothies, and tapas.",
          cost: 28,
          isFixed: false,
        },
        {
          id: "a10",
          name: "Beach Time at Barceloneta",
          type: "attraction",
          startTime: "2025-06-14T12:30:00.000Z",
          endTime: "2025-06-14T15:00:00.000Z",
          location: {
            name: "Barceloneta Beach",
            address: "Passeig Marítim Barceloneta, Barcelona",
          },
          description: "Relaxing afternoon by the water.",
          isFixed: false,
        },
        {
          id: "a11",
          name: "Taxi to Airport",
          type: "transport",
          startTime: "2025-06-14T16:00:00.000Z",
          endTime: "2025-06-14T16:30:00.000Z",
          location: {
            name: "Barcelona–El Prat Airport",
            address: "08820 El Prat de Llobregat, Barcelona",
          },
          isFixed: true,
          cost: 48,
        },
      ],
    },
  ],
};

export default mockItinerary;
