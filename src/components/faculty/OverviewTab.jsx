import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

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

export default function OverviewTab({ data }) {
  const grade = data?.overall_grade || '—';
  const score = data?.overall_score ?? 0;
  const strengths = data?.strengths || [];

  return (
    <div className="space-y-8">
      {/* Grade + Score + Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-card border border-border"
      >
        <div className="flex items-start gap-6 mb-5">
          {/* Large letter grade */}
          <div className="flex-shrink-0 text-center">
            <div className={`text-7xl font-bold font-mono leading-none ${gradeTextColor(grade)}`}>{grade}</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${scoreTextColor(score)}`}>
              {score}<span className="text-base text-muted-foreground">/10</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wider">Overall</div>
          </div>
          {/* Summary */}
          <div className="flex-1">
            {data?.overall_summary && (
              <p className="text-sm leading-relaxed" style={{ color: '#1C1916' }}>{data.overall_summary}</p>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-secondary/60 border border-border">
          <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed font-normal">
            This report was generated from the lecture transcript. Audio quality and visual elements could not be directly assessed — scores reflect what the transcript reveals about delivery, narration, and structure.
          </p>
        </div>
      </motion.div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: '#3D3530' }}>Strengths</h2>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <span className="text-green-700 font-bold flex-shrink-0 mt-0.5">✓</span>
                <span className="text-sm leading-relaxed" style={{ color: '#1C1916' }}>{s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}