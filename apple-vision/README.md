# Apple Vision OCR Integration

This directory contains the implementation for Apple Vision OCR integration.

## Setup Instructions

1. **Prerequisites**:
   - macOS 12.0+ (Monterey) or later
   - Xcode 13.0+ with command line tools
   - Node.js 18+

2. **Install required dependencies**:
   ```bash
   npm install
   ```

3. **Apple Vision Framework**:
   - Apple Vision framework is built into macOS
   - No additional installation required

## Implementation Details

The Apple Vision OCR implementation uses:
- Vision framework for text detection
- Native macOS APIs for image processing
- Node.js FFI (Foreign Function Interface) to call native APIs

## Files

- `appleVisionOCR.js` - Main OCR implementation
- `nativeBridge.js` - Native bridge for Vision framework
- `sampleImages/` - Sample images for testing

## Usage

```javascript
import { extractTextWithAppleVision } from './apple-vision/appleVisionOCR.js';

// Extract text from base64 image
const rawText = await extractTextWithAppleVision(base64Image);
```

## Performance Considerations

- Apple Vision is optimized for macOS
- Runs locally without network calls
- Supports multiple languages
- Handles various text orientations and layouts
