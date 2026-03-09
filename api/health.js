// Health check endpoint
import { getCurrentSession } from './kv.js';
import { getDb } from './db.js';

export default async function handler(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Check KV store
    try {
      await getCurrentSession();
      health.services.kv = 'connected';
    } catch (err) {
      health.services.kv = 'disconnected';
      health.status = 'degraded';
    }

    // Check database
    try {
      const db = getDb();
      const result = await db.query('SELECT COUNT(DISTINCT session_id) as chat_count FROM chat_history');
      health.services.database = 'connected';
      health.services.total_chats = result.rows[0]?.chat_count || 0;
    } catch (err) {
      health.services.database = 'error';
      health.status = 'degraded';
    }

    res.status(200).json(health);
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
}
