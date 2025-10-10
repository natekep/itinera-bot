import { useState, useRef, useEffect } from "react";
import type { Message } from "../types/chat";

export default function Nate() {
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

              <div style={styles.messageText}>{message.content}</div>

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
