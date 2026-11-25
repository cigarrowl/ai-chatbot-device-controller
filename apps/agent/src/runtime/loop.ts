import type WebSocket from 'ws';
import type OpenAI from 'openai';
import { PermissionGateway } from './permissionGateway.js';
import { chatCompletion } from '../ai/llmClient.js';
import { logAudit } from '../audit/logger.js';
import * as fileTools from '../tools/fileTools.js';
import { extractTextFromFile } from '../tools/documentParser.js'; // NEW IMPORT

const gateway = new PermissionGateway();

const SYSTEM_PROMPT = `You are a helpful AI assistant that can control the user's local device.
Use the provided tools when the user asks you to delete, read, list, or write files.
Explain briefly before calling a tool. For general questions or code generation, just answer normally.`;

export async function handleUserMessage(
  ws: WebSocket,
  userId: string,
  userText: string,
  history: OpenAI.ChatCompletionMessageParam[],
  pendingResolvers: Map<string, (approved: boolean) => void>,
  imageBase64?: string, 
  fileBase64?: string,     // NEW: Raw file data
  fileName?: string,       // NEW: File name
  fileType?: string        // NEW: File type (application/pdf, etc)
) {
  let userContent: any = userText;
  
  // 1. Parse the document if it exists (PDF, DOCX, etc.)
  if (fileBase64) {
    try {
      const extractedText = await extractTextFromFile(fileBase64, fileName || 'file', fileType || '');
      // Limit text to 15,000 chars to prevent Groq token limits
      const safeText = extractedText.substring(0, 15000); 
      userContent = `Here is the content of the attached file (${fileName}):\n\n---\n${safeText}\n---\n\nUser Question: ${userText || "Please analyze this file."}`;
    } catch (err) {
      userContent = `Error reading file ${fileName}. User Question: ${userText}`;
    }
  }

  // 2. Handle image if it exists
  if (imageBase64) {
    userContent = [
      { type: 'text', text: userText || "What is in this image?" },
      { type: 'image_url', image_url: { url: imageBase64 } }
    ];
  }

  history.push({ role: 'user', content: userContent });
  
  let response;
  try {
    response = await chatCompletion(history, SYSTEM_PROMPT);
  } catch (error: any) {
    console.error("🔴 GROQ API ERROR:", error.message);
    ws.send(JSON.stringify({ type: 'assistant_message', payload: { text: `AI Error: ${error.message}` } }));
    return;
  }

  let message = response.choices[0].message;
  history.push(message);

  // --- YOUR EXISTING TOOL LOOP ---
  while (message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const check = await gateway.check(toolName, args);

      if (!check.allowed) {
        history.push({ role: 'tool', tool_call_id: toolCall.id, content: `Error: ${check.reason}` });
        continue;
      }

      if (check.requiresApproval) {
        ws.send(JSON.stringify({
          type: 'approval_request',
          payload: {
            toolCallId: toolCall.id,
            toolName,
            arguments: args,
            description: `AI wants to run ${toolName}(${JSON.stringify(args)})`,
          },
        }));
        const approved = await new Promise<boolean>((resolve) => pendingResolvers.set(toolCall.id, resolve));
        if (!approved) {
          await logAudit(userId, toolName, args, 'rejected');
          history.push({ role: 'tool', tool_call_id: toolCall.id, content: 'User rejected the action.' });
          continue;
        }
      }

      try {
        const result = await executeTool(toolName, args);
        await logAudit(userId, toolName, args, 'approved');
        history.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
      } catch (err: any) {
        history.push({ role: 'tool', tool_call_id: toolCall.id, content: `Error: ${err.message}` });
      }
    }

    try {
      response = await chatCompletion(history, SYSTEM_PROMPT);
      message = response.choices[0].message;
      history.push(message);
    } catch (error: any) {
      console.error("🔴 GROQ API ERROR:", error.message);
      ws.send(JSON.stringify({ type: 'assistant_message', payload: { text: `AI Error: ${error.message}` } }));
      return;
    }
  }

  if (message.content) {
    ws.send(JSON.stringify({ type: 'assistant_message', payload: { text: message.content } }));
  }
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'get_current_time': return fileTools.getCurrentTime();
    case 'list_directory': return fileTools.listDirectory(args.path as string);
    case 'read_file': return fileTools.readFile(args.path as string);
    case 'write_file': return fileTools.writeFile(args.path as string, args.content as string);
    case 'delete_file': return fileTools.deleteFile(args.path as string);
    case 'undo_last_delete': return fileTools.undoLastDelete();
    default: throw new Error(`Unknown tool: ${name}`);
  }
}