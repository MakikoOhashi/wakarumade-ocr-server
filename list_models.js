import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

try {
  // Try to list available models
  console.log("Attempting to list available models...");

  // The JavaScript SDK doesn't have a direct listModels method like Python
  // Let's try to see if we can get any model to work
  const testModels = [
    "gemini-1.5-flash",
    "models/gemini-1.5-flash",
    "gemini-1.5-pro",
    "models/gemini-1.5-pro",
    "gemini-pro",
    "models/gemini-pro",
    "gemini-pro-vision",
    "models/gemini-pro-vision"
  ];

  for (const modelName of testModels) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✓ Model ${modelName} initialized successfully`);

      // Try a simple text generation to see if it actually works
      const result = await model.generateContent("Hello");
      console.log(`✓ Model ${modelName} works! Response: ${result.response.text().substring(0, 50)}...`);
      break;
    } catch (err) {
      console.log(`✗ Model ${modelName} failed: ${err.message}`);
    }
  }

} catch (err) {
  console.error("Error:", err);
}
