import { extractTextWithTesseract } from './tesseract-ocr.js';

// Create a simple test image with text
const testText = "Hello World from Tesseract OCR!";
const buffer = Buffer.from(testText, 'utf8');
const base64Image = buffer.toString('base64');

console.log('Testing Tesseract OCR...');
console.log('Input base64 length:', base64Image.length);

try {
  const result = await extractTextWithTesseract(base64Image);
  console.log('OCR Result:', result);
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
