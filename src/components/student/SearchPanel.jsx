import { useState, useRef } from 'react';
import { Search, Send } from 'lucide-react';
import TimestampLink from '../TimestampLink';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import MathText from './MathText';

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic', de: 'German',
};

async function detectLanguage(text) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Detect the language of this text and return ONLY the ISO 639-1 two-letter code (e.g. "en", "es", "fr", "ar", "de"). Text: "${text}"`,
  });
  const code = (typeof res === 'string' ? res : String(res)).trim().toLowerCase().slice(0, 2);
  return code;
}

export default function SearchPanel({ searchIndex = [], videoId, language = 'en', strings = {} }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [langBanner, setLangBanner] = useState(null); // { detectedCode, detectedName, selectedName, query }
  // For Arabic page: track direction of the search result area independently
  const [resultDir, setResultDir] = useState(null); // null | 'ltr' | 'rtl'
  const inputRef = useRef(null);

  const runSearch = async (q, lang) => {
    const res = await base44.functions.invoke('searchQuery', {
      videoId,
      query: q,
      searchIndex,
      language: lang,
    });
    return res.data?.result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setResult(null);
    setLangBanner(null);
    try {
      // Run search and language detection in parallel
      const [searchResult, detectedCode] = await Promise.all([
        runSearch(q, language),
        detectLanguage(q),
      ]);
      setResult(searchResult || { category: 'error', response: 'Something went wrong. Please try again.', results: [] });
      // Reset result direction on each new search
      setResultDir(language === 'ar' ? 'rtl' : null);

      // Show banner if detected language differs from selected
      if (detectedCode && detectedCode !== language && LANG_NAMES[detectedCode]) {
        setLangBanner({
          detectedCode,
          detectedName: LANG_NAMES[detectedCode],
          selectedName: LANG_NAMES[language] || language,
          query: q,
        });
      }
    } catch {
      setResult({ category: 'error', response: 'Something went wrong. Please try again.', results: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async () => {
    if (!langBanner) return;
    const switchingTo = langBanner.detectedCode;
    setLangBanner(null);
    setLoading(true);
    try {
      const res = await runSearch(langBanner.query, switchingTo);
      setResult(res || { category: 'error', response: 'Something went wrong. Please try again.', results: [] });
      // On Arabic page: switch result direction to match detected language
      if (language === 'ar') {
        setResultDir(switchingTo === 'ar' ? 'rtl' : 'ltr');
      }
    } catch {
      setResult({ category: 'error', response: 'Something went wrong. Please try again.', results: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleKeep = () => {
    setLangBanner(null);
    // On Arabic page: ensure result stays RTL
    if (language === 'ar') setResultDir('rtl');
  };

  // Categories that show only a plain text response (no results cards)
  const isTextOnly = result && ['greeting', 'invalid', 'unrelated', 'error'].includes(result.category);
  const hasResults = result?.results?.length > 0;
  const multipleResults = result?.results?.length > 1;

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">{strings.searchHeader || 'Ask the Lecture'}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {strings.searchIntro || "Ask any question about this lecture — I'll find the exact moment that covers it."}
      </p>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={strings.searchPlaceholder || 'Ask a question about this lecture...'}
          className="w-full bg-card border border-border hover:border-primary/30 focus:border-primary/60 rounded-lg pl-11 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
          autoFocus
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-30 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Language mismatch banner */}
      <AnimatePresence>
        {langBanner && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between gap-3 px-3 py-2 mb-4 rounded-lg bg-secondary border border-border text-xs text-muted-foreground"
          >
            <span>
              You typed in <span className="text-foreground font-medium">{langBanner.detectedName}</span> — switch response to{' '}
              <span className="text-foreground font-medium">{langBanner.detectedName}</span>?
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleSwitch}
                className="px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
              >
                Switch response
              </button>
              <button
                onClick={handleKeep}
                className="px-2.5 py-1 rounded-md hover:bg-border transition-colors"
              >
                Keep {langBanner.selectedName}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div dir={resultDir || undefined}>
      <AnimatePresence mode="wait">
        {/* Loading */}
        {loading && (
          <motion.div key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-10"
          >
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Searching…
          </motion.div>
        )}

        {/* Text-only responses (greeting / invalid / unrelated / error) */}
        {!loading && isTextOnly && (
          <motion.div key="text-only"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-card border border-border text-sm leading-relaxed" style={{ color: '#1A1814' }}
          >
            <MathText text={result.response} />
          </motion.div>
        )}

        {/* Study guidance — text response + optional single result */}
        {!loading && result?.category === 'study_guidance' && (
          <motion.div key="study"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {result.response && (
              <div className="p-4 rounded-xl bg-card border border-border text-sm leading-relaxed" style={{ color: '#1A1814' }}>
                <MathText text={result.response} />
              </div>
            )}
            {hasResults && result.results.map((r, i) => (
              <ResultCard key={i} result={r} videoId={videoId} index={null} />
            ))}
          </motion.div>
        )}

        {/* Lecture question results */}
        {!loading && result?.category === 'lecture_question' && hasResults && (
          <motion.div key="results"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {multipleResults && (
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                {result.results.length} relevant moments found
              </p>
            )}
            {result.results.map((r, i) => (
              <ResultCard key={i} result={r} videoId={videoId} index={multipleResults ? i + 1 : null} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCard({ result, videoId, index }) {
  return (
    <div className="p-5 rounded-xl bg-primary/5 border border-primary/25">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          {index !== null && (
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-mono font-bold flex items-center justify-center">
              {index}
            </span>
          )}
          <span className="font-semibold text-sm text-foreground">{result.label}</span>
        </div>
        {result.timestamp && (
          <TimestampLink timestamp={result.timestamp} seconds={result.seconds} videoId={videoId} />
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#1A1814' }}><MathText text={result.explanation} /></p>
    </div>
  );
}