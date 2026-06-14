import { motion } from 'framer-motion';
import TimestampLink from '../TimestampLink';

const DIM_LABELS = {
  delivery: 'Delivery',
  visual_narration: 'Visual Narration',
  depth: 'Lecture Depth',
  accuracy: 'Accuracy',
  pacing: 'Pacing & Structure',
};

const DIM_COLORS = {
  delivery: 'bg-neon-purple/15 text-neon-purple border-neon-purple/30',
  visual_narration: 'bg-primary/20 text-primary-foreground border-primary/30',
  depth: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  accuracy: 'bg-destructive/10 text-destructive border-destructive/20',
  pacing: 'bg-neon-amber/15 text-amber-700 border-neon-amber/30',
};

export default function ActionItemsTab({ actionItems = [], videoId }) {
  if (actionItems.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No action items found.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-4" style={{ color: '#3D3530' }}>Action Items — Most Critical First</h2>
      {actionItems.map((item, i) => {
        const isTop = item.priority === 1;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`p-5 rounded-xl border transition-all ${
              isTop
                ? 'bg-destructive/5 border-destructive/30'
                : 'border'
            }`}
            style={!isTop ? { backgroundColor: '#E8E0D4', borderColor: '#C4B9A8' } : {}}
          >
            <div className="flex items-start gap-4">
              {/* Priority number */}
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono border ${
                isTop
                  ? 'bg-destructive/15 border-destructive/40 text-destructive'
                  : 'bg-secondary border-border text-foreground'
              }`}>
                {item.priority}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-bold text-sm" style={{ color: '#1A1814' }}>{item.title}</span>
                  {item.dimension && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${DIM_COLORS[item.dimension] || 'bg-secondary text-muted-foreground border-border'}`}>
                      {DIM_LABELS[item.dimension] || item.dimension}
                    </span>
                  )}
                  {(item.timestamp || item.seconds != null) && (
                    <TimestampLink timestamp={item.timestamp} seconds={item.seconds} videoId={videoId} />
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#2C2620' }}>{item.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}