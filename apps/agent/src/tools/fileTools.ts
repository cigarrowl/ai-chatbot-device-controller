import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const TRASH_DIR = path.resolve(process.env.TRASH_DIR || '.agent_trash');

export async function getCurrentTime(): Promise<string> { return new 
Date().toISOString(); }

export async function listDirectory(dirPath: string): Promise<string> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.map((e) => `${e.isDirectory() ? '[DIR]' : '[FILE]'} 
${e.name}`).join('\n');
}
export async function readFile(filePath: string): Promise<string> { return 
fs.readFile(filePath, 'utf-8'); }

export async function writeFile(filePath: string, content: string): 
Promise<string> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  return `File written: ${filePath}`;
}

export async function deleteFile(filePath: string): Promise<string> {
  await fs.mkdir(TRASH_DIR, { recursive: true });
  const metadata = { originalPath: path.resolve(filePath), deletedAt: new 
Date().toISOString(), trashId: randomUUID() };
  const trashPath = path.join(TRASH_DIR, 
`${metadata.trashId}_${path.basename(filePath)}`);
  await fs.rename(filePath, trashPath);
  await fs.writeFile(`${trashPath}.meta.json`, JSON.stringify(metadata, 
null, 2));
  return `Moved to trash: ${filePath}. Say "undo" to restore.`;
}

export async function undoLastDelete(): Promise<string> {
  await fs.mkdir(TRASH_DIR, { recursive: true });
  const metaFiles = (await fs.readdir(TRASH_DIR)).filter((f) => 
f.endsWith('.meta.json'));
  if (metaFiles.length === 0) return 'No deleted files to undo.';
  const latest = metaFiles.sort().pop()!;
  const meta = JSON.parse(await fs.readFile(path.join(TRASH_DIR, latest), 
'utf-8'));
  const trashFilePath = path.join(TRASH_DIR, latest.replace('.meta.json', 
''));
  await fs.rename(trashFilePath, meta.originalPath);
  await fs.unlink(path.join(TRASH_DIR, latest));
  return `Restored: ${meta.originalPath}`;
}
