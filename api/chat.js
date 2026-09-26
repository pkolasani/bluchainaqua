export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || !Array.isArray(body.messages)) {
      return res.status(400).json({ error: 'Invalid chat request.' });
    }

    // Only allow the model configured by the server. The frontend value is
    // accepted for compatibility but never controls the API key or endpoint.
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: Number.isFinite(body.temperature) ? body.temperature : 0.3,
        max_completion_tokens: Number.isFinite(body.max_completion_tokens)
          ? body.max_completion_tokens
          : 900
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq chat error:', response.status, data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Groq request failed.'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Unable to contact the AI service.' });
  }
}
