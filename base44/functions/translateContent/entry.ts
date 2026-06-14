import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const CHUNK_SIZE = 50; // Stay well under Google's 128-string and character limits

async function googleTranslateChunk(texts, targetLang) {
  const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
  const response = await fetch(`${TRANSLATE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, target: targetLang, format: 'text' }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Translate API error ${response.status}: ${body}`);
  }
  const data = await response.json();
  return data.data.translations.map(t => t.translatedText);
}

// Splits into chunks, translates in parallel, reassembles in order
async function translateAll(texts, targetLang) {
  if (texts.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    chunks.push(texts.slice(i, i + CHUNK_SIZE));
  }
  const results = await Promise.all(chunks.map(chunk => googleTranslateChunk(chunk, targetLang)));
  return results.flat();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { videoId, language, content } = await req.json();

    if (!videoId || !language || !content) {
      return Response.json({ error: 'Missing videoId, language, or content' }, { status: 400 });
    }

    // Cache check
    const cacheKey = `${videoId}:student:${language}`;
    const cached = await base44.asServiceRole.entities.Cache.filter({
      cache_key: cacheKey,
      cache_type: 'agent_output',
    });
    if (cached && cached.length > 0) {
      return Response.json({ translated: JSON.parse(cached[0].value) });
    }

    const { outline = [], summaries = {}, flashcards = [], searchIndex = [] } = content;

    // ---------------------------------------------------------------
    // BUILD ORDERED BATCH — track every segment's start index exactly
    // ---------------------------------------------------------------
    const segments = []; // { key, texts: string[] } — in insertion order

    // 1. Outline main titles
    const outlineTitlesStart = segments.length;
    segments.push(...outline.map((item, i) => ({ key: `outline_title_${i}`, text: item.title || '' })));

    // 2. Outline summaries
    const outlineSummariesStart = segments.length;
    segments.push(...outline.map((item, i) => ({ key: `outline_summary_${i}`, text: item.summary || '' })));

    // 3. Subtopic titles — flattened, track which outline item each belongs to
    const subtopicMeta = []; // { outlineIdx, subIdx }
    const subtopicsStart = segments.length;
    outline.forEach((item, i) => {
      (item.subtopics || []).forEach((sub, j) => {
        const title = typeof sub === 'string' ? sub : (sub.title || '');
        segments.push({ key: `subtopic_${i}_${j}`, text: title });
        subtopicMeta.push({ outlineIdx: i, subIdx: j });
      });
    });

    // 4. Summaries (quick, medium, full)
    const summaryKeys = ['quick', 'medium', 'full'];
    const summariesStart = segments.length;
    summaryKeys.forEach(k => segments.push({ key: `summary_${k}`, text: summaries[k] || '' }));

    // 5. Flashcard questions
    const flashcardQStart = segments.length;
    flashcards.forEach((f, i) => segments.push({ key: `fc_q_${i}`, text: f.question || '' }));

    // 6. Flashcard answers
    const flashcardAStart = segments.length;
    flashcards.forEach((f, i) => segments.push({ key: `fc_a_${i}`, text: f.answer || '' }));

    // 7. SearchIndex topics
    const searchTopicsStart = segments.length;
    searchIndex.forEach((s, i) => segments.push({ key: `si_topic_${i}`, text: s.topic || '' }));

    // 8. SearchIndex snippets
    const searchSnippetsStart = segments.length;
    searchIndex.forEach((s, i) => segments.push({ key: `si_snippet_${i}`, text: s.snippet || '' }));

    const allTexts = segments.map(s => s.text);

    // ---------------------------------------------------------------
    // TRANSLATE — chunked to avoid Google's limits
    // ---------------------------------------------------------------
    let translated;
    try {
      translated = await translateAll(allTexts, language);
    } catch (err) {
      console.error('Google Translate failed:', err.message);
      return Response.json({ translated: content, translationError: true });
    }

    // Safety: if API returned fewer strings than expected, fall back
    if (translated.length < allTexts.length) {
      console.error(`Translation mismatch: sent ${allTexts.length}, got ${translated.length}`);
      return Response.json({ translated: content, translationError: true });
    }

    // ---------------------------------------------------------------
    // RECONSTRUCT — use explicit start indices, never a running offset
    // ---------------------------------------------------------------

    // Outline
    const subtopicTranslations = {}; // `${outlineIdx}_${subIdx}` -> translatedText
    subtopicMeta.forEach(({ outlineIdx, subIdx }, flatIdx) => {
      subtopicTranslations[`${outlineIdx}_${subIdx}`] = translated[subtopicsStart + flatIdx];
    });

    const translatedOutline = outline.map((item, i) => {
      const subtopics = (item.subtopics || []).map((sub, j) => {
        const tText = subtopicTranslations[`${i}_${j}`];
        if (typeof sub === 'string') return tText || sub;
        return { ...sub, title: tText || sub.title };
      });
      return {
        ...item,
        title: translated[outlineTitlesStart + i] || item.title,
        summary: translated[outlineSummariesStart + i] || item.summary,
        ...(item.subtopics !== undefined ? { subtopics } : {}),
      };
    });

    // Summaries
    const translatedSummaries = {};
    summaryKeys.forEach((k, i) => {
      translatedSummaries[k] = translated[summariesStart + i] || summaries[k];
    });

    // Flashcards
    const translatedFlashcards = flashcards.map((f, i) => ({
      ...f,
      question: translated[flashcardQStart + i] || f.question,
      answer: translated[flashcardAStart + i] || f.answer,
    }));

    // SearchIndex
    const translatedSearchIndex = searchIndex.map((s, i) => ({
      ...s,
      topic: translated[searchTopicsStart + i] || s.topic,
      snippet: translated[searchSnippetsStart + i] || s.snippet,
    }));

    const result = {
      outline: translatedOutline,
      summaries: translatedSummaries,
      flashcards: translatedFlashcards,
      searchIndex: translatedSearchIndex,
    };

    // Cache result (fire and forget)
    base44.asServiceRole.entities.Cache.create({
      cache_key: cacheKey,
      cache_type: 'agent_output',
      value: JSON.stringify(result),
    }).catch(() => {});

    return Response.json({ translated: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});