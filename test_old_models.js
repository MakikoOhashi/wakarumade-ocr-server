import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing older models that might work with v1beta...");

// Try some older model names that might be available in v1beta
const oldModels = [
  "gemini-1.0-pro",
  "gemini-1.0-pro-vision",
  "gemini-pro",
  "gemini-pro-vision",
  "text-bison",
  "chat-bison",
  "text-bison-001",
  "chat-bison-001"
];

for (const modelName of oldModels) {
  try {
    console.log(`\\nTesting old model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Try a simple text generation
    const result = await model.generateContent("Hello");
    console.log(`✓ Success with model ${modelName}`);
    console.log(`Response: ${result.response.text().substring(0, 50)}...`);
    break;
  } catch (err) {
    console.log(`✗ Failed with model ${modelName}: ${err.message}`);
  }
}
