import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

if (!process.env.VISION_API_KEY) {
  throw new Error("VISION_API_KEY is not set");
}

// Use direct API calls to v1 endpoint since SDK v0.24.1 is hardcoded to v1beta
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1";
const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

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

    // Step 1/2: Extracting text with Google Vision OCR (direct API)
    console.log("[OCR] Step 1/2: Extracting text with Google Vision OCR");
    let rawText;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const ocrResponse = await fetch(`${VISION_API_URL}?key=${VISION_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              imageContext: {
                languageHints: ["ja", "en"],
              },
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error("[OCR] Vision API error:", errorText);
        throw new Error(`Vision API error: ${ocrResponse.status}`);
      }

      const ocrResult = await ocrResponse.json();
      const response = ocrResult?.responses?.[0];

      const page = response?.fullTextAnnotation?.pages?.[0];
      if (page?.blocks?.length && page.width && page.height) {
        const imageCenter = { x: page.width / 2, y: page.height / 2 };
        let bestBlock = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const block of page.blocks) {
          const box = block?.boundingBox?.vertices || [];
          if (box.length === 0) continue;
          const xs = box.map((v) => v?.x ?? 0);
          const ys = box.map((v) => v?.y ?? 0);
          const center = {
            x: (Math.min(...xs) + Math.max(...xs)) / 2,
            y: (Math.min(...ys) + Math.max(...ys)) / 2,
          };
          const dx = center.x - imageCenter.x;
          const dy = center.y - imageCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestBlock = block;
          }
        }

        if (bestBlock) {
          const lines = [];
          for (const paragraph of bestBlock.paragraphs || []) {
            const words = [];
            for (const word of paragraph.words || []) {
              const text = (word.symbols || []).map((s) => s.text).join("");
              if (text) words.push(text);
            }
            if (words.length) lines.push(words.join(" "));
          }
          rawText = lines.join("\n");
        }
      }

      if (!rawText) {
        const textAnnotation = response?.textAnnotations?.[0]?.description || "";
        rawText = textAnnotation;
      }
      console.log(`[OCR] Extracted text length: ${rawText.length} characters`);
    } catch (ocrError) {
      console.error("[OCR] Google Vision OCR failed:", ocrError.message);
      throw new Error("OCR processing failed: " + ocrError.message);
    }

    if (!rawText.trim()) {
      throw new Error("No text detected in the image");
    }

    // Debug: Log raw OCR text
    console.log("OCR RAW TEXT >>>", rawText);

    // Step 2: Format the extracted text using Gemini AI
    console.log("[OCR] Step 2/2: Formatting text with Gemini AI");
    const formatResponse = await fetch(`${API_URL}/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
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

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { problem, message, language } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const safeLanguage = language === "en" ? "English" : "Japanese";
    const problemText =
      (problem && (problem.question || problem.text)) ||
      (typeof problem === "string" ? problem : "");

    const prompt = `Problem: ${problemText}\n\nUser: ${message}\n\nPlease help solve this math problem step by step in ${safeLanguage}.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${API_URL}/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini Chat Error:", errorData);
      throw new Error(`Gemini Chat Error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate response" });
  }
});

app.listen(3333, () => {
  console.log("OCR server running on http://localhost:3333");
});
