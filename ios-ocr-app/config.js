/**
 * iOS OCR App Configuration
 */

// Server configuration
export const SERVER_URL = 'http://localhost:3333';

// App settings
export const appConfig = {
  // Camera settings
  camera: {
    quality: 0.8,
    enableShutterSound: false,
    preferredDevice: 'back'
  },

  // UI settings
  ui: {
    loadingText: 'Processing...',
    errorTitle: 'Error',
    closeButtonText: 'Close'
  },

  // API settings
  api: {
    timeout: 30000, // 30 seconds
    maxRetries: 3
  }
};
