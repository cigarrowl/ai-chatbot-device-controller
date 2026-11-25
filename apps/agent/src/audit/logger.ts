import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, 
process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function logAudit(userId: string, tool: string, args: 
Record<string, unknown>, decision: 'approved' | 'rejected' | 'dry_run') {
  await supabase.from('audit_logs').insert({ user_id: userId, tool_name: 
tool, arguments: args, decision });
}
