import { motion } from 'framer-motion';

const DIMENSION_META = {
  clarity: { label: 'Clarity', description: 'How clearly concepts are explained' },
  accessibility: { label: 'Accessibility', description: 'Ease of understanding for all learners' },
  equity: { label: 'Equity', description: 'Inclusive language and cultural awareness' },
  structure: { label: 'Structure', description: 'Logical flow and organization' },
};

function ScoreBar({ score }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? 'bg-green-400' : score >= 6 ? 'bg-neon-amber' : 'bg-destructive';
  return (
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

function GradeBadge({ grade }) {
  const colors = {
    A: 'bg-green-400/10 text-green-400 border-green-400/20',
    B: 'bg-primary/10 text-primary border-primary/20',
    C: 'bg-neon-amber/10 text-neon-amber border-neon-amber/20',
    D: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold font-mono ${colors[grade] || colors.C}`}>
      {grade}
    </span>
  );
}

export default function DimensionsPanel({ dimensions = {} }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">Audit Dimensions</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(DIMENSION_META).map(([key, meta], i) => {
          const dim = dimensions[key] || {};
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-xl bg-card border border-border hover:border-neon-purple/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{meta.label}</h3>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-lg font-bold font-mono text-foreground">{dim.score || '—'}</span>
                  <GradeBadge grade={dim.grade || 'C'} />
                </div>
              </div>
              <ScoreBar score={dim.score || 0} />
              {dim.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-3">{dim.summary}</p>
              )}
              {dim.issues && dim.issues.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {dim.issues.map((issue, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-destructive mt-0.5 flex-shrink-0">•</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}