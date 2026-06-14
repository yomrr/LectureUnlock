import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Check, Zap } from 'lucide-react';

// User-facing steps (indices map to currentStep from Home)
const STUDENT_STEPS = [
  { label: 'Fetching lecture transcript...' },
  { label: 'Analyzing lecture structure...' },
  { label: 'Building your study materials...' },
  { label: 'Preparing translations...' },
  { label: 'Almost ready...' },
];

const FACULTY_STEPS = [
  { label: 'Fetching lecture transcript...' },
  { label: 'Analyzing lecture structure...' },
  { label: 'Running pedagogical audit...' },
  { label: 'Generating suggested rewrites...' },
  { label: 'Almost ready...' },
];

const LATENCY_MSGS = {
  transcript: 'Large lectures take a moment to process — almost there...',
  translation: 'Translations take a little extra time — preparing all languages for you, please be patient...',
};

export default function LoadingScreen({ mode, currentStep, errorMsg, onReset, showPrivateMessage }) {
  const steps = mode === 'faculty' ? FACULTY_STEPS : STUDENT_STEPS;
  const accentClass = mode === 'faculty' ? '' : 'text-primary';
  const accentBg = 'bg-[#9E9B94]';
  const accentBorder = mode === 'faculty' ? 'border-[#6B6560]' : 'border-primary';
  const accentBgSoft = mode === 'faculty' ? 'bg-[#6B6560]/10' : 'bg-primary/10';

  const [latencyMsg, setLatencyMsg] = useState(null);
  const [shownSteps, setShownSteps] = useState([0]);
  const [privateVisible, setPrivateVisible] = useState(mode === 'faculty' && showPrivateMessage);
  // Wall-clock start time — set once on mount, never reset
  const startTime = useRef(Date.now());
  const latencyTimer = useRef(null);

  // Reveal new steps sequentially as currentStep advances
  useEffect(() => {
    setShownSteps(prev => {
      const next = new Set(prev);
      for (let i = 0; i <= currentStep; i++) next.add(i);
      return [...next];
    });
  }, [currentStep]);

  // Auto-dismiss private message after 2.5s
  useEffect(() => {
    if (!privateVisible) return;
    const t = setTimeout(() => setPrivateVisible(false), 2500);
    return () => clearTimeout(t);
  }, [privateVisible]);

  // Latency timer — evaluates which message to show based on current step,
  // but the 15s countdown always starts from mount (URL submission moment)
  useEffect(() => {
    // Clear any pending timer when step changes
    if (latencyTimer.current) clearTimeout(latencyTimer.current);

    // Only show latency message on transcript/analysis steps (0–1)
    const isTranscriptOrAnalysis = currentStep <= 1;
    if (!isTranscriptOrAnalysis) {
      setLatencyMsg(null);
      return;
    }

    // How much time has already elapsed since mount?
    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, 15000 - elapsed);

    latencyTimer.current = setTimeout(() => {
      setLatencyMsg(LATENCY_MSGS.transcript);
    }, remaining);

    return () => clearTimeout(latencyTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const progress = Math.min(((currentStep + 0.5) / steps.length) * 100, 95);

  return (
    <motion.div
      className="min-h-screen grid-bg flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/50 bg-primary/15 mb-4">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-xs font-mono text-primary tracking-widest uppercase">AI Study Engine</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Lecture<span className="text-primary glow-text-cyan">Unlock</span>
        </h1>
      </motion.div>

      {/* Inline error state — replaces progress steps */}
      {errorMsg ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-lg font-bold">!</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{errorMsg}</p>
          <button
            onClick={onReset}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            Try another video
          </button>
        </motion.div>
      ) : (

      /* Steps + progress */
      <div className="w-full max-w-sm">
        {/* Progress bar */}
        <div className="h-px bg-border rounded-full overflow-hidden mb-10">
          <motion.div
            className="h-full rounded-full bg-[#9E9B94]"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* Steps list — steps appear one at a time */}
        <div className="space-y-5">
          {steps.map((step, i) => {
            const isVisible = shownSteps.includes(i);
            const isDone = i < currentStep;
            const isActive = i === currentStep;

            return (
              <AnimatePresence key={i}>
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex items-center gap-4"
                  >
                    {/* Indicator */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? `${accentBg}`
                        : isActive
                          ? `border-2 ${accentBorder} ${accentBgSoft}`
                          : 'border border-border'
                    }`}>
                      {isDone ? (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      ) : isActive ? (
                        <motion.div
                          className={`w-1.5 h-1.5 rounded-full ${accentBg}`}
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ) : null}
                    </div>

                    {/* Label */}
                    <span className={`text-sm transition-all duration-300 ${
                      isActive
                        ? `font-medium text-foreground`
                        : isDone
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/40'
                    }`}>
                      {step.label}
                    </span>

                    {/* Active glow dot on right */}
                    {isActive && (
                      <motion.div
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9E9B94] flex-shrink-0"
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Latency message */}
        <AnimatePresence>
          {latencyMsg && (
            <motion.p
              key="latency"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-10 text-xs text-muted-foreground text-center leading-relaxed"
            >
              {latencyMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      )} {/* end error ? ... : steps */}
      {/* Faculty private entry message */}
      <AnimatePresence>
        {privateVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <p className="text-sm text-muted-foreground font-light tracking-wide text-center">
              This report is for you. Built to help, not to judge.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}