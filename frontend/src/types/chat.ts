export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  user_id?: string | null;
  people?: string | null;
}

export interface Location {
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Activity {
  id?: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: Location;
  description: string;
  bookingUrl?: string;
  isFixed?: boolean;
  cost?: number;
  notes?: string;
}

export interface ItineraryDay {
  date: string;
  activities: Activity[];
}

export interface StructuredItinerary {
  id?: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  guests: number;
  days: ItineraryDay[];
}
export interface ChatResponse {
  message: Message;
  conversation_id?: string;
  itinerary?: StructuredItinerary;
}
