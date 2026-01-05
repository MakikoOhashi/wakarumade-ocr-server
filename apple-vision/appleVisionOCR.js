import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Extracts text from an image using Apple Vision OCR
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextWithAppleVision(base64Image) {
  try {
    // Create temporary image file
    const tempImagePath = join(tmpdir(), `vision_ocr_${Date.now()}.png`);
    const imageBuffer = Buffer.from(base64Image, 'base64');
    writeFileSync(tempImagePath, imageBuffer);

    // Use AppleScript to call Vision framework via Shortcuts or Automator
    // This is a placeholder - actual implementation would use proper native bridge
    const script = `
      use framework "Vision"
      use framework "AppKit"

      set imagePath to "${tempImagePath}"
      set imageURL to (NSURL's fileURLWithPath:imagePath)
      set image to (NSImage's alloc()'s initWithContentsOfURL:imageURL)

      if image = missing value then
        error "Could not load image"
      end if

      set request to VNRecognizeTextRequest's new()
      set handler to VNImageRequestHandler's alloc()'s initWithData:(image's TIFFRepresentation()) options:(missing value)

      set success to handler's performRequests:(NSArray's arrayWithObject:request) error:(reference)

      if not success then
        error "Vision request failed"
      end if

      set observations to request's results()
      if observations's |count|() = 0 then
        return ""
      end if

      set extractedText to ""
      repeat with observation in observations
        set text to observation's |text|()
        set extractedText to extractedText & text & return
      end repeat

      return extractedText
    `;

    // Execute AppleScript (this would be replaced with proper native bridge)
    const result = execSync(`osascript -l JavaScript -e '${script}'`).toString();
    return result.trim();

  } catch (error) {
    console.error('Apple Vision OCR Error:', error.message);
    throw new Error(`Apple Vision OCR failed: ${error.message}`);
  } finally {
    // Clean up temporary file
    if (tempImagePath) {
      try {
        unlinkSync(tempImagePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError.message);
      }
    }
  }
}

/**
 * Enhanced OCR with layout analysis
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<{text: string, layout: object}>} - Text and layout information
 */
export async function extractTextWithLayout(base64Image) {
  const text = await extractTextWithAppleVision(base64Image);

  // Simple layout analysis (would be enhanced with actual Vision layout data)
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
  return Promise.all(base64Images.map(image => extractTextWithAppleVision(image)));
}
