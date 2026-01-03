import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

console.log("Testing direct API with text request...");

try {
  // First test with simple text
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
              text: "Hello, how are you today?",
            },
          ],
        },
      ],
    }),
  });

  if (response.ok) {
    const result = await response.json();
    console.log("✓ Text API works!");
    console.log("Response:", JSON.stringify(result, null, 2));
  } else {
    const errorData = await response.json();
    console.log(`✗ Text API failed: ${errorData.error?.message || response.statusText}`);
  }
} catch (err) {
  console.log(`✗ Exception: ${err.message}`);
}
