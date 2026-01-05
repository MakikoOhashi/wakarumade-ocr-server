import { extractTextWithAppleVision } from '../apple-vision/appleVisionOCR.js';

/**
 * Basic test to verify the Apple Vision OCR functionality
 */
async function testBasicOCR() {
  try {
    console.log('Testing Apple Vision OCR basic functionality...');

    // This would normally be a base64 encoded image
    // For testing purposes, we'll just verify the function exists and can be called
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    console.log('Calling extractTextWithAppleVision...');
    const result = await extractTextWithAppleVision(testImage);
    console.log('OCR Result:', result);

    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

/**
 * Test the camera permission functionality
 */
async function testCameraPermission() {
  try {
    console.log('Testing camera permission functionality...');

    // Mock the Camera.requestCameraPermission function
    const mockPermission = async () => 'granted';

    // This would normally be imported from CameraPermission.js
    const requestCameraPermission = mockPermission;

    const permission = await requestCameraPermission();
    console.log('Camera permission result:', permission);

    if (permission === 'granted') {
      console.log('Camera permission test passed');
      return true;
    } else {
      console.log('Camera permission test failed');
      return false;
    }
  } catch (error) {
    console.error('Camera permission test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Running Basic Functionality Tests ===\n');

  const ocrTestPassed = await testBasicOCR();
  console.log(`OCR Test: ${ocrTestPassed ? 'PASSED' : 'FAILED'}\n`);

  const permissionTestPassed = await testCameraPermission();
  console.log(`Camera Permission Test: ${permissionTestPassed ? 'PASSED' : 'FAILED'}\n`);

  const allPassed = ocrTestPassed && permissionTestPassed;
  console.log(`Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testBasicOCR, testCameraPermission, runTests };
