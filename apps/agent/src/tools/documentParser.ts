import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
// Use createRequire to load the CommonJS library correctly
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string }>;

export async function extractTextFromFile(base64Data: string, fileName: string, fileType: string): Promise<string> {
  const base64Content = base64Data.split(',')[1] || base64Data;
  const buffer = Buffer.from(base64Content, 'base64');

  try {
    // Handle PDF
    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      
      if (!data.text || data.text.trim().length === 0) {
        return `[The PDF "${fileName}" was parsed but contains no readable text. It is likely a scanned image. Tell the user you cannot read image-based PDFs.]`;
      }
      return data.text;
    }
    
    // Handle Word (.docx)
    if (fileType.includes('wordprocessingml') || fileName.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || result.value.trim().length === 0) {
         return `[The Word document "${fileName}" is empty.]`;
      }
      return result.value;
    }

    // Handle plain text, CSV, JSON, Markdown, code files
    return buffer.toString('utf-8');

  } catch (error: any) {
    console.error("🔴 Error parsing file:", error);
    return `[Failed to read the file "${fileName}". Error details: ${error.message}. It might be password protected or corrupted.]`;
  }
}