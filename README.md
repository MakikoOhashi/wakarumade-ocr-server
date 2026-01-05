# Wakarumade OCR Server

## 📋 Current Status

**✅ OCR Server is Working!**

The server has been successfully implemented with a two-step OCR architecture:

1. **Google Cloud Vision API** for text extraction (OCR)
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

1. **Step 1: Text Extraction (Google Cloud Vision API)**
   - Specialized OCR engine optimized for text detection
   - Handles various image formats (JPEG, PNG, etc.)
   - Extracts raw text from math problem images

2. **Step 2: Text Formatting (Gemini AI)**
   - Structures extracted text into JSON format
   - Organizes math problems with numbers and questions
   - Handles Japanese and English mixed content

## 📦 Dependencies

- `@google-cloud/vision` - Google Cloud Vision API client
- `@google/generative-ai` - Gemini AI SDK
- `express` - Web server framework
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `node-fetch` - HTTP client for Gemini API

## 🔐 Configuration

### Environment Variables (`.env`)

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=./google-cloud-key.json
```

### Required Files

- `google-cloud-key.json` - Google Cloud service account credentials

## 🛠️ Setup Instructions

1. **Install Node.js** (v18+ recommended)
2. **Clone this repository**
3. **Install dependencies**: `npm install`
4. **Set up Google Cloud**:
   - Create a project in Google Cloud Console
   - Enable **Cloud Vision API**
   - Create a service account and download JSON key
   - Save as `google-cloud-key.json`
5. **Get Gemini API Key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create API key and add to `.env`
6. **Start server**: `npm run dev`

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

- **High Accuracy OCR**: Google Cloud Vision API specialized for text extraction
- **Intelligent Formatting**: Gemini AI structures math problems properly
- **Robust Error Handling**: Comprehensive error detection and reporting
- **Scalable Architecture**: Can handle multiple requests efficiently
- **Secure**: Proper API key management and authentication

## 📝 Notes

- **Google Cloud Vision API must be enabled** in your project
- **Service account must have Vision API permissions**
- **Gemini API key must have proper quotas**
- **Test with real math problem images** for best results
- **Monitor API usage** to avoid quota limits

## 🔮 Future Improvements

- Add rate limiting
- Implement request caching
- Add logging and monitoring
- Support for additional image formats
- Batch processing capability

---

**© 2026 Wakarumade OCR Server** - Math Problem OCR Solution
