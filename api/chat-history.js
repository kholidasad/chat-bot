// Get chat history
import { getAllSessions, getSessionHistory, searchChats, updateSessionTitle, deleteSession } from './db.js';

export default async function handler(req, res) {
  const { method, query, body } = req;

  try {
    if (method === 'GET') {
      const { session_id, search } = query;

      if (session_id) {
        // Get specific session history
        const history = await getSessionHistory(session_id);
        return res.status(200).json(history);
      } else if (search) {
        // Search chats
        const results = await searchChats(search);
        return res.status(200).json(results);
      } else {
        // Get all sessions
        const sessions = await getAllSessions();
        return res.status(200).json(sessions);
      }
    } else if (method === 'PUT') {
      // Update session title (rename)
      const sessionId = req.url.split('/').pop();
      const { title } = body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      await updateSessionTitle(sessionId, title);
      return res.status(200).json({ message: 'Chat renamed successfully' });
    } else if (method === 'DELETE') {
      // Delete session
      const sessionId = req.url.split('/').pop();
      await deleteSession(sessionId);
      return res.status(200).json({ message: 'Chat deleted successfully' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Chat history error:', err);
    res.status(500).json({ error: err.message });
  }
}
