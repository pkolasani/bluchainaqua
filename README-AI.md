# Blue Chain Aqua AI Assistant

The chatbot is production-ready for a static frontend deployed with Vercel serverless functions.

## Security

The Groq API key is **never stored in frontend source code**. Do not put a real key in `config.js`, `.env` committed to Git, HTML, or browser JavaScript.

The browser calls:
- `/api/chat` for AI answers
- `/api/transcribe` for voice transcription

Those server-side functions read `GROQ_API_KEY` from the deployment environment and call Groq.

## Local development

Use Vercel CLI so `/api/*` works locally:

```bash
npm install -g vercel
vercel dev
```

Then open the local URL printed by Vercel, rather than opening `index.html` directly.

Create a local `.env` file:

```env
GROQ_API_KEY=YOUR_NEW_KEY
GROQ_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
```

`.env` is ignored by Git.

## Vercel deployment

In Vercel, open the project:

**Settings → Environment Variables**

Add:

```text
GROQ_API_KEY = your new Groq key
GROQ_MODEL = openai/gpt-oss-120b
GROQ_STT_MODEL = whisper-large-v3-turbo
```

Then redeploy the project.

## GitHub

The repository can safely contain `config.js`, `ai-assistant.js`, and the `/api` functions because no Groq secret is embedded in them.

**Important:** the old Groq key was exposed in Git history. Revoke it and create a new key before deployment.
