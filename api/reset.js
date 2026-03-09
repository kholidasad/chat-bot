// Reset/create new chat session
import { setCurrentSession } from './kv.js';
import { generateSessionId } from './utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newSessionId = generateSessionId();
    await setCurrentSession(newSessionId);

    res.status(200).json({
      message: 'Session reset',
      sessionId: newSessionId
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: err.message });
  }
}
