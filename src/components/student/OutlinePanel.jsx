import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import TimestampLink from '../TimestampLink';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from './MathText';

function OutlineItem({ item, index, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg bg-card border border-border overflow-hidden"
    >
      {/* Main topic row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <span className="flex-1 font-semibold text-sm" style={{ color: '#1A1814' }}>{item.title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <TimestampLink timestamp={item.timestamp} seconds={item.seconds} videoId={item.videoId} />
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Subtopics / summary — collapsible */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3 ml-10">
              {/* If item has subtopics array, render each; otherwise render summary */}
              {item.subtopics?.length > 0 ? (
                <div className="space-y-2">
                  {item.subtopics.map((sub, j) => (
                    <div key={j} className="flex items-start justify-between gap-3 py-1.5">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed" style={{ color: '#1C1916' }}><MathText text={sub.title || sub} /></span>
                      </div>
                      {sub.timestamp && (
                        <TimestampLink timestamp={sub.timestamp} seconds={sub.seconds} videoId={item.videoId} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: '#1C1916' }}><MathText text={item.summary} /></p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OutlinePanel({ outline = [], videoId, strings = {} }) {
  // Inject videoId into each item for use inside OutlineItem
  const items = outline.map(item => ({ ...item, videoId }));

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-6">{strings.outlineHeader || 'Lecture Outline'}</h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <OutlineItem key={`${i}-${item.title}`} item={item} index={i} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}