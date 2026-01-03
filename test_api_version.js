import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing different API configurations...");

// Try with different configurations
const testConfigs = [
  { apiVersion: "v1beta" },
  { apiVersion: "v1" },
  { baseUrl: "https://generativelanguage.googleapis.com/v1" },
  { baseUrl: "https://generativelanguage.googleapis.com/v1beta" },
  {}
];

for (const config of testConfigs) {
  try {
    console.log(`\\nTesting config: ${JSON.stringify(config)}`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, config);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Try a simple text generation
    const result = await model.generateContent("Hello");
    console.log(`✓ Success with config ${JSON.stringify(config)}`);
    console.log(`Response: ${result.response.text().substring(0, 50)}...`);
    break;
  } catch (err) {
    console.log(`✗ Failed with config ${JSON.stringify(config)}: ${err.message}`);
  }
}
