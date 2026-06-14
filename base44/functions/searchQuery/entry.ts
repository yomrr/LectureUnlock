import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { videoId, query, searchIndex, language } = await req.json();

    if (!videoId || !query) {
      return Response.json({ error: 'Missing videoId or query' }, { status: 400 });
    }

    const LANG_NAMES = { es: 'Spanish', fr: 'French', ar: 'Arabic', de: 'German' };
    const langName = LANG_NAMES[language] || null;
    const langInstruction = langName
      ? `IMPORTANT: You MUST respond entirely in ${langName}. All "response" text and "explanation" text in results must be written in ${langName}. Do not use English in any text field.`
      : '';

    const normalizedQuery = query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const cacheKey = `${videoId}:${language || 'en'}:${normalizedQuery}`;

    // Check cache
    const cached = await base44.asServiceRole.entities.Cache.filter({
      cache_key: cacheKey,
      cache_type: 'search_query',
    });
    if (cached && cached.length > 0) {
      return Response.json({ result: JSON.parse(cached[0].value) });
    }

    const indexText = JSON.stringify(searchIndex || []);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${langInstruction}

You are an intelligent Q&A assistant for a lecture video. The user has typed a query. Your job is to classify it and respond appropriately.

User query: "${normalizedQuery}"

Lecture search index (topics, keywords, timestamps):
${indexText}

STEP 1 — Classify the query into exactly one of these categories:
- "greeting": hi, hello, thanks, hey, etc.
- "invalid": gibberish, single characters, random symbols, too short to interpret
- "unrelated": a real question but clearly about a topic NOT covered in this lecture
- "study_guidance": meta-questions about how to study, what's most important, how to remember, what to focus on
- "lecture_question": a genuine question about something taught in the lecture

STEP 2 — Respond based on category:

If "greeting":
  Return: { "category": "greeting", "response": "Hey! Ask me anything about this lecture and I'll find the exact moment that covers it.", "results": [] }

If "invalid":
  Return: { "category": "invalid", "response": "That doesn't look like a question. Try asking something like 'What is the main concept explained in this lecture?'", "results": [] }

If "unrelated":
  HARD STOP. Do not search, do not retrieve, do not synthesize anything.
  Infer the lecture's main topic from the search index keywords and mention it in the response.
  Return EXACTLY: { "category": "unrelated", "response": "This topic was not covered in this lecture. Try asking about [main topic inferred from search index].", "results": [] }
  Do not include any timestamps, explanations, or results. Empty results array only.

If "study_guidance":
  Write a 3-5 sentence synthesis answer drawn from across the WHOLE lecture (not just one moment).
  Then identify the 3 most relevant timestamps from the search index — pick 3 distinct moments that collectively cover the most important ground.
  Each must have a short label (3-8 words) describing what that moment covers.
  Never omit the 3 timestamps — this is required for study guidance questions.
  Return: { "category": "study_guidance", "response": "...", "results": [{ "label": "...", "explanation": "...", "timestamp": "HH:MM:SS", "seconds": number }, { "label": "...", "explanation": "...", "timestamp": "HH:MM:SS", "seconds": number }, { "label": "...", "explanation": "...", "timestamp": "HH:MM:SS", "seconds": number }] }

If "lecture_question":
  Search by MEANING not keywords. The user may paraphrase — match semantically.
  - If one clear best match: return 1 result
  - If the topic appears at multiple distinct points: return up to 3 results, each with a short label distinguishing them
  - Never return 0 results — if unsure, return the closest match with a note that it may be partially relevant
  - Each result must have a 3-5 sentence explanation grounded in what was actually said in the transcript. Do not invent information.
  Return: { "category": "lecture_question", "response": null, "results": [{ "label": "...", "explanation": "...", "timestamp": "HH:MM:SS", "seconds": number }, ...] }

Return ONLY valid JSON matching this schema. No markdown, no code blocks.`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          response: {},
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                explanation: { type: 'string' },
                timestamp: { type: 'string' },
                seconds: { type: 'number' },
              },
            },
          },
        },
      },
    });

    // Save to cache (fire and forget)
    base44.asServiceRole.entities.Cache.create({
      cache_key: cacheKey,
      cache_type: 'search_query',
      value: JSON.stringify(result),
    }).catch(() => {});

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});