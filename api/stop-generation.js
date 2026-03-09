// Stop ongoing generation
import { stopStream } from './kv.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const streamId = req.url.split('/').pop();

  try {
    const stopped = await stopStream(streamId);

    if (stopped) {
      res.status(200).json({ message: 'Generation stopped' });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (err) {
    console.error('Stop generation error:', err);
    res.status(500).json({ error: err.message });
  }
}
