
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// API kiểm tra server
app.get("/", (req, res) => {
    res.json({
        message: "Smart Flashcard Backend is running!"
    });
});

// API tạo flashcard bằng AI
app.post("/generate", async (req, res) => {
    try {
        const word = req.body.word;

        if (!word || typeof word !== "string" || !word.trim()) {
            return res.status(400).json({
                error: "Please provide a vocabulary word."
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `Create an English vocabulary flashcard for the word "${word.trim()}".

Return:
1. English definition
2. Vietnamese meaning
3. One example sentence in English
4. Vietnamese translation of the example sentence

Use clear, concise language suitable for an English learner.`
        });
        console.log("Gemini response received:", Boolean(response));
        console.log("Gemini response text:", response.text);

        res.json({
            word: word.trim(),
            flashcard: response.text
        });

    } catch (error) {
        console.error("Gemini API error:", error.message);

        const message = error.message || "";

        if (
            message.includes('"code":503') ||
            message.includes("UNAVAILABLE")
        ) {
            return res.status(503).json({
                error: "Gemini is temporarily busy. Please try again in a minute."
            });
        }

        res.status(500).json({
            error: "Could not generate the flashcard. Please try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
