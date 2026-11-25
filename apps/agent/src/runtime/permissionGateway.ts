import path from 'node:path';

type PermissionLevel = 'paranoid' | 'balanced' | 'yolo';
const DESTRUCTIVE = new Set(['delete_file', 'write_file', 'undo_last_delete']);
const SAFE = new Set(['list_directory', 'read_file', 'get_current_time']);

export class PermissionGateway {
  private level: PermissionLevel;
  private roots: string[];
  
  constructor() {
    this.level = (process.env.PERMISSION_LEVEL as PermissionLevel) || 'balanced';
    this.roots = (process.env.ALLOWED_ROOT_DIRS || '').split(',').map((p) => path.resolve(p.trim())).filter(Boolean);
  }
  
  async check(tool: string, args: Record<string, unknown>) {
    if (args.path && typeof args.path === 'string') {
      const resolved = path.resolve(args.path);
      if (!this.roots.some((r) => resolved.startsWith(r))) {
        return { allowed: false, requiresApproval: false, reason: `Path outside sandbox: ${args.path}` };
      }
    }
    if (!DESTRUCTIVE.has(tool) && !SAFE.has(tool)) {
      return { allowed: false, requiresApproval: false, reason: `Unknown tool: ${tool}` };
    }
    if (this.level === 'yolo') return { allowed: true, requiresApproval: false };
    if (this.level === 'paranoid') return { allowed: true, requiresApproval: true };
    return { allowed: true, requiresApproval: DESTRUCTIVE.has(tool) };
  }
}