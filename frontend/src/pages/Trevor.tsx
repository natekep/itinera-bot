import { useState, useRef, useEffect } from "react";
import type { Message } from "../types/chat";

export default function Trevor() {
  // messages: Array to store all conversation messages (user + AI)
  const [messages, setMessages] = useState<Message[]>([]);

  // input: Current text in the input field
  const [input, setInput] = useState("");

  // isLoading: True when waiting for AI response
  const [isLoading, setIsLoading] = useState(false);

  // error: Stores error message if request fails
  const [error, setError] = useState<string | null>(null);

  // messagesEndRef: Reference to scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  type ItineraryActivity = {
    time: string;
    attraction: string;
    weather?: string;
    description?: string;
  };

  type ItineraryDay = {
    day: number;
    activities: ItineraryActivity[];
  };

  type ItineraryPayload = {
    destination: string;
    duration: number;
    transportation?: string;
    itinerary: ItineraryDay[];
  };

  const tryParseItinerary = (content: string): ItineraryPayload | null => {
    try {
      const parsed = JSON.parse(content);
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.itinerary) &&
        typeof parsed.destination === "string" &&
        typeof parsed.duration === "number"
      ) {
        return parsed as ItineraryPayload;
      }
      return null;
    } catch {
      return null;
    }
  };

  const ItineraryView = ({ data }: { data: ItineraryPayload }) => {
    return (
      <div style={styles.itineraryWrapper}>
        <div style={styles.itineraryHeader}>
          <div style={styles.itineraryTitle}>{data.destination}</div>
          <div style={styles.itineraryBadges}>
            <span style={styles.badge}>{data.duration} days</span>
            {data.transportation ? (
              <span style={styles.badge}>{data.transportation}</span>
            ) : null}
          </div>
        </div>
        {data.itinerary.map((day) => (
          <div key={day.day} style={styles.daySection}>
            <div style={styles.dayTitle}>Day {day.day}</div>
            <div style={styles.activitiesGrid}>
              {day.activities.map((act, idx) => (
                <div key={idx} style={styles.card}>
                  <div style={styles.cardTime}>{act.time}</div>
                  <div style={styles.cardTitle}>{act.attraction}</div>
                  {act.weather ? (
                    <div style={styles.cardWeather}>{act.weather}</div>
                  ) : null}
                  {act.description ? (
                    <div style={styles.cardDesc}>{act.description}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const sendMessage = async () => {
    // Don't send if input is empty or already loading
    if (!input.trim() || isLoading) return;

    // Create user message object
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    // Add user message to chat immediately
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Make POST request to backend with all messages for context
      const response = await fetch("http://localhost:8000/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          weather: {
            latitude: 37.763283,
            longitude: -122.41286,
            generationtime_ms: 45.7655191421509,
            utc_offset_seconds: -18000,
            timezone: "America/Chicago",
            timezone_abbreviation: "GMT-5",
            elevation: 18,
            daily_units: {
              time: "iso8601",
              temperature_2m: "°C",
            },
            daily: {
              time: [
                "2025-10-22T00:00",
                "2025-10-23T00:00",
                "2025-10-24T00:00",
                "2025-10-25T00:00",
                "2025-10-26T00:00",
                "2025-10-27T00:00",
                "2025-10-28T00:00",
                "2025-10-29T00:00",
                "2025-10-30T00:00",
                "2025-10-31T00:00",
                "2025-11-01T00:00",
                "2025-11-02T00:00",
                "2025-11-03T00:00",
                "2025-11-04T00:00",
                "2025-11-05T00:00",
                "2025-11-06T00:00",
                "2025-11-07T00:00",
                "2025-11-08T00:00",
                "2025-11-09T00:00",
                "2025-11-10T00:00",
                "2025-11-11T00:00",
                "2025-11-12T00:00",
                "2025-11-13T00:00",
                "2025-11-14T00:00",
                "2025-11-15T00:00",
              ],
              temperature_per_day: [
                14.1, 14.2, 13.5, 13.7, 13.3, 13.3, 13, 13.4, 13.6, 13.9, 14.4,
                15.5, 16.1, 16.2, 16.9, 17.2, 16.8, 16.6, 16.8, 16.1, 15.2,
                14.3, 13.7, 13.3,
              ],
            },
          },
          events: [
            {
              name: "Phoenix Suns vs. Sacramento Kings",
              type: "event",
              id: "vvG1IZ4tUwXqjT",
              url: "https://www.ticketmaster.com/phoenix-suns-vs-sacramento-kings-phoenix-arizona-10-22-2025/event/19006121A7BA0A67",
              date: "2025-10-22T19:00:00-07:00",
              timezone: "America/Phoenix",
              venue: {
                name: "Footprint Center",
                city: "Phoenix",
                state: "Arizona",
                country: "US",
              },
              image:
                "https://s1.ticketm.net/dam/a/2b7/7f5026a3-376c-4f9d-8979-fd74fcd582b7_TABLET_LANDSCAPE_LARGE_16_9.jpg",
              genre: "Basketball",
              subGenre: "NBA",
              status: "onsale",
            },
            {
              name: "Letlive, Beauty School Dropout, Sludge Mother",
              type: "event",
              id: "1Ae0Zb0GkiGh-kQ",
              url: "https://www.ticketweb.com/event/letlive-beauty-school-dropout-sludge-august-hall-tickets/13692484?REFERRAL_ID=tmfeed",
              date: "2025-10-23T20:00:00-07:00",
              timezone: "America/Los_Angeles",
              venue: {
                name: "August Hall",
                city: "San Francisco",
                state: "California",
                country: "US",
              },
              image:
                "https://s1.ticketm.net/dam/a/b84/8974152a-2cc1-40fa-bcce-773a75533b84_TABLET_LANDSCAPE_16_9.jpg",
              genre: "Rock",
              subGenre: "Pop",
              status: "onsale",
            },
            {
              name: "Ludovico Einaudi: The Summer Portraits Tour",
              type: "event",
              id: "G5vYZb_T5Hssb",
              url: "https://www.ticketmaster.com/ludovico-einaudi-the-summer-portraits-tour-san-francisco-california-10-22-2025/event/1C00619FCBF31C58",
              date: "2025-10-22T20:00:00-07:00",
              timezone: "America/Los_Angeles",
              venue: {
                name: "San Francisco Symphony Hall",
                city: "San Francisco",
                state: "California",
                country: "US",
              },
              image:
                "https://s1.ticketm.net/dam/a/6fa/74e99c5d-a55f-4ed5-b884-d32cdb7da6fa_TABLET_LANDSCAPE_LARGE_16_9.jpg",
              genre: "Classical",
              subGenre: "Instrumental",
              status: "onsale",
            },
            {
              name: "Brett Young: Dance With You Tour 2025",
              type: "event",
              id: "Z7r9jZ1AdFZkM",
              url: "https://www.ticketmaster.com/brett-young-dance-with-you-tour-2025-tucson-arizona-10-22-2025/event/19006121A7BA0A68",
              date: "2025-10-22T19:30:00-07:00",
              timezone: "America/Phoenix",
              venue: {
                name: "AVA Amphitheater at Casino Del Sol",
                city: "Tucson",
                state: "Arizona",
                country: "US",
              },
              image:
                "https://s1.ticketm.net/dam/a/4e1/eb2f49b5-4e91-4902-8a5c-4321a8a6f4e1_TABLET_LANDSCAPE_LARGE_16_9.jpg",
              genre: "Country",
              subGenre: "Contemporary Country",
              status: "onsale",
            },
          ],
        }),
      });

      // Check if request was successful
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Parse JSON response from backend
      const data = await response.json();

      // Add AI's response to messages array
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Send message when Enter is pressed
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // RENDER UI (did this all thru chatgpt)
  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Itinera</h1>
        <p style={styles.headerSubtitle}>Your AI Travel Assistant</p>
      </div>

      {/* Messages Container - scrollable area */}
      <div style={styles.messagesContainer}>
        {/* Show welcome message when no messages exist */}
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>Welcome to Itinera</h2>
            <p style={styles.emptyText}>
              Start planning your next adventure. Ask me anything about travel!
            </p>
          </div>
        )}

        {/* Map through all messages and render them */}
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.messageWrapper,
              ...(message.role === "user"
                ? styles.userMessageWrapper
                : styles.assistantMessageWrapper),
            }}
          >
            <div style={styles.messageContent}>
              {/* Show icon for assistant messages */}
              {message.role === "assistant" && (
                <div style={styles.avatarAssistant}>🤖</div>
              )}

              {message.role === "assistant" ? (
                (() => {
                  const itinerary = tryParseItinerary(message.content);
                  if (itinerary) {
                    return (
                      <div style={{ flex: 1 }}>
                        <ItineraryView data={itinerary} />
                      </div>
                    );
                  }
                  return (
                    <div style={styles.messageText}>{message.content}</div>
                  );
                })()
              ) : (
                <div style={styles.messageText}>{message.content}</div>
              )}

              {/* Show icon for user messages */}
              {message.role === "user" && (
                <div style={styles.avatarUser}>👤</div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator while waiting for AI response */}
        {isLoading && (
          <div
            style={{
              ...styles.messageWrapper,
              ...styles.assistantMessageWrapper,
            }}
          >
            <div style={styles.messageContent}>
              <div style={styles.avatarAssistant}>🤖</div>
              <div style={styles.loadingDots}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div style={styles.error}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Invisible div used as scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section - fixed at bottom */}
      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message Itinera..."
            disabled={isLoading}
            style={styles.input}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              ...styles.button,
              ...(isLoading || !input.trim() ? styles.buttonDisabled : {}),
            }}
          >
            <span style={styles.buttonIcon}>↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// STYLES - ChatGPT Dark Mode Theme
const styles: { [key: string]: React.CSSProperties } = {
  // Main container - full viewport height
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",

    backgroundColor: "#212121",
    color: "#ececec",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Header styling
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid #2f2f2f",
    backgroundColor: "#171717",
  },

  headerTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#ececec",
  },

  headerSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#8e8e8e",
  },

  // Scrollable messages area
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
  },

  // Empty state when no messages
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    maxWidth: "600px",
    margin: "0 auto",
  },

  emptyIcon: {
    fontSize: "64px",
    marginBottom: "20px",
  },

  emptyTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#ececec",
    marginBottom: "12px",
  },

  emptyText: {
    fontSize: "16px",
    color: "#8e8e8e",
    lineHeight: "1.5",
  },

  // Message wrapper - full width container
  messageWrapper: {
    width: "100%",
    padding: "16px 24px",
  },

  // User message background
  userMessageWrapper: {
    backgroundColor: "transparent",
  },

  // Assistant message background (alternating)
  assistantMessageWrapper: {
    backgroundColor: "#2f2f2f",
  },

  // Message content - centered with max width
  messageContent: {
    maxWidth: "768px",
    margin: "0 auto",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },

  // Avatar for assistant
  avatarAssistant: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    backgroundColor: "#19c37d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  // Avatar for user
  avatarUser: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    backgroundColor: "#5436da",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  // Message text content
  messageText: {
    flex: 1,
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#ececec",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },

  itineraryWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  itineraryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itineraryTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#ececec",
  },
  itineraryBadges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 9999,
    backgroundColor: "#3a3a3a",
    color: "#cfcfcf",
    fontSize: "12px",
    border: "1px solid #4f4f4f",
  },
  daySection: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  dayTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#cfcfcf",
  },
  activitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 12,
  },
  card: {
    backgroundColor: "#1f1f1f",
    border: "1px solid #3a3a3a",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  cardTime: {
    color: "#9e9e9e",
    fontSize: "12px",
  },
  cardTitle: {
    color: "#ececec",
    fontSize: "15px",
    fontWeight: 600,
  },
  cardWeather: {
    color: "#bdbdbd",
    fontSize: "12px",
  },
  cardDesc: {
    color: "#cfcfcf",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  // Animated loading dots
  loadingDots: {
    display: "flex",
    gap: "4px",
    fontSize: "20px",
    color: "#8e8e8e",
    animation: "pulse 1.5s ease-in-out infinite",
  },

  // Error message styling
  error: {
    maxWidth: "768px",
    margin: "0 auto 16px",
    padding: "12px 16px",
    backgroundColor: "#2f1f1f",
    border: "1px solid #5f2f2f",
    borderRadius: "8px",
    color: "#ff6b6b",
    fontSize: "14px",
  },

  // Input container - fixed at bottom
  inputContainer: {
    padding: "16px 24px 24px",
    backgroundColor: "#212121",
    borderTop: "1px solid #2f2f2f",
  },

  // Input wrapper - centers and constrains width
  inputWrapper: {
    maxWidth: "768px",
    margin: "0 auto",
    position: "relative",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#2f2f2f",
    borderRadius: "24px",
    padding: "4px 4px 4px 20px",
    border: "1px solid #4f4f4f",
  },

  // Text input field
  input: {
    flex: 1,
    padding: "12px 8px",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    color: "#ececec",
    fontSize: "16px",
    fontFamily: "inherit",
  },

  // Send button
  button: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#ececec",
    color: "#171717",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
    transition: "background-color 0.2s",
  },

  // Disabled button state
  buttonDisabled: {
    backgroundColor: "#4f4f4f",
    cursor: "not-allowed",
    opacity: 0.5,
  },

  // Button icon (arrow)
  buttonIcon: {
    display: "block",
    lineHeight: 1,
  },
};
