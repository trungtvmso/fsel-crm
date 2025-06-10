
import { Translations } from './types'; // Assuming types.ts defines Translations
import { marked } from 'marked';

export function isValidPhoneNumber(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatDate(dateString: string | null | undefined, format: 'dd/MM/yyyy' | 'yyyy-MM-dd' = 'dd/MM/yyyy'): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (format === 'yyyy-MM-dd') {
      return `${year}-${month}-${day}`;
    }
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Lỗi định dạng ngày:", dateString, e);
    return dateString; // Return original on error
  }
}

export function extractApiErrorMessage(responseData: any, defaultMessage: string = 'An unknown error occurred.'): string {
  if (responseData?.errorMessages && Array.isArray(responseData.errorMessages)) {
    return responseData.errorMessages.map((err: any) => {
      if (typeof err === 'string') return err;
      if (err.errorCode && err.errors && Array.isArray(err.errors)) {
        const fieldErrors = err.errors.map((fieldErr: any) => `${fieldErr.fieldName}: ${fieldErr.errorValues?.join(', ')}`).join('; ');
        return `${err.errorCode} - ${fieldErrors}`;
      }
      if (err.errorCode) return err.errorCode;
      return JSON.stringify(err);
    }).join(', ');
  }
  if(responseData?.message && typeof responseData.message === 'string') return responseData.message;
  if(responseData?.error?.message && typeof responseData.error.message === 'string') return responseData.error.message; // For Gemini like errors
  return defaultMessage;
}

export function getCustomerTypeDisplay(
  objectValue?: 'Leads' | 'Client' | string,
  translate?: (key: string) => string
): string {
  if (translate) {
    if (objectValue === 'Leads') return translate('customerTypes.leads');
    if (objectValue === 'Client') return translate('customerTypes.client');
    return translate('customerTypes.na');
  }
  // Fallback if translate function is not provided (should not happen in normal flow)
  if (objectValue === 'Leads') return 'Tiềm năng';
  if (objectValue === 'Client') return 'Học viên';
  return 'N/A';
}


export function formatGeminiOutputToHtml(text: string): string {
  if (!text) return '<p>Không có dữ liệu.</p>';

  marked.setOptions({
    gfm: true,       // Enable GitHub Flavored Markdown (tables, strikethrough, etc.)
    breaks: true,    // Treat single newlines as <br>
    // pedantic: false, // If you want to be less strict with Markdown rules
    // sanitize: false, // IMPORTANT: Set to true if input is untrusted. Gemini output is generally trusted.
                     // If true, it might strip out some HTML if Gemini ever produces it.
  });

  try {
    // Split the text by "---" which Gemini is prompted to use as a block separator.
    // This regex allows for optional newlines and whitespace around the "---".
    const blocks = text.split(/\n?\s*---\s*\n?/);
    
    const htmlBlocks = blocks.map(block => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return ''; // Skip empty blocks that might result from splitting

      // Parse the individual block's Markdown content
      const parsedContent = marked.parse(trimmedBlock) as string;
      
      // Wrap the parsed content of each block
      return `<div class="gemini-content-block">${parsedContent}</div>`;
    });

    // Join the processed blocks.
    // We are not re-inserting <hr class="gemini-section-separator" /> here based on the split.
    // If Gemini includes "---" within its content *inside* a block, `marked` will render it as a standard <hr>.
    // The `gemini-content-block` already provides visual separation.
    let finalHtml = htmlBlocks.filter(block => block !== '').join('\n'); // Join non-empty blocks with a newline for source readability

    return finalHtml || '<p>Không thể định dạng nội dung từ AI.</p>';

  } catch (error) {
    console.error("Error parsing Markdown with 'marked':", error);
    // Fallback to a very simple paragraph conversion if marked fails,
    // though marked is generally robust.
    return `<p>${text.replace(/\n/g, '<br>')}</p>`;
  }
}