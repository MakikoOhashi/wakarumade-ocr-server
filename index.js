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
    let fullText = "";
    let centerText = "";
    let centerBox = null;
    let imageSize = null;
    let highlightBoxes = [];
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
      fullText = response?.textAnnotations?.[0]?.description || "";

      const page = response?.fullTextAnnotation?.pages?.[0];
      if (page?.width && page?.height) {
        imageSize = { width: page.width, height: page.height };
      }
      if (page?.blocks?.length && page.width && page.height) {
        const imageCenter = { x: page.width / 2, y: page.height / 2 };
        let bestBlock = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        const blocksWithBox = [];
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
          const blockWords = [];
          for (const paragraph of block.paragraphs || []) {
            for (const word of paragraph.words || []) {
              const text = (word.symbols || []).map((s) => s.text).join("");
              if (text) blockWords.push(text);
            }
          }

          blocksWithBox.push({
            block,
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
            center,
            text: blockWords.join(""),
          });
        }

        if (bestBlock) {
          const lines = [];
          const box = bestBlock?.boundingBox?.vertices || [];
          if (box.length) {
            const xs = box.map((v) => v?.x ?? 0);
            const ys = box.map((v) => v?.y ?? 0);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            centerBox = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            };
          }

          const baseBox = centerBox;
          if (baseBox) {
            const verticalThreshold = baseBox.height * 6;
            const centerX = baseBox.x + baseBox.width / 2;
            const candidates = blocksWithBox
              .filter((item) => {
                const dx = Math.abs(item.center.x - centerX);
                const dy = Math.abs(item.center.y - (baseBox.y + baseBox.height / 2));
                const text = item.text || "";
                const isAnswer = /答え|こたえ|答\b/.test(text);
                return dx < baseBox.width * 1.5 && dy < verticalThreshold && !isAnswer;
              })
              .sort((a, b) => a.minY - b.minY);

            const grouped = [];
            const gapThreshold = baseBox.height * 1.6;
            for (const item of candidates) {
              if (!grouped.length) {
                grouped.push(item);
                continue;
              }
              const prev = grouped[grouped.length - 1];
              const gap = item.minY - prev.maxY;
              if (gap > gapThreshold) break;
              grouped.push(item);
            }

            const endPattern = /[?？]|になりますか|なんかい|いくつ|何回|何こ|何さじ|何枚/;
            if (grouped.length) {
              const trimmed = [];
              for (const item of grouped) {
                trimmed.push(item);
                if (endPattern.test(item.text || "")) break;
              }
              highlightBoxes = trimmed.map((item) => ({
                x: item.minX,
                y: item.minY,
                width: item.maxX - item.minX,
                height: item.maxY - item.minY,
              }));
            }
          }

          for (const paragraph of bestBlock.paragraphs || []) {
            const words = [];
            for (const word of paragraph.words || []) {
              const text = (word.symbols || []).map((s) => s.text).join("");
              if (text) words.push(text);
            }
            if (words.length) lines.push(words.join(" "));
          }
          centerText = lines.join("\n");
        }
      }

      rawText = fullText || centerText;
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
                text: `以下の算数の問題テキストをJSON形式に整理してください:\n\n${fullText || rawText}\n\n形式: {problems:[{number,question}]}`,
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

    const normalize = (text) =>
      (text || "")
        .toLowerCase()
        .replace(/[\s、。．，,.\-–—・:;'"「」『』（）()\[\]{}!?！？]/g, "");

    const scoreMatch = (center, question) => {
      const a = normalize(center);
      const b = normalize(question);
      if (!a || !b) return 0;
      if (a.includes(b) || b.includes(a)) {
        const minLen = Math.min(a.length, b.length);
        const maxLen = Math.max(a.length, b.length);
        return 1 + minLen / maxLen;
      }
      const freq = new Map();
      for (const ch of a) freq.set(ch, (freq.get(ch) || 0) + 1);
      let common = 0;
      for (const ch of b) {
        const count = freq.get(ch) || 0;
        if (count > 0) {
          common += 1;
          freq.set(ch, count - 1);
        }
      }
      return common / Math.max(1, b.length);
    };

    let primaryIndex = 0;
    if (data?.problems?.length) {
      let bestScore = -1;
      data.problems.forEach((p, idx) => {
        const score = scoreMatch(centerText || fullText, p.question);
        if (score > bestScore) {
          bestScore = score;
          primaryIndex = idx;
        }
      });
    }

    res.json({
      ...data,
      primaryIndex,
      primaryBox: centerBox,
      highlightBoxes,
      imageSize,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

const getInitialLearningState = () => ({
  step: 1,
  retryCount: 0,
  hintLevel: 0,
  consecutiveSuccess: 0,
  consecutiveFailure: 0,
  tone: "neutral",
  mistakeType: "unknown",
  completed: false,
});

const extractNumbers = (text) => {
  const matches = String(text).match(/-?\d+(?:\.\d+)?/g) || [];
  return matches.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
};

const normalizeForMatch = (value) => {
  return String(value)
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[＋]/g, "+")
    .replace(/[－−]/g, "-")
    .replace(/\s+/g, "");
};

const detectOperation = (text) => {
  const t = String(text);
  const addKeywords = ["あわせて", "合わせて", "たす", "足し", "足す", "合計", "ぜんぶ", "全部", "合計", "total", "sum", "add", "plus"];
  const subKeywords = ["のこり", "残り", "ひく", "引き", "引く", "差", "difference", "minus", "subtract"];
  if (addKeywords.some((k) => t.includes(k))) return "add";
  if (subKeywords.some((k) => t.includes(k))) return "sub";
  return "unknown";
};

const detectOperationFromMessage = (message) => {
  const t = normalizeForMatch(message);
  if (/[＋+]/.test(t) || /足(し|す)|たす/.test(t)) return "add";
  if (/[−-]/.test(t) || /引(き|く)|ひく/.test(t)) return "sub";
  if (t.includes("ぜんぶ") || t.includes("全部")) return "add";
  if (t.includes("のこり") || t.includes("残り")) return "sub";
  return "unknown";
};

const extractFirstNumberFromMessage = (message) => {
  const match = String(message).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isNaN(value) ? null : value;
};

const computeCorrectAnswer = (problemText) => {
  const numbers = extractNumbers(problemText);
  if (numbers.length < 2) return null;
  const op = detectOperation(problemText);
  if (op === "add") {
    return numbers.reduce((sum, n) => sum + n, 0);
  }
  if (op === "sub") {
    return numbers[0] - numbers[1];
  }
  return null;
};

const chooseTonePrefix = (tone, lang) => {
  if (lang === "English") {
    if (tone === "supportive") return "You're doing great. ";
    if (tone === "energetic") return "Nice! ";
    return "";
  }
  if (tone === "supportive") return "だいじょうぶ！";
  if (tone === "energetic") return "いいね！";
  return "";
};

const buildQuestion = ({ lang, state, problemText, message }) => {
  const prefix = chooseTonePrefix(state.tone, lang);
  const numbers = extractNumbers(problemText);
  const op = detectOperation(problemText);

  if (state.completed) {
    const yes = /はい|うん|次|すす|進/.test(message);
    if (yes) {
      return lang === "English"
        ? `${prefix}Ready for the next problem?`
        : `${prefix}次(つぎ)の問題(もんだい)に進(すす)む？`;
    }
    return lang === "English"
      ? `${prefix}Want to try this one again?`
      : `${prefix}もう一度(いちど)やってみる？`;
  }

  if (lang === "English") {
    if (state.step === 1) {
      if (state.hintLevel === 0) return `${prefix}Is this an addition or subtraction problem?`;
      if (state.hintLevel === 1 && op === "add") return `${prefix}Words like "total" often mean addition. Which is it?`;
      if (state.hintLevel === 1 && op === "sub") return `${prefix}Words like "remaining" often mean subtraction. Which is it?`;
      return `${prefix}Look for words like "total" or "remaining". Which operation fits?`;
    }
    if (state.step === 2) {
      if (state.hintLevel === 0) return `${prefix}What numbers appear in the problem?`;
      if (state.hintLevel === 1 && numbers.length >= 2) return `${prefix}I see ${numbers[0]} and ${numbers[1]}. Can you say them?`;
      return `${prefix}Which two numbers should we use?`;
    }
    if (state.step === 3) {
      if (state.hintLevel === 0) return `${prefix}What is the result when you combine those numbers?`;
      if (state.hintLevel === 1 && op === "add") return `${prefix}Try adding the two numbers. What do you get?`;
      if (state.hintLevel === 1 && op === "sub") return `${prefix}Try subtracting the numbers. What do you get?`;
      return `${prefix}Compute the result. What number do you get?`;
    }
    return `${prefix}Can you explain why that answer makes sense?`;
  }

  if (lang === "Japanese") {
    if (state.step === 1) {
      if (state.hintLevel === 0) return `${prefix}さいごは「ぜんぶ」？それとも「のこり」？`;
      if (state.hintLevel === 1 && op === "add") return `${prefix}「ぜんぶ」や「あわせて」は足(た)し算(ざん)だよ。どっち？`;
      if (state.hintLevel === 1 && op === "sub") return `${prefix}「のこり」は引(ひ)き算(ざん)だよ。どっち？`;
      return `${prefix}「ぜんぶ」か「のこり」の言葉(ことば)に注目(ちゅうもく)してみよう。どっち？`;
    }
    if (state.step === 2) {
      if (state.hintLevel === 0) return `${prefix}問題(もんだい)に出(で)てくる数(かず)は何(なん)と何(なに)かな？`;
      if (state.hintLevel === 1 && numbers.length >= 2) return `${prefix}${numbers[0]}と${numbers[1]}が出(で)てくるよ。言(い)える？`;
      return `${prefix}使(つか)う数(かず)を2つ言(い)ってみよう。`;
    }
    if (state.step === 3) {
      if (state.hintLevel === 0) return `${prefix}その2つで、ぜんぶ何(なん)になるかな？`;
      if (state.hintLevel === 1 && op === "add") return `${prefix}たし算(ざん)で計算(けいさん)してみよう。いくつ？`;
      if (state.hintLevel === 1 && op === "sub") return `${prefix}ひき算(ざん)で計算(けいさん)してみよう。いくつ？`;
      return `${prefix}数(かず)を合わせるといくつ？`;
    }
    return `${prefix}どうしてそう思(おも)ったのか、教(おし)えてくれる？`;
  }

};

const isEmotionalMessage = (message) => {
  const t = normalizeForMatch(message);
  return /きらい|いや|むずかし|わから|できない|つかれ|こわい|おもしろくない|やだ/.test(t);
};

const buildEmpathyLine = (lang) => {
  if (lang === "English") {
    return "I hear you. ";
  }
  return "そうなんだね。";
};

const isUnsafePhrasing = (text = "") => {
  const t = String(text);
  if (!t.trim()) return true;
  if (!/[？?]$/.test(t.trim())) return true;
  if (/[=＝]/.test(t)) return true;
  if (/答え|解答|答えは|結果/.test(t)) return true;
  return false;
};

const buildStylePrompt = ({ lang, coreQuestion, empathyLine, tone }) => {
  if (lang === "English") {
    return `Rewrite the message to be gentle, warm, and child-friendly. Keep the meaning.\n- End with a question mark.\n- Do NOT add equations or final answers.\n- Keep it short (<= 120 chars).\n- If an empathy line is provided, include it at the start.\n\nEmpathy: ${empathyLine || ""}\nCore: ${coreQuestion}\nTone: ${tone}\n\nOutput only the rewritten message.`;
  }
  return `次の文を、子(こ)ども向(む)けにやさしく、少(すこ)し自由(じゆう)に言(い)い換(か)えてください。\n- 意味(いみ)は変(か)えない。\n- 文末(ぶんまつ)は必(かなら)ず「？」で終(お)える。\n- 計算式(けいさんしき)や答(こた)えは書(か)かない。\n- 短(みじか)め（120字以内）。\n- 共感文(きょうかんぶん)があれば先頭(せんとう)に入(い)れる。\n\n共感: ${empathyLine || ""}\n核(かく): ${coreQuestion}\nトーン: ${tone}\n\n言(い)い換(か)え文だけを書(か)いてください。`;
};

const evaluateStep = ({ state, problemText, message }) => {
  const msg = normalizeForMatch(message);
  const opFromMessage = detectOperationFromMessage(msg);
  const numbers = extractNumbers(problemText);
  const expectedOp = detectOperation(problemText);
  const correctAnswer = computeCorrectAnswer(problemText);

  if (state.step === 1) {
    if (opFromMessage !== "unknown") return { success: true };
    return { success: false, mistakeType: "misunderstanding" };
  }

  if (state.step === 2) {
    if (numbers.length >= 2) {
      const a = String(numbers[0]);
      const b = String(numbers[1]);
      if (msg.includes(a) && msg.includes(b)) return { success: true };
    }
    return { success: false, mistakeType: "misunderstanding" };
  }

  if (state.step === 3) {
    const answer = extractFirstNumberFromMessage(msg);
    if (answer === null) return { success: false, mistakeType: "misunderstanding" };
    if (typeof correctAnswer === "number") {
      if (Math.abs(answer - correctAnswer) < 1e-9) return { success: true };
      return { success: false, mistakeType: "calculation_error" };
    }
    return { success: true };
  }

  if (state.step === 4) {
    if (/だから|ので|たす|足(し|す)|引(き|く)|ひく/.test(msg)) return { success: true };
    return { success: false, mistakeType: "misunderstanding" };
  }

  return { success: false, mistakeType: "unknown" };
};

const updateLearningState = (state, result) => {
  const next = { ...state };
  if (result.success) {
    next.consecutiveSuccess += 1;
    next.consecutiveFailure = 0;
    next.retryCount = 0;
    next.hintLevel = 0;
    if (next.step < 4) {
      next.step += 1;
    } else {
      next.completed = true;
    }
  } else {
    next.consecutiveFailure += 1;
    next.consecutiveSuccess = 0;
    next.retryCount += 1;
    next.mistakeType = result.mistakeType || "unknown";
    if (next.retryCount >= 2 && next.hintLevel < 2) {
      next.hintLevel += 1;
      next.retryCount = 0;
    }
  }

  if (next.consecutiveFailure >= 2) {
    next.tone = "supportive";
  } else if (next.consecutiveSuccess >= 2) {
    next.tone = "energetic";
  } else {
    next.tone = "neutral";
  }

  return next;
};

app.post("/chat", async (req, res) => {
  try {
    const { problem, message, language, learningState } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const problemText =
      (problem && (problem.question || problem.text)) ||
      (typeof problem === "string" ? problem : "");

    const lang = language === "en" ? "English" : "Japanese";
    const state = learningState && typeof learningState === "object"
      ? { ...getInitialLearningState(), ...learningState }
      : getInitialLearningState();

    const result = evaluateStep({ state, problemText, message });
    const nextState = updateLearningState(state, result);
    const coreQuestion = buildQuestion({ lang, state: nextState, problemText, message });
    const empathyLine = isEmotionalMessage(message) ? buildEmpathyLine(lang) : "";
    const stylePrompt = buildStylePrompt({
      lang,
      coreQuestion,
      empathyLine,
      tone: nextState.tone,
    });

    let text = coreQuestion;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_URL}/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: stylePrompt }],
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const candidate = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!isUnsafePhrasing(candidate)) {
          text = candidate.trim();
        }
      }
    } catch (err) {
      console.error("Gemini Style Error:", err.message);
    }

    if (isUnsafePhrasing(text)) {
      const safePrefix = empathyLine ? `${empathyLine}` : "";
      text = `${safePrefix}${coreQuestion}`.replace(/。?$/, "").trim();
      if (!/[？?]$/.test(text)) text = `${text}？`;
    }

    return res.json({ text, learningState: nextState });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate response" });
  }
});

app.listen(3333, () => {
  console.log("OCR server running on http://localhost:3333");
});
