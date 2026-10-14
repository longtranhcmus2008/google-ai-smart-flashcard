
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Smart Flashcard Backend is running!"
    });
});

// Generate a vocabulary flashcard
const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(word) {
    const delays = [1000, 2000];

    for (let attempt = 0; ; attempt++) {
        try {
            return await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: `Create an English vocabulary flashcard for the word "${word}".

Return the following sections with these exact labels:
Definition: [clear English definition]
Vietnamese meaning: [Vietnamese meaning]
Example: [one natural English example sentence]
Vietnamese translation: [Vietnamese translation of the example]

Keep each section concise and suitable for an English learner.
Do not omit any section.`
            });
        } catch (error) {
            const status = Number(error.status || error.statusCode);

            if (![429, 500, 502, 503, 504].includes(status)
                || attempt >= delays.length) {
                throw error;
            }

            console.warn(
                `Gemini returned ${status}. Retrying in ${delays[attempt]} ms.`
            );

            await sleep(delays[attempt]);
        }
    }
}
app.post("/generate", async (req, res) => {
    const rawWord = req.body?.word;

    if (typeof rawWord !== "string" || !rawWord.trim()) {
        return res.status(400).json({
            error: "Please provide a vocabulary word."
        });
    }

    const word = rawWord.trim();

    if (word.length > 100) {
        return res.status(400).json({
            error: "The vocabulary word must be 100 characters or fewer."
        });
    }

    try {
        const response = await generateWithRetry(word);

        const flashcard = response.text?.trim();

        if (!flashcard) {
            console.error("Gemini returned an empty response.");

            return res.status(502).json({
                error: "AI returned an empty response. Please try again."
            });
        }

        // Never log the API key or generated flashcard content.
        console.info("Flashcard generated successfully.");

        return res.json({
            word,
            flashcard
        });
    } catch (error) {
        const status = Number(error.status || error.statusCode);

        // Log only diagnostic information, not prompts or generated content.
        console.error("Gemini request failed:", {
            status: error.status,
            code: error.code,
            message: error.message
        });
        if (status === 429) {
            return res.status(429).json({
                error: "AI usage limit reached. Please wait and try again."
            });
        }

        if (
            status === 503 ||
            status === 502 ||
            error.code === "UNAVAILABLE" ||
            /temporarily unavailable|service unavailable/i.test(
                error.message || ""
            )
        ) {
            return res.status(503).json({
                error: "Gemini is temporarily unavailable. Please try again shortly."
            });
        }

        return res.status(500).json({
            error: "Could not generate the flashcard. Please try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Smart Flashcard backend listening on port ${PORT}`);
});
