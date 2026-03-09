// Database utility for Vercel deployment
// Supports Vercel Postgres or any PostgreSQL database

import { createPool } from '@vercel/postgres';

let pool;

// Initialize database connection
export function getDb() {
  if (!pool) {
    // Vercel automatically provides POSTGRES_URL environment variable
    pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });
  }
  return pool;
}

// Initialize tables
export async function initDatabase() {
  const db = getDb();

  try {
    // Create chat_history table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        title TEXT,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create token_usage table
    await db.query(`
      CREATE TABLE IF NOT EXISTS token_usage (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        tokens INTEGER NOT NULL,
        cost REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_session_id ON chat_history(session_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON chat_history(timestamp DESC)
    `);

    console.log('✅ Database tables initialized');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

// Get all chat sessions
export async function getAllSessions() {
  const db = getDb();
  const result = await db.query(`
    SELECT session_id,
           (SELECT title FROM chat_history WHERE session_id = ch.session_id ORDER BY timestamp ASC LIMIT 1) as title,
           MAX(timestamp) as last_message
    FROM chat_history ch
    GROUP BY session_id
    ORDER BY last_message DESC
  `);
  return result.rows;
}

// Get chat history for a session
export async function getSessionHistory(sessionId) {
  const db = getDb();
  const result = await db.query(
    'SELECT * FROM chat_history WHERE session_id = $1 ORDER BY timestamp ASC',
    [sessionId]
  );
  return result.rows;
}

// Search chats
export async function searchChats(searchTerm) {
  const db = getDb();
  const result = await db.query(`
    SELECT DISTINCT session_id,
           (SELECT title FROM chat_history WHERE session_id = ch.session_id ORDER BY timestamp ASC LIMIT 1) as title,
           MAX(timestamp) as last_message
    FROM chat_history ch
    WHERE title ILIKE $1 OR message ILIKE $1 OR response ILIKE $1
    GROUP BY session_id
    ORDER BY last_message DESC
  `, [`%${searchTerm}%`]);
  return result.rows;
}

// Save chat message
export async function saveChatMessage(sessionId, title, message, response) {
  const db = getDb();
  await db.query(
    'INSERT INTO chat_history (session_id, title, message, response) VALUES ($1, $2, $3, $4)',
    [sessionId, title, message, response]
  );
}

// Get first title for a session
export async function getSessionTitle(sessionId) {
  const db = getDb();
  const result = await db.query(
    'SELECT title FROM chat_history WHERE session_id = $1 ORDER BY timestamp ASC LIMIT 1',
    [sessionId]
  );
  return result.rows[0]?.title || null;
}

// Update session title
export async function updateSessionTitle(sessionId, newTitle) {
  const db = getDb();
  await db.query(
    'UPDATE chat_history SET title = $1 WHERE session_id = $2',
    [newTitle, sessionId]
  );
}

// Delete session
export async function deleteSession(sessionId) {
  const db = getDb();
  await db.query('DELETE FROM chat_history WHERE session_id = $1', [sessionId]);
  await db.query('DELETE FROM token_usage WHERE session_id = $1', [sessionId]);
}

// Save token usage
export async function saveTokenUsage(sessionId, tokens, cost) {
  const db = getDb();
  await db.query(
    'INSERT INTO token_usage (session_id, tokens, cost) VALUES ($1, $2, $3)',
    [sessionId, tokens, cost]
  );
}

// Get all token usage
export async function getAllTokenUsage() {
  const db = getDb();
  const result = await db.query('SELECT * FROM token_usage ORDER BY timestamp DESC');
  return result.rows;
}
