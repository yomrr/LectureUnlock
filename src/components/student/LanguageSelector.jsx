import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
  { code: 'de', label: 'DE' },
];

const PATIENCE_MSG = 'Translations take extra time — almost ready...';

export default function LanguageSelector({ selected, onChange, loadingLangs = {}, bgStatus, translationStartedAt }) {
  const [showPatience, setShowPatience] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!translationStartedAt) return;

    // Clear patience message if translations are done
    if (bgStatus === 'ready' || bgStatus === null) {
      setShowPatience(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Calculate remaining time from when translations actually started
    const elapsed = Date.now() - translationStartedAt;
    const remaining = Math.max(0, 15000 - elapsed);

    timerRef.current = setTimeout(() => {
      // Only show if still loading
      if (bgStatus === 'loading') setShowPatience(true);
    }, remaining);

    return () => clearTimeout(timerRef.current);
  }, [translationStartedAt, bgStatus]);

  // Dismiss patience message once bgStatus changes away from loading
  useEffect(() => {
    if (bgStatus !== 'loading') setShowPatience(false);
  }, [bgStatus]);

  const statusText = showPatience
    ? PATIENCE_MSG
    : bgStatus === 'loading'
      ? 'Translations loading…'
      : bgStatus === 'ready'
        ? 'Translations ready'
        : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {LANGUAGES.map(lang => {
          const isSelected = selected === lang.code;
          const isLoading = loadingLangs[lang.code];
          return (
            <button
              key={lang.code}
              onClick={() => onChange(lang.code)}
              className={`relative px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {lang.label}
              {isLoading && (
                <span className={`w-2 h-2 rounded-full border border-current border-t-transparent animate-spin inline-block ${isSelected ? 'opacity-80' : 'opacity-50'}`} />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {statusText && (
          <motion.span
            key={showPatience ? 'patience' : bgStatus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-[10px] font-mono leading-relaxed text-right max-w-[220px] ${
              bgStatus === 'ready' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {statusText}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}