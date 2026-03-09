// Switch to existing session
import { setCurrentSession } from './kv.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    await setCurrentSession(sessionId);
    res.status(200).json({
      message: 'Session switched',
      sessionId
    });
  } catch (err) {
    console.error('Switch session error:', err);
    res.status(500).json({ error: err.message });
  }
}
