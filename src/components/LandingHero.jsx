import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ShieldCheck, Youtube, ArrowRight, Zap } from 'lucide-react';

export default function LandingHero({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) {
      setError('Paste a YouTube URL to get started.');
      return;
    }
    const isYouTube = /(?:youtube\.com|youtu\.be)/.test(url);
    if (!isYouTube) {
      setError("That doesn't look like a YouTube link. Please paste a valid YouTube URL.");
      return;
    }
    onSubmit(url.trim(), mode);
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[200px] rounded-full bg-neon-purple/5 blur-[60px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/50 bg-primary/15 mb-6">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-mono text-primary tracking-widest uppercase">AI Study Engine</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-3">
            Lecture<span className="text-primary glow-text-cyan">Unlock</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            {mode === 'faculty'
              ? 'Paste your lecture URL. Receive a private pedagogical audit — for your eyes only.'
              : 'Paste any YouTube lecture. Get an AI-powered study tool in seconds.'}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMode('student')}
            className={`group relative p-4 rounded-lg border text-left transition-all duration-200 ${
              mode === 'student'
                ? 'border-primary/60 bg-primary/8 glow-cyan'
                : 'border-border bg-card hover:border-primary/30 hover:bg-secondary'
            }`}
          >
            {mode === 'student' && (
              <div className="absolute inset-0 rounded-lg bg-primary/5 pointer-events-none" />
            )}
            <GraduationCap className={`w-5 h-5 mb-2 ${mode === 'student' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
            <div className={`font-semibold text-sm ${mode === 'student' ? 'text-primary' : 'text-foreground'}`}>
              Student Mode
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Summaries, flashcards, outline & semantic search
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('faculty')}
            className={`group relative p-4 rounded-lg border text-left transition-all duration-200 ${
              mode === 'faculty'
                ? 'border-[#6B6560]/60 bg-[#6B6560]/8'
                : 'border-border bg-card hover:border-[#6B6560]/30 hover:bg-secondary'
            }`}
          >
            {mode === 'faculty' && (
              <div className="absolute inset-0 rounded-lg bg-[#6B6560]/5 pointer-events-none" />
            )}
            <ShieldCheck className={`w-5 h-5 mb-2 ${mode === 'faculty' ? '' : 'text-muted-foreground group-hover:text-foreground'}`} style={mode === 'faculty' ? { color: '#6B6560' } : {}} />
            <div className={`font-semibold text-sm ${mode === 'faculty' ? '' : 'text-foreground'}`} style={mode === 'faculty' ? { color: '#6B6560' } : {}}>
              Faculty Mode
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Private pedagogical audit — clarity, equity & rewrites
            </div>
          </button>
        </div>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-card border border-border hover:border-primary/30 focus:border-primary/60 focus:ring-0 rounded-lg pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive px-1">{error}</p>
          )}

          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
              mode === 'student'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan'
                : 'text-white hover:opacity-90'
            }`}
          style={mode === 'faculty' ? { backgroundColor: '#6B6560' } : {}}
          >
            Unlock Lecture
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Works with any public YouTube lecture with captions enabled
        </p>
      </motion.div>
    </div>
  );
}