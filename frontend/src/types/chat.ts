export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  user_id?: string | null;
  people?: string | null;
}

export interface Activity {
  start_time: string;
  end_time: string;
  description: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
}

export interface StructuredItinerary {
  destination: string;
  start_date: string;
  end_date: string;
  days: ItineraryDay[];
}
export interface ChatResponse {
  message: Message;
  conversation_id?: string;
  itinerary?: StructuredItinerary;
}
