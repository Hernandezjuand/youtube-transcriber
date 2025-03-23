# YouTube Transcriber & Summarizer

A powerful web application that extracts and summarizes content from YouTube videos using AI. Built with Next.js and modern web technologies.

## Features

- Transcribe any YouTube video with a simple URL
- Generate comprehensive AI-powered summaries
- View key points, highlights, and conclusions
- Clean, modern UI with responsive design
- Full transcript display with custom formatting

## Technologies Used

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- SUPADATA API for YouTube transcription
- DeepSeek AI for content summarization

## Setup & Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your API keys:
   ```
   SUPADATA_API_KEY=your_supadata_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Navigate to the application in your browser
2. Paste a YouTube URL in the input field
3. Click "Transcribe Video"
4. View the generated summary and full transcript

## Deployment

The application can be deployed to Vercel or any other platform that supports Next.js applications.

```bash
npm run build
npm run start
```

## License & Attribution

© 2024 Juan Diego Hernandez. All rights reserved.

This project and its contents are protected by copyright law. Unauthorized use, reproduction, or distribution is prohibited.

## Contact

For any inquiries, please contact Juan Diego Hernandez.
