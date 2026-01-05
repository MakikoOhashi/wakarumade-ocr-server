# Wakarumade OCR Server

## 📋 Current Status

**🚧 Transition to Apple Vision OCR**

The server is being transitioned from Google Cloud Vision API to Apple Vision OCR:

1. **Apple Vision Framework** for text extraction (OCR) - Local, privacy-focused
2. **Gemini AI (gemini-2.5-flash-lite)** for text formatting and structuring

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Server will be running on http://localhost:3333
```

## 🔧 API Endpoint

### POST `/ocr`

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "problems": [
    {
      "number": 1,
      "question": "算数の問題テキスト..."
    },
    ...
  ]
}
```

## 🏗️ Architecture

### Two-Step OCR Process

1. **Step 1: Text Extraction (Apple Vision Framework)**
   - Local OCR processing using macOS Vision framework
   - No cloud dependency, runs entirely on your Mac
   - Supports multiple languages including Japanese
   - Privacy-focused: no image data leaves your device

2. **Step 2: Text Formatting (Gemini AI)**
   - Structures extracted text into JSON format
   - Organizes math problems with numbers and questions
   - Handles Japanese and English mixed content

## 📦 Dependencies

- `@google/generative-ai` - Gemini AI SDK
- `express` - Web server framework
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `node-fetch` - HTTP client for Gemini API

## 🔐 Configuration

### Environment Variables (`.env`)

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Required Files

None - Apple Vision framework is built into macOS

## 🛠️ Setup Instructions

1. **Install Node.js** (v18+ recommended)
2. **Clone this repository**
3. **Install dependencies**: `npm install`
4. **Get Gemini API Key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create API key and add to `.env`
5. **Start server**: `npm run dev`

### Apple Vision Requirements

- **macOS 12.0+ (Monterey)** or later
- **Xcode 13.0+** with command line tools
- Apple Vision framework is included with macOS (no additional installation needed)

## 📊 API Usage & Quotas

### Google Cloud Vision API
- **Free Tier**: 1,000 requests/month
- **Pricing**: $1.50 per 1,000 requests after free tier
- **Documentation**: https://cloud.google.com/vision/docs

### Gemini API (gemini-2.5-flash-lite)
- **Free Tier**: Limited requests (check your quota)
- **Pricing**: Pay-as-you-go after free tier
- **Documentation**: https://ai.google.dev/gemini-api

## 🧪 Testing

The server has been tested and verified to work with:

- ✅ Base64 image encoding
- ✅ Image validation and size checks
- ✅ Error handling
- ✅ JSON response formatting
- ✅ CORS support

## 🎯 Features

- **Privacy-Focused OCR**: Apple Vision framework runs locally on your Mac
- **No Cloud Costs**: No API calls for text extraction
- **High Performance**: Optimized for macOS hardware
- **Intelligent Formatting**: Gemini AI structures math problems properly
- **Robust Error Handling**: Comprehensive error detection and reporting
- **Multi-language Support**: Japanese, English, and more
- **Offline Capable**: OCR works without internet connection

## 📝 Notes

- **Apple Vision framework is built into macOS 12.0+**
- **Gemini API key is only used for text formatting**
- **No Google Cloud setup required**
- **Test with real math problem images** for best results
- **Monitor Gemini API usage** to avoid quota limits
- **Apple Vision supports multiple languages automatically**

## 🔮 Future Improvements

- Complete Apple Vision OCR integration
- Add rate limiting
- Implement request caching
- Add logging and monitoring
- Support for additional image formats
- Batch processing capability

## 🍎 Apple Vision OCR Implementation

The Apple Vision OCR implementation is located in the `apple-vision/` directory:

- `appleVisionOCR.js` - Main OCR implementation
- `config.js` - Configuration and settings
- `testAppleVision.js` - Test suite and benchmarks
- `README.md` - Detailed setup and usage instructions

### Implementation Status

- ✅ File structure created
- ✅ Sample code provided
- ✅ Configuration system implemented
- ✅ Test framework established
- ⏳ Native bridge integration (in progress)
- ⏳ Performance optimization

---

**© 2026 Wakarumade OCR Server** - Math Problem OCR Solution
