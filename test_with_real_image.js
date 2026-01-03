import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

console.log("Testing with a more realistic image...");

// Create a simple 10x10 pixel image with some text-like patterns
// This is a minimal PNG image with some visible content
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x0A,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61, 0x00, 0x00, 0x00,
  0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00, 0x0B, 0x13, 0x00, 0x00, 0x0B,
  0x13, 0x01, 0x00, 0x9A, 0x9C, 0x18, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44,
  0x41, 0x54, 0x08, 0xD7, 0x63, 0x60, 0x00, 0x02, 0x00, 0x05, 0x7E, 0x01,
  0x71, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60,
  0x82
]);

const base64Image = pngData.toString("base64");

try {
  const response = await fetch(`${API_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: "image/png",
                data: base64Image,
              },
            },
            {
              text: "What do you see in this image?",
            },
          ],
        },
      ],
    }),
  });

  if (response.ok) {
    const result = await response.json();
    console.log("✓ Image API works!");
    console.log("Response:", JSON.stringify(result, null, 2));
  } else {
    const errorData = await response.json();
    console.log(`✗ Image API failed: ${errorData.error?.message || response.statusText}`);
    console.log("Full error:", JSON.stringify(errorData, null, 2));
  }
} catch (err) {
  console.log(`✗ Exception: ${err.message}`);
}
