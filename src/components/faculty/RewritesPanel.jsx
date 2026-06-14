import { motion } from 'framer-motion';
import TimestampLink from '../TimestampLink';
import { ArrowRight } from 'lucide-react';

export default function RewritesPanel({ rewrites = [], videoId }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">Suggested Rewrites</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Specific moments in the lecture that could be improved — with suggested alternatives.
      </p>
      <div className="space-y-4">
        {rewrites.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Original</span>
                {r.timestamp && (
                  <TimestampLink timestamp={r.timestamp} seconds={r.seconds} videoId={videoId} />
                )}
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed">"{r.original}"</p>
            </div>

            <div className="px-4 py-3 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#7A9E7E' }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#7A9E7E' }}>Suggested</span>
            </div>

            <div className="px-4 pb-4">
              <p className="text-sm text-foreground leading-relaxed mb-3">"{r.rewrite}"</p>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-neon-purple/5 border border-neon-purple/15">
                <span className="text-xs text-neon-purple mt-0.5 flex-shrink-0">Why:</span>
                <span className="text-xs text-muted-foreground leading-relaxed">{r.reason}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}