import express from "express";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from "@aws-sdk/client-bedrock-agent-runtime";
import dotenv from "dotenv";
import { createClient } from "redis";
import sqlite3 from "sqlite3";
import natural from "natural";
const { WordTokenizer } = natural;

dotenv.config();

const app = express();
app.use(express.json());

app.use(express.static("public"));

// Redis client
const redisClient = createClient();
redisClient.on("error", (err) => console.log("Redis Client Error", err));
await redisClient.connect();

// SQLite client with better error handling
const db = new sqlite3.Database("./chat_history.db", (err) => {
  if (err) {
    console.error("❌ SQLite Connection Error:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to the chat history database.");
});

// Initialize database tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      title TEXT,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating chat_history table:", err);
    } else {
      console.log("✅ chat_history table ready");
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS token_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating token_usage table:", err);
    } else {
      console.log("✅ token_usage table ready");
    }
  });

  // Create index for better query performance
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_session_id ON chat_history(session_id)
  `, (err) => {
    if (err) {
      console.error("❌ Error creating index:", err);
    } else {
      console.log("✅ Database indexes ready");
    }
  });
});

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION
});

const AGENT_ID = process.env.AGENT_ID;
const AGENT_ALIAS_ID = process.env.AGENT_ALIAS_ID;

// Function to generate chat title from first message
const generateTitle = (message) => {
  const tokenizer = new WordTokenizer();
  const tokens = tokenizer.tokenize(message);

  // Take first 5-7 words for title
  const titleTokens = tokens.slice(0, 7);
  let title = titleTokens.join(" ");

  // Add ellipsis if message is longer
  if (tokens.length > 7) {
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
};

// Store active streams for stop functionality
const activeStreams = new Map();

// Reset session
app.post("/reset", async (req, res) => {
  const newSessionId = "single-user-session-" + Date.now();
  await redisClient.set("currentSessionId", newSessionId);
  res.json({ message: "Session reset", sessionId: newSessionId });
});

// Switch to existing session
app.post("/switch-session", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: "Session ID is required" });
    return;
  }

  try {
    await redisClient.set("currentSessionId", sessionId);
    res.json({ message: "Session switched", sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete chat
app.delete("/chat-history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM chat_history WHERE session_id = ?", [sessionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM token_usage WHERE session_id = ?", [sessionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename chat
app.put("/chat-history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { title } = req.body;
  try {
    await new Promise((resolve, reject) => {
      db.run("UPDATE chat_history SET title = ? WHERE session_id = ?", [title, sessionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    res.json({ message: "Chat renamed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop generation
app.post("/stop-generation/:streamId", (req, res) => {
  const { streamId } = req.params;
  const stream = activeStreams.get(streamId);
  if (stream) {
    stream.shouldStop = true;
    activeStreams.delete(streamId);
    res.json({ message: "Generation stopped" });
  } else {
    res.status(404).json({ error: "Stream not found" });
  }
});

// Streaming chat via SSE
app.get("/chat-stream", async (req, res) => {
  const message = req.query.message;
  const streamId = req.query.streamId || Date.now().toString();

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  let currentSessionId = await redisClient.get("currentSessionId");
  if (!currentSessionId) {
    currentSessionId = "single-user-session-" + Date.now();
    await redisClient.set("currentSessionId", currentSessionId);
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  // Register stream for stop functionality
  const streamControl = { shouldStop: false };
  activeStreams.set(streamId, streamControl);

  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId: currentSessionId,
    inputText: message
  });

  res.write(`event: session\ndata: ${JSON.stringify({ sessionId: currentSessionId, streamId })}\n\n`);

  try {
    const response = await client.send(command);

    let outputText = "";

    for await (const chunkEvent of response.completion) {
      // Check if generation should stop
      if (streamControl.shouldStop) {
        res.write(`event: stopped\ndata: Generation stopped\n\n`);
        break;
      }

      const chunk = chunkEvent.chunk;
      if (chunk?.bytes) {
        const text = new TextDecoder().decode(chunk.bytes);
        outputText += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Save chat history only if not stopped
    if (!streamControl.shouldStop && outputText) {
      // Check if this is the first message in the session
      db.get(
        "SELECT title FROM chat_history WHERE session_id = ? LIMIT 1",
        [currentSessionId],
        (err, row) => {
          let title;

          // If no existing messages, generate a title from the first message
          if (!row) {
            title = generateTitle(message);
          } else {
            // Use existing title for subsequent messages
            title = row.title;
          }

          // Insert the new message with the appropriate title
          db.run(
            "INSERT INTO chat_history (session_id, title, message, response) VALUES (?, ?, ?, ?)",
            [currentSessionId, title, message, outputText],
            (err) => {
              if (err) {
                console.error("Error saving chat history:", err);
              }
            }
          );
        }
      );

      // Mock token usage logging
      const tokens = outputText.length; // A simple approximation
      const cost = tokens * 0.00001; // A mock cost
      db.run(
        "INSERT INTO token_usage (session_id, tokens, cost) VALUES (?, ?, ?)",
        [currentSessionId, tokens, cost]
      );
    }

    res.write(`event: end\ndata: END\n\n`);
    res.end();

  } catch (err) {
    console.error("Stream error:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  } finally {
    activeStreams.delete(streamId);
  }
});

// Cost monitor page
app.get("/cost-monitor", (req, res) => {
  db.all("SELECT * FROM token_usage", (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(rows);
  });
});

// Chat history page
app.get("/chat-history", (req, res) => {
  const sessionId = req.query.session_id;
  const search = req.query.search;

  if (sessionId) {
    db.all("SELECT * FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC", [sessionId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } else if (search) {
    db.all(
      `SELECT DISTINCT session_id,
              (SELECT title FROM chat_history WHERE session_id = ch.session_id ORDER BY timestamp ASC LIMIT 1) as title,
              MAX(timestamp) as last_message
       FROM chat_history ch
       WHERE title LIKE ? OR message LIKE ? OR response LIKE ?
       GROUP BY session_id
       ORDER BY last_message DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(rows);
      }
    );
  } else {
    // Get list of all sessions with their first title and last message timestamp
    db.all(
      `SELECT session_id,
              (SELECT title FROM chat_history WHERE session_id = ch.session_id ORDER BY timestamp ASC LIMIT 1) as title,
              MAX(timestamp) as last_message
       FROM chat_history ch
       GROUP BY session_id
       ORDER BY last_message DESC`,
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(rows);
      }
    );
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check Redis
  try {
    await redisClient.ping();
    health.services.redis = "connected";
  } catch (err) {
    health.services.redis = "disconnected";
    health.status = "degraded";
  }

  // Check SQLite
  db.get("SELECT 1", (err) => {
    if (err) {
      health.services.sqlite = "error";
      health.status = "degraded";
    } else {
      health.services.sqlite = "connected";
    }

    // Check chat count
    db.get("SELECT COUNT(DISTINCT session_id) as chat_count FROM chat_history", (err, row) => {
      if (!err && row) {
        health.services.total_chats = row.chat_count;
      }

      res.json(health);
    });
  });
});

app.listen(3000, () => {
  console.log("🚀 Streaming Chatbot running at http://localhost:3000");
  console.log("📊 Health check: http://localhost:3000/health");
});
