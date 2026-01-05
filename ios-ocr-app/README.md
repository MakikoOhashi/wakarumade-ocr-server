# iOS OCR App with Vision Camera & Apple Vision

A React Native iOS app that uses Vision Camera for image capture and Apple Vision Framework for OCR text recognition, with Claude API for text formatting.

## Features

- 📷 Vision Camera integration for iOS
- 🔤 Apple Vision Framework for OCR (iOS only)
- 🤖 Claude API for text formatting
- 📱 Simple and clean UI
- 🔒 Camera permissions handling

## Requirements

- iOS 12.0+ (Monterey or later)
- Xcode 13.0+
- Node.js 18+
- Expo SDK 50+

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install iOS pods:
```bash
npx pod-install
```

3. Start the app:
```bash
npx expo start --ios
```

## Configuration

Create a `.env` file:
```env
CLAUDE_API_KEY=your_claude_api_key
```

## Implementation Details

- Uses `react-native-vision-camera` for camera functionality
- Uses `expo-camera` for permissions
- Uses `react-native-vision` for Apple Vision OCR
- Uses `axios` for Claude API calls
- iOS-only implementation
