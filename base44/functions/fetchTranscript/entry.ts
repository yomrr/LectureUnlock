import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { youtubeUrl } = await req.json();

    if (!youtubeUrl) {
      return Response.json({ error: 'Missing youtubeUrl' }, { status: 400 });
    }

    // Validate it's a YouTube URL first
    const isYouTube = /(?:youtube\.com|youtu\.be)/.test(youtubeUrl);
    if (!isYouTube) {
      return Response.json({ error: 'not_youtube' }, { status: 400 });
    }

    // Extract video ID
    const videoIdMatch = youtubeUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (!videoIdMatch) {
      return Response.json({ error: 'not_youtube' }, { status: 400 });
    }
    const videoId = videoIdMatch[1];

    // Check transcript cache
    const transcriptCacheKey = `${videoId}:transcript`;
    console.log(`Checking transcript cache for: ${transcriptCacheKey}`);
    const cached = await base44.asServiceRole.entities.Cache.filter({
      cache_key: transcriptCacheKey,
      cache_type: 'transcript',
    });
    if (cached && cached.length > 0) {
      console.log('Transcript cache HIT — returning cached result');
      const transcript = JSON.parse(cached[0].value);
      return Response.json({ videoId, transcript });
    }
    console.log('Transcript cache MISS — fetching from Supadata');

    const apiKey = Deno.env.get('SUPADATA_API_KEY');
    const response = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=false`,
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 404) {
        return Response.json({ error: 'video_unavailable' }, { status: 404 });
      }
      if (status === 422 || status === 400) {
        return Response.json({ error: 'no_transcript' }, { status: 422 });
      }
      const body = await response.text().catch(() => '');
      if (body.toLowerCase().includes('transcript') || body.toLowerCase().includes('caption')) {
        return Response.json({ error: 'no_transcript' }, { status: 422 });
      }
      return Response.json({ error: 'video_unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const transcript = data.content || data;

    if (!transcript || (Array.isArray(transcript) && transcript.length === 0)) {
      return Response.json({ error: 'no_transcript' }, { status: 422 });
    }

    // Check for meaningful content — very short transcripts (< 10 segments or < 200 chars total) are not lectures
    const segments = Array.isArray(transcript) ? transcript : [];
    const totalText = segments.map(t => t.text || '').join(' ').trim();
    if (segments.length < 10 || totalText.length < 200) {
      return Response.json({ error: 'no_transcript' }, { status: 422 });
    }

    // Save to cache — await so we can detect failures
    try {
      await base44.asServiceRole.entities.Cache.create({
        cache_key: transcriptCacheKey,
        cache_type: 'transcript',
        value: JSON.stringify(transcript),
      });
      console.log(`Transcript saved to cache for: ${transcriptCacheKey}`);
    } catch (cacheErr) {
      console.error(`Transcript cache SAVE FAILED for ${transcriptCacheKey}:`, cacheErr.message);
    }

    return Response.json({ videoId, transcript });
  } catch (error) {
    return Response.json({ error: 'unexpected_error' }, { status: 500 });
  }
});