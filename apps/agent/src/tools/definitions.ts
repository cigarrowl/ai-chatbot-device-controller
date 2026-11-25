import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const schema = (s: z.ZodTypeAny) => zodToJsonSchema(s, { target: 'openAi' });

export const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'get_current_time',
      description: 'Returns the current date and time.',
      parameters: schema(z.object({})),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_directory',
      description: 'Lists files and folders inside a directory.',
      parameters: schema(z.object({ path: z.string().describe('Absolute path to the directory') })),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Reads the text content of a file.',
      parameters: schema(z.object({ path: z.string().describe('Absolute path to the file') })),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_file',
      description: 'Writes text content to a file (creates or overwrites).',
      parameters: schema(z.object({
        path: z.string().describe('Absolute path to the file'),
        content: z.string().describe('Text content to write'),
      })),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_file',
      description: 'Moves a file to the local agent trash (reversible).',
      parameters: schema(z.object({ path: z.string().describe('Absolute path to the file') })),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'undo_last_delete',
      description: 'Restores the most recently deleted file from the trash.',
      parameters: schema(z.object({})),
    },
  },
];