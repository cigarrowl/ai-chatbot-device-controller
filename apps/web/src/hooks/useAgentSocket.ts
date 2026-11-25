import { useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAgentSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string; image?: string }[]>([]);
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // CHANGED LINE: Use environment variable, fallback to localhost for local dev
    const wsUrl = import.meta.env.VITE_AGENT_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl, ['chat', `token.${session.access_token}`]);
    
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'assistant_message') {
        setMessages((p) => [...p, { role: 'assistant', text: msg.payload.text }]);
        saveMessage('assistant', msg.payload.text);
      }
      if (msg.type === 'approval_request') {
        setPendingApproval(msg.payload);
      }
    };
    ws.onclose = () => { setConnected(false); wsRef.current = null; };
  }, []);

  const saveMessage = async (role: string, content: string) => {
    if (!currentChatId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('conversations').insert({
      user_id: session.user.id,
      chat_id: currentChatId,
      title: content.substring(0, 30) + (content.length > 30 ? '...' : ''), // Generate title
      role,
      content
    });
  };

  const sendMessage = useCallback((text: string, base64Image?: string, fileBase64?: string, fileName?: string, fileType?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Generate a new Chat ID if this is the first message
    let chatId = currentChatId;
    if (!chatId) {
      chatId = crypto.randomUUID();
      setCurrentChatId(chatId);
    }

    const displayText = text + (fileName ? `\n📎 [Attached: ${fileName}]` : '');
    setMessages((p) => [...p, { role: 'user', text: displayText, image: base64Image }]);
    saveMessage('user', displayText); // Save user message to DB
    
    wsRef.current.send(JSON.stringify({ 
      type: 'user_message', 
      payload: { text, image: base64Image, fileBase64, fileName, fileType } 
    }));
  }, [currentChatId]);

  // Resets chat for a new conversation
  const resetChat = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'reset_chat' }));
    }
    setMessages([]);
    setPendingApproval(null);
    setCurrentChatId(null);
  }, []);

  const loadChat = useCallback(async (chatId: string) => {
    setCurrentChatId(chatId);
    const { data } = await supabase.from('conversations').select('role, content').eq('chat_id', chatId).order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map(d => ({ role: d.role, text: d.content })));
    }
  }, []);

  const respondToApproval = useCallback((approved: boolean) => {
    if (!wsRef.current || !pendingApproval) return;
    wsRef.current.send(JSON.stringify({ type: 'approval_response', payload: { toolCallId: pendingApproval.toolCallId, approved } }));
    setPendingApproval(null);
  }, [pendingApproval]);

  return { connected, messages, sendMessage, pendingApproval, respondToApproval, connect, resetChat, currentChatId, loadChat };
}