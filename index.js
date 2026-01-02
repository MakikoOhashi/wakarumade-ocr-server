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

    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

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
