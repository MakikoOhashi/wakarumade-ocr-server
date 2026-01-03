import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

// Read the test image
const testData = JSON.parse(fs.readFileSync('test_data.json', 'utf8'));
const base64Image = testData.imageBase64.replace(/^data:image\/\w+;base64,/, "");

console.log("Testing with gemini-2.5-pro model...");

try {
  const response = await fetch(`${API_URL}/models/gemini-2.5-pro:generateContent?key=${API_KEY}`, {
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
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: "この画像に写っている算数の問題をJSONで抽出してください。{problems:[{number,question}]}",
            },
          ],
        },
      ],
    }),
  });

  if (response.ok) {
    const result = await response.json();
    console.log("✓ gemini-2.5-pro works!");
    console.log("Response:", JSON.stringify(result, null, 2));
  } else {
    const errorData = await response.json();
    console.log(`✗ gemini-2.5-pro failed: ${errorData.error?.message || response.statusText}`);
  }
} catch (err) {
  console.log(`✗ Exception: ${err.message}`);
}
