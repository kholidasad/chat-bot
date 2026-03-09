// Key-Value store utility for Vercel deployment
// Uses Vercel KV (Redis-compatible) or Upstash Redis

import { kv } from '@vercel/kv';

// Get current session ID
export async function getCurrentSession() {
  try {
    const sessionId = await kv.get('currentSessionId');
    return sessionId;
  } catch (err) {
    console.error('Error getting session from KV:', err);
    return null;
  }
}

// Set current session ID
export async function setCurrentSession(sessionId) {
  try {
    await kv.set('currentSessionId', sessionId);
    return sessionId;
  } catch (err) {
    console.error('Error setting session in KV:', err);
    throw err;
  }
}

// Store active stream info
export async function setActiveStream(streamId, data) {
  try {
    await kv.set(`stream:${streamId}`, data, { ex: 300 }); // Expire after 5 minutes
    return true;
  } catch (err) {
    console.error('Error storing stream:', err);
    return false;
  }
}

// Get active stream info
export async function getActiveStream(streamId) {
  try {
    const data = await kv.get(`stream:${streamId}`);
    return data;
  } catch (err) {
    console.error('Error getting stream:', err);
    return null;
  }
}

// Delete active stream
export async function deleteActiveStream(streamId) {
  try {
    await kv.del(`stream:${streamId}`);
    return true;
  } catch (err) {
    console.error('Error deleting stream:', err);
    return false;
  }
}

// Mark stream as stopped
export async function stopStream(streamId) {
  try {
    const stream = await getActiveStream(streamId);
    if (stream) {
      stream.shouldStop = true;
      await setActiveStream(streamId, stream);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error stopping stream:', err);
    return false;
  }
}
