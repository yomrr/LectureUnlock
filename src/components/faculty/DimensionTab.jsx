import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import TimestampLink from '../TimestampLink';

const DIM_LABELS = {
  delivery: 'Delivery Quality',
  visual_narration: 'Visual Narration',
  depth: 'Lecture Depth',
  accuracy: 'Accuracy',
  pacing: 'Pacing & Structure',
};

function DoingWellSection({ doingWell, dimKey }) {
  const [open, setOpen] = useState(false);
  const label = DIM_LABELS[dimKey] || dimKey;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <h4 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#3D3530' }}>
          What This Lecture Does Well in {label}
        </h4>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2">
          {doingWell.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#E8E0D4', borderColor: '#C4B9A8' }}>
              <span className="text-green-700 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span className="text-sm leading-relaxed" style={{ color: '#1C1916' }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function gradeTextColor(grade) {
  if (grade === 'A' || grade === 'B') return 'text-green-700';
  if (grade === 'C') return 'text-orange-600';
  return 'text-destructive';
}

function scoreTextColor(score) {
  if (score >= 7) return 'text-green-700';
  if (score >= 5) return 'text-orange-600';
  return 'text-destructive';
}

function ScoreBar({ score }) {
  const pct = ((score || 0) / 10) * 100;
  let barColor = 'bg-destructive';
  if (score >= 7) barColor = 'bg-green-600';
  else if (score >= 5) barColor = 'bg-orange-500';
  return (
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
      <motion.div
        className={`h-full rounded-full ${barColor}`}
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}

function RubricBox({ rubric }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#C4B9A8', backgroundColor: '#E8E0D4' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/5 transition-colors"
      >
        <span className="text-xs font-mono" style={{ color: '#3D3530' }}>How this was scored — click to expand</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="border-t px-4 py-3" style={{ borderColor: '#C4B9A8' }}>
          <pre className="text-xs whitespace-pre-wrap leading-relaxed font-mono" style={{ color: '#2C2620' }}>{rubric}</pre>
        </div>
      )}
    </div>
  );
}

function RewriteCard({ rewrite, videoId }) {
  const [expanded, setExpanded] = useState(false);
  const words = (rewrite.original || '').split(/\s+/);
  const preview = words.slice(0, 9).join(' ') + (words.length > 9 ? '…' : '');

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#C4B9A8', backgroundColor: '#E8E0D4' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-black/5 transition-colors"
      >
        <span className="text-xs italic flex-1 min-w-0 truncate" style={{ color: '#2C2620' }}>"{preview}"</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(rewrite.timestamp || rewrite.seconds != null) && (
            <span onClick={e => e.stopPropagation()}>
              <TimestampLink timestamp={rewrite.timestamp} seconds={rewrite.seconds} videoId={videoId} />
            </span>
          )}
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border">
          <div className="p-3 border-b" style={{ borderColor: '#C4B9A8', backgroundColor: '#DDD5C8' }}>
            <div className="text-xs mb-1" style={{ color: '#3D3530' }}>Original</div>
            <p className="text-xs italic" style={{ color: '#2C2620' }}>"{rewrite.original}"</p>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
            <ArrowRight className="w-3 h-3" style={{ color: '#7A9E7E' }} />
            <span className="text-xs font-mono font-semibold" style={{ color: '#7A9E7E' }}>Suggested</span>
            </div>
            <p className="text-xs font-medium" style={{ color: '#1A1814' }}>"{rewrite.suggested}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DimensionTab({ dimKey, dim = {}, videoId }) {
  const rewrites = dim.suggested_rewrites || [];
  const errors = dim.content_errors || [];
  const doingWell = dim.doing_well || [];
  const lacking = dim.lacking || [];

  return (
    <div className="space-y-6">
      {/* Grade + Score + Summary */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl bg-card border border-border"
      >
        <div className="flex items-center gap-5 mb-3">
          <div className={`text-5xl font-bold font-mono leading-none ${gradeTextColor(dim.letter_grade)}`}>
            {dim.letter_grade || '—'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">{DIM_LABELS[dimKey]}</span>
              <span className={`text-xl font-bold font-mono ${scoreTextColor(dim.numeric_score)}`}>
                {dim.numeric_score ?? '—'}<span className="text-sm text-muted-foreground">/10</span>
              </span>
            </div>
            <ScoreBar score={dim.numeric_score} />
          </div>
        </div>
        {dim.summary && (
          <p className="text-sm leading-relaxed mt-3" style={{ color: '#1C1916' }}>{dim.summary}</p>
        )}
      </motion.div>

      {/* Rubric */}
      {dim.rubric && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: '#3D3530' }}>Score Rubric</h4>
          <RubricBox rubric={dim.rubric} />
        </motion.div>
      )}

      {/* Doing Well — collapsed by default */}
      {doingWell.length > 0 && (
        <DoingWellSection doingWell={doingWell} dimKey={dimKey} />
      )}

      {/* What to Improve */}
      {lacking.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: '#3D3530' }}>What to Improve</h4>
          <div className="space-y-2">
            {lacking.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#E8E0D4', borderColor: '#C4B9A8' }}>
                <span className="text-orange-600 font-bold flex-shrink-0 mt-0.5">→</span>
                <span className="text-sm leading-relaxed" style={{ color: '#2C2620' }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Content Errors */}
      {errors.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: '#3D3530' }}>Content Errors Found</h4>
          <div className="space-y-2">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/25">
                <span className="text-destructive text-xs mt-0.5 flex-shrink-0 font-bold">✕</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed font-medium" style={{ color: '#1C1916' }}>{err.description}</p>
                  {(err.timestamp || err.seconds != null) && (
                    <div className="mt-1">
                      <TimestampLink timestamp={err.timestamp} seconds={err.seconds} videoId={videoId} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Suggested Rewrites */}
      {rewrites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: '#3D3530' }}>Suggested Rewrites</h4>
          <div className="space-y-2">
            {rewrites.map((r, i) => (
              <RewriteCard key={i} rewrite={r} videoId={videoId} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}