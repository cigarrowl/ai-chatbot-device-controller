import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { handleUserMessage } from './runtime/loop.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const wss = new WebSocketServer({ port: Number(process.env.AGENT_WS_PORT) || 3001 });

wss.on('connection', async (ws, req) => {
  const protocols = (req.headers['sec-websocket-protocol'] as string || '').split(',').map((s) => s.trim());
  const token = protocols.find((p) => p.startsWith('token.'))?.replace('token.', '');
  if (!token) { ws.close(1008, 'Missing token'); return; }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) { ws.close(1008, 'Invalid token'); return; }

  const history: any[] = [];
  const pendingResolvers = new Map<string, (approved: boolean) => void>();

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      
      // NEW: Handle New Chat Reset
      if (msg.type === 'reset_chat') {
        history.length = 0; // Clears the AI's memory
        ws.send(JSON.stringify({ type: 'chat_reset' }));
        return;
      }

      if (msg.type === 'user_message') {
        // Passing the new file variables to loop.ts
        await handleUserMessage(
          ws, 
          user.id, 
          msg.payload.text, 
          history, 
          pendingResolvers,
          msg.payload.image,       // imageBase64
          msg.payload.fileBase64,  // fileBase64 (PDF, DOCX, etc.)
          msg.payload.fileName,    // fileName
          msg.payload.fileType     // fileType
        );
      }
      
      if (msg.type === 'approval_response') {
        const resolver = pendingResolvers.get(msg.payload.toolCallId);
        if (resolver) { 
          resolver(msg.payload.approved); 
          pendingResolvers.delete(msg.payload.toolCallId); 
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: String(err) } }));
    }
  });
});

console.log(`✅ Agent running on ws://localhost:${process.env.AGENT_WS_PORT} using FREE Groq API`);