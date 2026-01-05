import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { ImageAnnotatorClient } from "@google-cloud/vision";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn("GOOGLE_APPLICATION_CREDENTIALS not set, Vision API may not work");
}

// Use direct API calls to v1 endpoint since SDK v0.24.1 is hardcoded to v1beta
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";

// Initialize Google Cloud Vision client
const visionClient = new ImageAnnotatorClient();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.post("/ocr", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "no image" });

    let base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Base64 検証
    base64 = base64.trim(); // 空白を除去
    if (!/^[A-Za-z0-9+/=]*$/.test(base64)) {
      return res.status(400).json({ error: "Invalid base64 format" });
    }

    // Base64 長さチェック（サーバーが大きすぎる画像を受け取ってないか確認）
    if (base64.length > 20 * 1024 * 1024) { // 20MB以上
      return res.status(413).json({ error: "Image too large" });
    }

    console.log(`[OCR] Processing image, base64 length: ${base64.length}`);

    // Step 1: Extract raw text using Google Cloud Vision API (OCR specialized)
    console.log("[OCR] Step 1/2: Extracting text with Google Cloud Vision API");
    const imageBuffer = Buffer.from(base64, "base64");

    try {
      const [visionResult] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });

      const rawText = visionResult.fullTextAnnotation?.text || "";
      console.log("[OCR] Extracted raw text length:", rawText.length);

      if (!rawText.trim()) {
        throw new Error("No text detected in the image");
      }

      // Step 2: Format the extracted text using Gemini AI
      console.log("[OCR] Step 2/2: Formatting text with Gemini AI");
      const formatResponse = await fetch(`${API_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `以下の算数の問題テキストをJSON形式に整理してください:\n\n${rawText}\n\n形式: {problems:[{number,question}]}`,
                },
              ],
            },
          ],
        }),
      });

      if (!formatResponse.ok) {
        const errorData = await formatResponse.json();
        console.error("Gemini Format Error:", errorData);

        // Handle quota exceeded error specifically
        if (errorData.error?.message?.includes("quota exceeded")) {
          throw new Error("Gemini API quota exceeded. Please check your billing or try again later.");
        }

        throw new Error(`Gemini Format Error: ${formatResponse.status} ${JSON.stringify(errorData)}`);
      }

      const formatResult = await formatResponse.json();
      const formattedText = formatResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = formattedText.replace(/```json|```/g, "").trim();

      const data = JSON.parse(cleaned);
      res.json(data);

    } catch (visionError) {
      console.error("Vision API Error:", visionError.message);
      throw new Error(`Vision API Error: ${visionError.message}`);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.listen(3333, () => {
  console.log("OCR server running on http://localhost:3333");
});
