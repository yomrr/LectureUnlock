import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { transcript, videoId } = await req.json();

    // Check agent output cache — split into 4 entries to avoid field size limits
    const outlineKey    = `${videoId}:student:outline`;
    const summariesKey  = `${videoId}:student:summaries`;
    const flashcardsKey = `${videoId}:student:flashcards`;
    const searchKey     = `${videoId}:student:searchIndex`;

    const [cachedOutline, cachedSummaries, cachedFlashcards, cachedSearch] = await Promise.all([
      base44.asServiceRole.entities.Cache.filter({ cache_key: outlineKey,    cache_type: 'agent_output' }),
      base44.asServiceRole.entities.Cache.filter({ cache_key: summariesKey,  cache_type: 'agent_output' }),
      base44.asServiceRole.entities.Cache.filter({ cache_key: flashcardsKey, cache_type: 'agent_output' }),
      base44.asServiceRole.entities.Cache.filter({ cache_key: searchKey,     cache_type: 'agent_output' }),
    ]);

    if (cachedOutline?.length > 0 && cachedSummaries?.length > 0 && cachedFlashcards?.length > 0 && cachedSearch?.length > 0) {
      console.log('Student cache HIT — attempting to parse cached result');
      try {
        const merged = {
          outline:     JSON.parse(cachedOutline[0].value),
          summaries:   JSON.parse(cachedSummaries[0].value),
          flashcards:  JSON.parse(cachedFlashcards[0].value),
          searchIndex: JSON.parse(cachedSearch[0].value),
        };
        if (merged.outline?.length > 0) {
          return Response.json({ result: merged });
        }
        console.log('Cache entries look empty, falling through to agent');
      } catch (e) {
        console.error('Cache parse error, falling through to agent:', e.message);
      }
    }
    console.log('Student cache MISS — running agent');

    if (!transcript || !videoId) {
      return Response.json({ error: 'Missing transcript or videoId' }, { status: 400 });
    }

    // Format transcript for LLM
    const transcriptText = Array.isArray(transcript)
      ? transcript.map(t => `[${formatTime(t.offset || t.start)}] ${t.text}`).join('\n')
      : JSON.stringify(transcript);

    // Quick lecture detection check
    const detectionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are evaluating whether a video transcript is from a lecture or educational video.

A valid lecture/educational video:
- Has a human speaker explaining, teaching, or presenting information
- Is typically longer than 2 minutes
- Contains substantive educational content (concepts, explanations, demonstrations)

NOT a valid lecture:
- Music videos (mostly song lyrics)
- Comedy sketches or entertainment with no educational value
- News clips or interviews with no educational framing
- Very short clips under 2 minutes with no educational substance
- Motivational speeches with no concrete educational content

Transcript sample (first 3000 chars):
${transcriptText.slice(0, 3000)}

Reply with ONLY a JSON object: { "is_lecture": true } or { "is_lecture": false }`,
      response_json_schema: {
        type: 'object',
        properties: { is_lecture: { type: 'boolean' } },
      },
    });

    if (detectionResult?.is_lecture === false) {
      return Response.json({ error: 'not_lecture' }, { status: 422 });
    }

    const prompt = `You must always produce your entire output in English regardless of the language of the transcript you receive. If the transcript is in another language, treat it as source material only and write all output in English. Never output any non-English text anywhere in your response.

You are an expert educational AI. You have received a timestamped YouTube lecture transcript.
Video ID: ${videoId}
YouTube base URL: https://www.youtube.com/watch?v=${videoId}

TRANSCRIPT:
${transcriptText.slice(0, 40000)}

MATH CONTENT RULE: When summarizing mathematical concepts, always explain what the math MEANS in plain English first, then show the formula. For example, instead of just writing log_B(A) = log_C(A) ÷ log_C(B), write: "You can convert any logarithm to a different base by dividing. For example, to calculate log base 2, divide log(A) by log(2) on any calculator." Make every formula human before making it symbolic. When writing formulas, wrap them in $...$ delimiters for proper rendering (e.g. $x^{2}$, $\log_2(8)$, $\sqrt{32}$).

Generate a comprehensive study tool in JSON format with these exact keys:

1. "outline": Array of objects with { timestamp: "HH:MM:SS", seconds: number, title: string, summary: string }
   - 6-10 key sections with meaningful titles

2. "summaries": Object with three keys:
   - "quick": 3-4 sentence overview (what it is, main argument, key takeaway)
   - "medium": 2-3 paragraph summary covering main topics
   - "full": 5-7 paragraph comprehensive summary with all key concepts

3. "flashcards": Array of 8-12 objects with { question: string, answer: string, timestamp: "HH:MM:SS", seconds: number }
   - Test real understanding, not just recall

4. "searchIndex": Array of objects with { topic: string, keywords: string[], timestamp: "HH:MM:SS", seconds: number, snippet: string }
   - 15-25 entries covering all major concepts for semantic search

Return ONLY valid JSON, no markdown, no code blocks.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          outline: { type: 'array' },
          summaries: { type: 'object' },
          flashcards: { type: 'array' },
          searchIndex: { type: 'array' },
        },
      },
      model: 'claude_sonnet_4_6',
    });

    // Unwrap if InvokeLLM nested result under a 'response' key
    const unwrapped = result?.response ?? result;
    console.log(`Result top-level keys: ${JSON.stringify(Object.keys(unwrapped ?? {}))}`);

    // Save to cache — only if ALL four fields have valid non-empty data
    const outlineValid     = unwrapped.outline?.length > 0;
    const summariesValid   = Object.keys(unwrapped.summaries || {}).length > 0;
    const flashcardsValid  = unwrapped.flashcards?.length > 0;
    const searchIndexValid = unwrapped.searchIndex?.length > 0;

    console.log('Saving student cache — outline:', unwrapped.outline?.length, 'flashcards:', unwrapped.flashcards?.length, 'summaries keys:', Object.keys(unwrapped.summaries || {}).length, 'searchIndex:', unwrapped.searchIndex?.length);

    if (outlineValid && summariesValid && flashcardsValid && searchIndexValid) {
      Promise.all([
        base44.asServiceRole.entities.Cache.create({ cache_key: outlineKey,    cache_type: 'agent_output', value: JSON.stringify(unwrapped.outline)     }),
        base44.asServiceRole.entities.Cache.create({ cache_key: summariesKey,  cache_type: 'agent_output', value: JSON.stringify(unwrapped.summaries)   }),
        base44.asServiceRole.entities.Cache.create({ cache_key: flashcardsKey, cache_type: 'agent_output', value: JSON.stringify(unwrapped.flashcards)  }),
        base44.asServiceRole.entities.Cache.create({ cache_key: searchKey,     cache_type: 'agent_output', value: JSON.stringify(unwrapped.searchIndex) }),
      ]).then(() => console.log('Student cache saved (4 entries)'))
        .catch(err => console.error('Student cache SAVE FAILED:', err.message));
    } else {
      console.log('Student cache NOT saved — one or more fields are empty, skipping cache write');
    }

    return Response.json({ result: unwrapped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatTime(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}