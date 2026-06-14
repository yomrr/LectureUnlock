import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Maximize2, X } from 'lucide-react';
import TimestampLink from '../TimestampLink';
import MathText from './MathText';

export default function FlashcardsPanel({ flashcards = [], videoId, strings = {}, isRTL = false, onStudyModeChange }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(new Set());
  const [studyMode, setStudyMode] = useState(false);

  const card = flashcards[current];
  if (!card) return <div className="text-muted-foreground text-sm">No flashcards generated.</div>;

  const goTo = (idx) => {
    setCurrent(idx);
    setFlipped(false);
    setSeen(s => new Set([...s, current]));
  };

  const enterStudyMode = () => {
    setStudyMode(true);
    onStudyModeChange?.(true);
  };

  const exitStudyMode = () => {
    setStudyMode(false);
    onStudyModeChange?.(false);
  };

  // --- STUDY MODE ---
  if (studyMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Minimal top toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <span className="text-sm text-muted-foreground font-mono">
            {strings.flashcardQuestion ? strings.flashcardQuestion(current + 1, flashcards.length) : `${current + 1} / ${flashcards.length}`}
          </span>

          <button
            onClick={exitStudyMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Exit Study Mode
          </button>
        </div>

        {/* Large card area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-3xl flex items-center gap-4">
            {/* Prev arrow */}
            <button
              onClick={() => goTo(Math.max(0, current - 1))}
              disabled={current === 0}
              className="flex-shrink-0 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => setFlipped(f => !f)}
            style={{ perspective: '1200px' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current}-${flipped}`}
                initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`min-h-[320px] md:min-h-[400px] p-12 rounded-2xl border flex flex-col items-center justify-center text-center ${
                  flipped
                    ? 'bg-primary/8 border-primary/40'
                    : 'bg-card border-border'
                }`}
              >
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
                  {flipped ? 'Answer' : (strings.flashcardQuestion ? strings.flashcardQuestion(current + 1, flashcards.length) : `Question ${current + 1} of ${flashcards.length}`)}
                </div>
                <p className="text-xl leading-relaxed max-w-2xl" style={{ color: '#1A1814' }}>
                  <MathText text={flipped ? card.answer : card.question} />
                </p>
                {flipped && card.timestamp && (
                  <div className="mt-6">
                    <TimestampLink timestamp={card.timestamp} seconds={card.seconds} videoId={videoId} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

            {/* Next arrow */}
            <button
              onClick={() => goTo(Math.min(flashcards.length - 1, current + 1))}
              disabled={current === flashcards.length - 1}
              className="flex-shrink-0 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">{strings.flashcardClickToFlip || 'Click the card to flip'}</p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-6 flex-wrap justify-center">
            {flashcards.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'bg-primary w-6' : seen.has(i) ? 'bg-primary/40 w-1.5' : 'bg-border w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- NORMAL MODE ---
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">{strings.flashcardsHeader || 'Flashcards'}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-mono">
            {current + 1} / {flashcards.length}
          </span>
          <button
            onClick={enterStudyMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/30 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Maximize2 className="w-3 h-3" />
            Study Mode
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8 flex-wrap">
        {flashcards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current
                ? 'bg-primary w-6'
                : seen.has(i)
                  ? 'bg-primary/40'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="cursor-pointer mb-6"
        onClick={() => setFlipped(f => !f)}
        style={{ perspective: '1000px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current}-${flipped}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`min-h-[180px] p-8 rounded-xl border flex flex-col items-center justify-center text-center ${
              flipped
                ? 'bg-primary/8 border-primary/40'
                : 'bg-card border-border'
            }`}
          >
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
              {flipped ? 'Answer' : (strings.flashcardQuestion ? strings.flashcardQuestion(current + 1, flashcards.length) : `Question ${current + 1} of ${flashcards.length}`)}
            </div>
            <p className="text-base leading-relaxed" style={{ color: '#1A1814' }}>
              <MathText text={flipped ? card.answer : card.question} />
            </p>
            {flipped && card.timestamp && (
              <div className="mt-4">
                <TimestampLink timestamp={card.timestamp} seconds={card.seconds} videoId={videoId} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-muted-foreground mb-6">{strings.flashcardClickToFlip || 'Click the card to flip'}</p>

      {/* Nav */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => goTo(Math.max(0, current - 1))}
          disabled={current === 0}
          className="p-2 rounded-lg border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setCurrent(0); setFlipped(false); setSeen(new Set()); }}
          className="p-2 rounded-lg border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => goTo(Math.min(flashcards.length - 1, current + 1))}
          disabled={current === flashcards.length - 1}
          className="p-2 rounded-lg border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}