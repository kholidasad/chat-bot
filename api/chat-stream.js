// Serverless function for streaming chat responses
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { getCurrentSession, setCurrentSession, setActiveStream, getActiveStream, deleteActiveStream } from './kv.js';
import { getSessionTitle, saveChatMessage, saveTokenUsage } from './db.js';
import { generateTitle, generateSessionId } from './utils.js';

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const AGENT_ID = process.env.AGENT_ID;
const AGENT_ALIAS_ID = process.env.AGENT_ALIAS_ID;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, streamId } = req.query;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Get or create session
  let currentSessionId = await getCurrentSession();
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
    await setCurrentSession(currentSessionId);
  }

  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  const currentStreamId = streamId || Date.now().toString();

  // Register stream
  await setActiveStream(currentStreamId, { shouldStop: false });

  // Send session info
  res.write(`event: session\ndata: ${JSON.stringify({ sessionId: currentSessionId, streamId: currentStreamId })}\n\n`);

  try {
    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: currentSessionId,
      inputText: message
    });

    const response = await client.send(command);
    let outputText = "";

    for await (const chunkEvent of response.completion) {
      // Check if stream should stop
      const streamStatus = await getActiveStream(currentStreamId);
      if (streamStatus?.shouldStop) {
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

    // Save to database
    if (outputText) {
      // Check if this is the first message
      const existingTitle = await getSessionTitle(currentSessionId);
      const title = existingTitle || generateTitle(message);

      await saveChatMessage(currentSessionId, title, message, outputText);

      // Save token usage
      const tokens = outputText.length;
      const cost = tokens * 0.00001;
      await saveTokenUsage(currentSessionId, tokens, cost);
    }

    res.write(`event: end\ndata: END\n\n`);
    res.end();

  } catch (err) {
    console.error('Stream error:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  } finally {
    await deleteActiveStream(currentStreamId);
  }
}
