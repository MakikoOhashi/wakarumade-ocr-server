import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
      "この画像に写っている算数の問題をJSONで抽出してください。{problems:[{number,question}]}"
    ]);

    const text = result.response.text();

    // Geminiは平気で ```json ... ``` を付ける
    const cleaned = text.replace(/```json|```/g, "").trim();

    const data = JSON.parse(cleaned);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.listen(3333, () => {
  console.log("OCR server running on http://localhost:3333");
});
