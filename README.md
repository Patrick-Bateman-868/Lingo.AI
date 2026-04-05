# LingoQuest AI - English Learning Platform

An AI-powered English learning platform with gamified levels, voice interaction, and personalized coaching.

## Features
- **5 Levels of Difficulty**: From anxiety-reducing slow speech to native-level complex discussions.
- **Voice Interaction**: Speak to the AI and hear it respond naturally.
- **Real-time Translation**: Hover over AI messages to translate words and idioms into Russian.
- **Progress Tracking**: Earn stars and unlock new levels.

## Installation (Local Setup)

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd lingoquest-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *You can get an API key for free at [aistudio.google.com](https://aistudio.google.com/).*

4. **Run the application**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## FAQ

### Can I use this for free?
Yes! The **Gemini API** has a generous free tier that allows you to use the models (Flash and Pro) for free within certain rate limits. For personal learning, the free tier is usually more than enough.

### Can I put this code on GitHub?
Absolutely! You can push this code to a public or private GitHub repository. 
**Important**: Never commit your `.env` file or your actual API key to GitHub. Use the `.env.example` file as a template for others.

### How does the translation work?
The app uses Gemini to translate phrases and explain idioms in context, ensuring you get the most accurate meaning for your learning level.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js (Express), SQLite (better-sqlite3).
- **AI**: Google Gemini SDK (@google/genai).
