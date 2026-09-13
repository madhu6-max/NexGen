const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// In-memory cache for audio buffers to avoid repeated calls
const audioCache = new Map();

// Maximum input length (matches provider per-request limits and bounds cache keys)
const MAX_TEXT_LENGTH = 300;
// Maximum accepted upstream audio payload (provider responses are far smaller)
const MAX_AUDIO_BYTES = 1024 * 1024;

// GET /api/voice/tts?text=...&lang=en|hi|te
// Authenticated users only: this endpoint proxies a third-party TTS provider
// and must not serve as an open proxy. The destination is a fixed provider
// URL — no client-supplied hostname, URL, or protocol is ever honored.
router.get('/tts', authenticate, async (req, res) => {
  try {
    const { text, lang = 'en' } = req.query;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text query parameter is required.' });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.` });
    }

    const langCodeMap = {
      en: 'en-IN',
      hi: 'hi',
      te: 'te'
    };

    const targetLang = langCodeMap[lang] || 'en-IN';
    const cacheKey = `${targetLang}_${trimmedText}`;

    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': cached.length,
        'Cache-Control': 'public, max-age=86400'
      });
      return res.send(cached);
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmedText)}&tl=${targetLang}&client=tw-ob`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!response.ok) {
      console.error(`TTS provider failure: HTTP ${response.status}`);
      return res.status(502).json({ error: 'TTS provider is currently unavailable. Please try again.' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('audio') || buffer.length === 0 || buffer.length > MAX_AUDIO_BYTES) {
      console.error('TTS provider returned an unexpected payload.');
      return res.status(502).json({ error: 'TTS provider returned an invalid response. Please try again.' });
    }

    // Save in cache (cap cache at 200 items)
    if (audioCache.size > 200) {
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, buffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400'
    });

    res.send(buffer);
  } catch (err) {
    console.error('TTS Route Error:', err.message);
    res.status(500).json({ error: 'TTS synthesis failed. Please try again.' });
  }
});

module.exports = router;
