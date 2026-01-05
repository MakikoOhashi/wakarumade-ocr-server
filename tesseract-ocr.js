import Tesseract from 'node-tesseract-ocr';
import fs from 'fs';

/**
 * Extracts text from an image using Tesseract OCR
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextWithTesseract(base64Image) {
  try {
    // Convert base64 to image file
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const tempImagePath = './temp-ocr-image.png';
    fs.writeFileSync(tempImagePath, imageBuffer);

    // Configure Tesseract - using only English since Japanese language pack is not available
    const config = {
      lang: 'eng',
      oem: 1,
      psm: 3,
    };

    console.log('[Tesseract] Starting OCR processing...');

    // Perform OCR
    const text = await Tesseract.recognize(tempImagePath, config);

    // Clean up
    try {
      fs.unlinkSync(tempImagePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temp file:', cleanupError.message);
    }

    console.log(`[Tesseract] Extracted text length: ${text.length} characters`);
    return text.trim();

  } catch (error) {
    console.error('[Tesseract] OCR Error:', error.message);
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}

/**
 * Enhanced OCR with layout analysis
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<{text: string, layout: object}>} - Text and layout information
 */
export async function extractTextWithLayout(base64Image) {
  const text = await extractTextWithTesseract(base64Image);

  // Simple layout analysis
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const layout = {
    lineCount: lines.length,
    averageLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length,
    hasMultipleColumns: lines.some(line => line.includes('  ')) // Simple heuristic
  };

  return { text, layout };
}

/**
 * Batch processing for multiple images
 * @param {string[]} base64Images - Array of base64 encoded images
 * @returns {Promise<string[]>} - Array of extracted texts
 */
export async function batchExtractText(base64Images) {
  return Promise.all(base64Images.map(image => extractTextWithTesseract(image)));
}
