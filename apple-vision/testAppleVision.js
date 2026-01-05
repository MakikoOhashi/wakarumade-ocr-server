import { extractTextWithAppleVision, extractTextWithLayout, batchExtractText } from './appleVisionOCR.js';
import { appleVisionConfig, validateConfig } from './config.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Sample test images (base64 encoded)
const sampleImages = {
  mathProblem: 'iVBORw0KGgoAAAANSUhEUgAA...', // Truncated for example
  japaneseText: 'iVBORw0KGgoAAAANSUhEUgAA...'  // Truncated for example
};

/**
 * Test Apple Vision OCR functionality
 */
async function testAppleVisionOCR() {
  console.log('=== Apple Vision OCR Test ===\n');

  // Validate configuration
  const configValidation = validateConfig(appleVisionConfig);
  if (!configValidation.isValid) {
    console.error('Configuration validation failed:', configValidation.errors);
    return;
  }
  console.log('✓ Configuration validated successfully');

  // Test single image OCR
  try {
    console.log('\n1. Testing single image OCR...');
    const text = await extractTextWithAppleVision(sampleImages.mathProblem);
    console.log('✓ Extracted text:', text.substring(0, 100) + '...');
  } catch (error) {
    console.error('✗ Single image OCR failed:', error.message);
  }

  // Test layout analysis
  try {
    console.log('\n2. Testing layout analysis...');
    const { text, layout } = await extractTextWithLayout(sampleImages.mathProblem);
    console.log('✓ Layout analysis:', JSON.stringify(layout, null, 2));
  } catch (error) {
    console.error('✗ Layout analysis failed:', error.message);
  }

  // Test batch processing
  try {
    console.log('\n3. Testing batch processing...');
    const results = await batchExtractText([
      sampleImages.mathProblem,
      sampleImages.japaneseText
    ]);
    console.log(`✓ Processed ${results.length} images successfully`);
  } catch (error) {
    console.error('✗ Batch processing failed:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

/**
 * Performance benchmark
 */
async function benchmarkPerformance() {
  console.log('\n=== Performance Benchmark ===');

  const iterations = 5;
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    try {
      await extractTextWithAppleVision(sampleImages.mathProblem);
    } catch (error) {
      console.error(`Iteration ${i + 1} failed:`, error.message);
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;

  console.log(`Processed ${iterations} images in ${totalTime}ms`);
  console.log(`Average time per image: ${avgTime.toFixed(2)}ms`);
  console.log('=== Benchmark Complete ===\n');
}

/**
 * Main test function
 */
async function main() {
  try {
    await testAppleVisionOCR();
    await benchmarkPerformance();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testAppleVisionOCR, benchmarkPerformance };
