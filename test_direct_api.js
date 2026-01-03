import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

console.log("Testing direct API calls with different models...");

// Try different models that might be available
const modelsToTest = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-pro-vision",
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro",
  "models/gemini-pro",
  "models/gemini-pro-vision"
];

for (const modelName of modelsToTest) {
  try {
    console.log(`\\nTesting model: ${modelName}`);

    // First try a simple text request
    const response = await fetch(`${API_URL}/models/${modelName}:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hello, how are you?",
              },
            ],
          },
        ],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✓ Success with model ${modelName}`);
      console.log(`Response: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
      break;
    } else {
      const errorData = await response.json();
      console.log(`✗ Failed with model ${modelName}: ${errorData.error?.message || response.statusText}`);
    }
  } catch (err) {
    console.log(`✗ Exception with model ${modelName}: ${err.message}`);
  }
}
