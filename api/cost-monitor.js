// Get cost/token usage data
import { getAllTokenUsage } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const usage = await getAllTokenUsage();
    res.status(200).json(usage);
  } catch (err) {
    console.error('Cost monitor error:', err);
    res.status(500).json({ error: err.message });
  }
}
