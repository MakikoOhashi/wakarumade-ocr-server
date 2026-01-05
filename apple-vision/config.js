/**
 * Apple Vision OCR Configuration
 */

export const appleVisionConfig = {
  // Performance settings
  performance: {
    // Use CPU only (Vision framework automatically uses available hardware)
    useCPUOnly: false,

    // Enable high accuracy mode (slower but more accurate)
    highAccuracy: true,

    // Maximum image size for processing (in pixels)
    maxImageSize: 4000,

    // Timeout for OCR processing (in milliseconds)
    processingTimeout: 30000
  },

  // Language settings
  languages: {
    // Primary language for OCR
    primaryLanguage: 'ja', // Japanese

    // Supported languages (Vision framework supports many languages automatically)
    supportedLanguages: ['ja', 'en', 'zh-Hans', 'zh-Hant', 'ko', 'fr', 'de', 'es'],

    // Enable automatic language detection
    autoDetectLanguage: true
  },

  // Output settings
  output: {
    // Include confidence scores in output
    includeConfidence: true,

    // Include bounding boxes for detected text
    includeBoundingBoxes: true,

    // Include word-level information
    includeWordLevel: true,

    // Include paragraph detection
    includeParagraphs: true
  },

  // Debug settings
  debug: {
    // Enable debug logging
    enabled: false,

    // Save intermediate processing images
    saveDebugImages: false,

    // Debug image directory (if saveDebugImages is true)
    debugImageDir: './debug_images'
  }
};

/**
 * Validation function for configuration
 */
export function validateConfig(config) {
  const errors = [];

  if (config.performance.maxImageSize < 100) {
    errors.push('maxImageSize must be at least 100 pixels');
  }

  if (config.performance.processingTimeout < 1000) {
    errors.push('processingTimeout must be at least 1000ms');
  }

  if (!config.languages.supportedLanguages.includes(config.languages.primaryLanguage)) {
    errors.push(`primaryLanguage ${config.languages.primaryLanguage} is not in supportedLanguages`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
