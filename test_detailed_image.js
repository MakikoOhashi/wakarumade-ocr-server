import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

// Read the test image
const testData = JSON.parse(fs.readFileSync('test_data.json', 'utf8'));
const base64Image = testData.imageBase64.replace(/^data:image\/\w+;base64,/, "");

console.log("Testing with different image formats and approaches...");

// Try different approaches
const approaches = [
  {
    name: "JPEG with math prompt",
    mime_type: "image/jpeg",
    prompt: "この画像に写っている算数の問題をJSONで抽出してください。{problems:[{number,question}]}"
  },
  {
    name: "PNG with simple prompt",
    mime_type: "image/png",
    prompt: "What do you see in this image?"
  },
  {
    name: "JPEG with simple prompt",
    mime_type: "image/jpeg",
    prompt: "Describe this image"
  },
  {
    name: "OCTET-STREAM with simple prompt",
    mime_type: "application/octet-stream",
    prompt: "What is in this image?"
  }
];

for (const approach of approaches) {
  try {
    console.log(`\\n--- Testing: ${approach.name} ---`);

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
                  mime_type: approach.mime_type,
                  data: base64Image,
                },
              },
              {
                text: approach.prompt,
              },
            ],
          },
        ],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✓ Success with ${approach.name}`);
      console.log("Response:", JSON.stringify(result, null, 2));
      break;
    } else {
      const errorData = await response.json();
      console.log(`✗ Failed with ${approach.name}: ${errorData.error?.message || response.statusText}`);
    }
  } catch (err) {
    console.log(`✗ Exception with ${approach.name}: ${err.message}`);
  }
}
