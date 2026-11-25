export interface ApprovalRequest {
  toolCallId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  description: string;
}
