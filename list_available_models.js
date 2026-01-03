import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

console.log("Attempting to list available models...");

try {
  // Try to list models using the v1 API
  const response = await fetch(`${API_URL}/models?key=${API_KEY}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    const result = await response.json();
    console.log("✓ Successfully listed models:");
    console.log(JSON.stringify(result, null, 2));
  } else {
    const errorData = await response.json();
    console.log(`✗ Failed to list models: ${errorData.error?.message || response.statusText}`);
    console.log("Full error:", JSON.stringify(errorData, null, 2));
  }
} catch (err) {
  console.log(`✗ Exception when listing models: ${err.message}`);
  console.log("Stack:", err.stack);
}
