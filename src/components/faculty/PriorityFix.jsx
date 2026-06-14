import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import TimestampLink from '../TimestampLink';

export default function PriorityFix({ fix = {}, videoId }) {
  if (!fix?.title) {
    return <div className="text-muted-foreground text-sm">No priority fix identified.</div>;
  }

  const impactColor = fix.impact === 'Critical' ? 'text-destructive bg-destructive/10 border-destructive/20' : 'text-neon-amber bg-neon-amber/10 border-neon-amber/20';

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">Top Priority Fix</h2>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-xl border border-destructive/30 bg-destructive/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h3 className="font-semibold text-foreground text-base">{fix.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-semibold ${impactColor}`}>
                {fix.impact}
              </span>
              {fix.timestamp && (
                <TimestampLink timestamp={fix.timestamp} seconds={fix.seconds} videoId={videoId} />
              )}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{fix.description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}