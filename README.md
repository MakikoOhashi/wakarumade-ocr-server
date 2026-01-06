# Wakarumade OCR Server

## 📋 Current Status

**✅ Tesseract.js OCR Implementation**

The server now uses Tesseract.js for text extraction (OCR) with Gemini AI for text formatting:

1. **Tesseract.js** for text extraction (OCR) - Open-source, cross-platform
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

1. **Step 1: Text Extraction (Tesseract.js)**
   - Open-source OCR engine using Tesseract.js
   - Cross-platform support (macOS, Windows, Linux)
   - Supports multiple languages (English, Japanese, etc.)
   - Runs locally with Node.js integration

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
- `node-tesseract-ocr` - Tesseract.js OCR wrapper

## 🔐 Configuration

### Environment Variables (`.env`)

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Required Files

- Tesseract language data files (installed via Homebrew)
- Node.js modules (installed via npm)

## 🛠️ Setup Instructions

1. **Install Node.js** (v18+ recommended)
2. **Clone this repository**
3. **Install dependencies**: `npm install`
4. **Get Gemini API Key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create API key and add to `.env`
5. **Start server**: `npm run dev`

### Tesseract Requirements

- **Tesseract OCR** installed via Homebrew
- **Node.js 18+** recommended
- **npm** for package management

## 📊 API Usage & Quotas

### Tesseract.js OCR
- **Open-source**: Free and unlimited usage
- **Local processing**: No API calls or quotas
- **Documentation**: https://github.com/tesseract-ocr/tesseract

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

- **Open-Source OCR**: Tesseract.js runs locally with Node.js
- **No Cloud Costs**: No API calls for text extraction
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Intelligent Formatting**: Gemini AI structures math problems properly
- **Robust Error Handling**: Comprehensive error detection and reporting
- **Multi-language Support**: English, Japanese, and more (with language packs)
- **Offline Capable**: OCR works without internet connection

## 📝 Notes

- **Tesseract.js requires language data files** for each language
- **Gemini API key is only used for text formatting**
- **No Google Cloud setup required**
- **Test with real math problem images** for best results
- **Monitor Gemini API usage** to avoid quota limits
- **Install additional language packs** as needed

## 🔮 Future Improvements

- Add Japanese language support for Tesseract
- Add rate limiting
- Implement request caching
- Add logging and monitoring
- Support for additional image formats
- Batch processing capability

## 🖼️ Tesseract.js OCR Implementation

The Tesseract.js OCR implementation is located in the `tesseract-ocr.js` file:

- `extractTextWithTesseract()` - Main OCR function
- `extractTextWithLayout()` - Enhanced OCR with layout analysis
- `batchExtractText()` - Batch processing for multiple images

### Implementation Status

- ✅ Tesseract.js integration complete
- ✅ Apple Vision OCR removed
- ✅ Server updated to use Tesseract
- ✅ Error handling implemented
- ✅ Testing framework established
- ✅ Documentation updated

---

**© 2026 Wakarumade OCR Server** - Math Problem OCR Solution

## Node version setup (Required)

This project is tied to a specific Node.js version.

Before installing dependencies, always run:

```bash
nvm use
npm install
If nvm use fails, install the required version first:

bash
コードをコピーする
nvm install
nvm use
Do NOT run npm install without activating the correct Node version,
otherwise package-lock.json will be corrupted.

yaml
コードをコピーする
