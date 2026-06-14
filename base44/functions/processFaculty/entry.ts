import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { transcript, videoId } = await req.json();

    if (!videoId) {
      return Response.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Check agent output cache (split into scorecard + details to avoid size limits)
    const scorecardKey = `${videoId}:faculty:scorecard`;
    const detailsKey = `${videoId}:faculty:details`;
    console.log(`Checking faculty cache for videoId: ${videoId}`);
    const [cachedScorecard, cachedDetails] = await Promise.all([
      base44.asServiceRole.entities.Cache.filter({ cache_key: scorecardKey, cache_type: 'agent_output' }),
      base44.asServiceRole.entities.Cache.filter({ cache_key: detailsKey, cache_type: 'agent_output' }),
    ]);
    console.log(`Scorecard cache read: ${JSON.stringify(cachedScorecard)}`);
    console.log(`Details cache read: ${JSON.stringify(cachedDetails)}`);
    if (cachedScorecard?.length > 0 && cachedDetails?.length > 0) {
      console.log('Faculty cache HIT — returning merged cached result');
      const scorecard = JSON.parse(cachedScorecard[0].value);
      const details = JSON.parse(cachedDetails[0].value);
      return Response.json({ result: { ...scorecard, dimensions: details } });
    }
    console.log('Faculty cache MISS — running agent');

    if (!transcript) {
      return Response.json({ error: 'Missing transcript' }, { status: 400 });
    }

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

    const prompt = `You are a private pedagogical coach for university faculty. You receive a timestamped transcript from a lecture. Your job is to grade the lecture across five dimensions based purely on what the transcript reveals. You cannot assess actual audio quality or visual elements directly — only what the transcript signals about them.

Always produce your entire output in English regardless of the language of the transcript. Never output any non-English text anywhere in your response.

Video ID: ${videoId}

TRANSCRIPT:
${transcriptText.slice(0, 40000)}

Grade each of these five dimensions with a letter grade (A, B, C, D, or F) and a numeric score out of 10:

1. DELIVERY QUALITY
What the transcript reveals: filler words (um, uh, like), mid-thought hesitations, self-interruptions, restarts, informal language, verbal tics. A lecture with clean confident delivery scores high. Heavy filler and self-interruption scores low.

Rubric:
A (9-10): Minimal filler, confident delivery throughout, no self-interruptions, professional tone maintained
B (7-8): Occasional filler or hesitation, mostly clean delivery, minor informal moments
C (5-6): Noticeable filler words, several self-interruptions, inconsistent tone
D (3-4): Frequent filler, multiple derailed sentences, unprofessional language patterns
F (1-2): Pervasive filler and hesitation, delivery significantly undermines content comprehension

2. VISUAL NARRATION
What the transcript reveals: how well the instructor verbally describes what is on screen. Phrases like 'as you can see here' or 'this equals' without reading what it equals reveal poor visual narration. Explicit verbal narration of all written content scores high.

Rubric:
A (9-10): All written content explicitly narrated, no assumption that students can see the screen
B (7-8): Most content narrated, minor gaps where visual references are made without full explanation
C (5-6): Several moments where written content is shown but not fully verbalized
D (3-4): Frequent visual-only references, audio-only learners would miss significant content
F (1-2): Lecture is largely incomprehensible without seeing the screen

3. LECTURE DEPTH
What the transcript reveals: quality of explanations, density of examples, coverage of concepts, whether the instructor goes beyond surface-level description to build genuine understanding.

Rubric:
A (9-10): Rich explanations, multiple examples per concept, builds genuine understanding beyond formulas
B (7-8): Good explanations with examples, some concepts could go deeper
C (5-6): Surface-level explanations, limited examples, concepts introduced but not fully unpacked
D (3-4): Minimal explanation, mostly procedural without conceptual grounding
F (1-2): No meaningful explanation, content listed without any teaching

4. ACCURACY
What the transcript reveals: factual errors, arithmetic mistakes, self-contradictions, unresolved errors, moments where the instructor says things like 'you get the point' after a clear mistake.

Rubric:
A (9-10): No detectable errors, all worked examples verified correctly
B (7-8): Minor imprecision but no factual errors, self-corrects any mistakes
C (5-6): One or two errors that are acknowledged but not fully corrected
D (3-4): Multiple errors, some unresolved, could actively mislead students
F (1-2): Significant factual errors that are never corrected and would cause student confusion

5. PACING AND STRUCTURE
What the transcript reveals: signposting between topics, clear transitions, stated learning objectives, logical flow, closing summary, whether the lecture feels organized or improvised.

Rubric:
A (9-10): Clear learning objectives stated upfront, strong signposting throughout, logical flow, proper closing summary
B (7-8): Generally well structured with minor gaps in signposting or closure
C (5-6): Some structure visible but transitions are abrupt and objectives unstated
D (3-4): Lecture feels improvised, topics jump without connection, no clear arc
F (1-2): No discernible structure, lecture is confusing to follow

For each dimension produce an object with these exact keys:
- letter_grade: "A", "B", "C", "D", or "F"
- numeric_score: number 1-10
- summary: 2-3 sentence explanation of the grade
- rubric: the full rubric text for this dimension showing all five grade levels
- doing_well: array of 3-5 short phrases of what the lecture does well in this dimension
- lacking: array of 3-5 short actionable items the faculty member should improve
- content_errors: array of objects { description: string, timestamp: string (HH:MM:SS), seconds: number } — ONLY clear factual/arithmetic errors, not style issues. Empty array if none.
- suggested_rewrites: array of objects { original: string, suggested: string, timestamp: string (HH:MM:SS), seconds: number, dimension: string }

Also produce these top-level fields:
- overall_grade: letter grade A through F
- overall_score: number 1-10
- overall_summary: 3-4 sentence overall assessment
- strengths: array of 4-6 strings of things the lecture does genuinely well overall
- action_items: array of objects { priority: number, title: string, description: string, dimension: string, timestamp: string or null, seconds: number or null } — prioritized most critical first

Return ONLY valid JSON with this exact structure:
{
  "overall_grade": "...",
  "overall_score": ...,
  "overall_summary": "...",
  "strengths": [...],
  "action_items": [...],
  "dimensions": {
    "delivery": { "letter_grade": "...", "numeric_score": ..., "summary": "...", "rubric": "...", "doing_well": [...], "lacking": [...], "content_errors": [...], "suggested_rewrites": [...] },
    "visual_narration": { ... },
    "depth": { ... },
    "accuracy": { ... },
    "pacing": { ... }
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_grade: { type: 'string' },
          overall_score: { type: 'number' },
          overall_summary: { type: 'string' },
          strengths: { type: 'array' },
          action_items: { type: 'array' },
          dimensions: { type: 'object' },
        },
      },
      model: 'claude_sonnet_4_6',
    });

    // Unwrap if InvokeLLM nested result under a 'response' key
    const unwrapped = result?.response ?? result;
    console.log(`Result top-level keys: ${JSON.stringify(Object.keys(unwrapped ?? {}))}`);
    console.log(`overall_grade=${unwrapped?.overall_grade}, overall_score=${unwrapped?.overall_score}, dimensions keys=${JSON.stringify(Object.keys(unwrapped?.dimensions ?? {}))}`);

    // Save to cache split into two entries to avoid field size limits
    const scorecard = {
      overall_grade: unwrapped.overall_grade,
      overall_score: unwrapped.overall_score,
      overall_summary: unwrapped.overall_summary,
      strengths: unwrapped.strengths,
      action_items: unwrapped.action_items,
    };
    const details = unwrapped.dimensions;
    console.log(`Scorecard before save: ${JSON.stringify(scorecard)}`);
    console.log(`Details before save (keys): ${JSON.stringify(Object.keys(details ?? {}))}`)

    try {
      const [scorecardSave, detailsSave] = await Promise.all([
        base44.asServiceRole.entities.Cache.create({ cache_key: scorecardKey, cache_type: 'agent_output', value: JSON.stringify(scorecard) }),
        base44.asServiceRole.entities.Cache.create({ cache_key: detailsKey, cache_type: 'agent_output', value: JSON.stringify(details) }),
      ]);
      console.log(`Scorecard cache save result: ${JSON.stringify(scorecardSave)}`);
      console.log(`Details cache save result: ${JSON.stringify(detailsSave)}`);
    } catch (cacheErr) {
      console.error(`Faculty cache SAVE FAILED: ${cacheErr.message}`);
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