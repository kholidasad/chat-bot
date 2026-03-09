// Utility functions

// Generate chat title from first message
export function generateTitle(message) {
  if (!message) return "New Chat";

  // Simple word tokenization
  const words = message.trim().split(/\s+/);

  // Take first 5-7 words for title
  const titleWords = words.slice(0, 7);
  let title = titleWords.join(" ");

  // Add ellipsis if message is longer
  if (words.length > 7) {
    title += "...";
  }

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Limit to 60 characters max
  if (title.length > 60) {
    title = title.substring(0, 60) + "...";
  }

  return title || "New Chat";
}

// Generate unique session ID
export function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
