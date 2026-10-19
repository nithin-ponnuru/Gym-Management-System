const axios = require('axios');

// @desc Send a message to the AI assistant and receive a reply
// @route POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return res.status(503).json({
        success: false,
        message: 'AI Assistant is not configured. Please add your OpenRouter API key to server/.env and restart the server.',
      });
    }

    const systemPrompt = `You are FitAI, an expert gym and fitness assistant integrated into a professional Gym Management System. You help gym staff, trainers, and members with:
- Creating personalized workout plans and exercise routines
- Providing nutrition and diet guidance
- Suggesting training schedules for different fitness goals
- Explaining proper exercise form and technique
- Recommending recovery strategies
- Answering gym management questions

Be concise, professional, and motivating. Format your responses with clear sections when appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // Primary: Claude Opus 4.5 (paid — uses your OpenRouter credits/API key)
    // Fallbacks: free models in case of issues
    const modelsToTry = [
      'anthropic/claude-opus-4-5',
      'anthropic/claude-haiku-4-5',
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'nvidia/nemotron-3.5-lightning:free',
    ];

    const RETRYABLE_STATUSES = [400, 404, 429, 503];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[AI] Trying model: ${model}`);
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model,
            messages,
            max_tokens: 1024,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5000',
              'X-Title': 'FitPro Gym Management',
            },
            timeout: 30000,
          }
        );

        const reply = response.data.choices?.[0]?.message?.content || 'No response from AI';
        console.log(`[AI] Success with model: ${model}`);
        return res.json({
          success: true,
          data: { reply, model: response.data.model || model },
        });
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        console.warn(`[AI] Model ${model} failed (HTTP ${status}) — trying next model...`);

        if (RETRYABLE_STATUSES.includes(status)) {
          continue; // try next model in the list
        }

        // Auth (401) or credits (402) — no point retrying other models
        throw err;
      }
    }

    // All models exhausted
    console.error('[AI] All models failed. Last error status:', lastError?.response?.status);
    throw lastError;

  } catch (error) {
    const status = error.response?.status;
    const errData = error.response?.data;

    if (status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OpenRouter API key. Please check your key in server/.env',
      });
    }
    if (status === 402) {
      return res.status(402).json({
        success: false,
        message: 'OpenRouter credits exhausted. Please top up your account at openrouter.ai',
      });
    }
    if (status === 429) {
      return res.status(429).json({
        success: false,
        message: 'All free AI models are currently rate-limited. Please wait a minute and try again.',
      });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI request timed out. Please try again.',
      });
    }

    console.error('[AI Controller] Error:', status, errData?.error?.message || error.message);
    return res.status(500).json({
      success: false,
      message: errData?.error?.message || 'AI service unavailable. Please try again later.',
    });
  }
};

module.exports = { chat };
