# Google AI Smart Flashcard

AI-powered English vocabulary flashcards using Google Gemini.

## Live demo
- Frontend: https://ai-smart-flashcard.web.app
- Backend health: https://google-ai-smart-flashcard.onrender.com

## Features
- Generate vocabulary definitions, Vietnamese meanings, examples and translations.
- Responsive desktop/mobile interface.
- Local browser history using `localStorage` (up to 50 cards).
- Copy and delete individual cards; clear local history.
- Loading feedback, timeout handling, and user-facing errors.

## Stack
HTML, CSS, vanilla JavaScript, Node.js, Express, Gemini API, Firebase Hosting, Render.

## Architecture
The browser sends a word to the Express `/generate` endpoint. The backend calls Gemini and returns generated text. The Gemini API key is stored as a server-side environment variable on Render.

## Local development
1. In `backend/`, run `npm install`.
2. Create `backend/.env` with `GEMINI_API_KEY=your_key_here`.
3. Run `node server.js`.
4. Serve the `public/` directory with a local static server.

## Deploy
Frontend:
```bash
firebase deploy --only hosting
```
Source:
```bash
git add public README.md
git commit -m "Improve responsive UI and flashcard history"
git push
```

## Privacy and data
Flashcard history is stored in `localStorage` on the current browser/device. It is not currently synced across devices or saved to Firestore. Clearing browser site data may erase it.

Never commit `.env` files or expose `GEMINI_API_KEY` in frontend code.
