import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlignLeft, BookOpen } from 'lucide-react';
import MathText from './MathText';

const LEVELS = [
  { id: 'quick', labelKey: 'summaryQuick', icon: Zap, description: '30-second read', color: 'text-neon-amber' },
  { id: 'medium', labelKey: 'summaryMedium', icon: AlignLeft, description: '2-minute read', color: 'text-primary' },
  { id: 'full', labelKey: 'summaryFull', icon: BookOpen, description: '5-minute read', color: 'text-neon-purple' },
];

export default function SummaryPanel({ summaries = {}, strings = {} }) {
  const [active, setActive] = useState('quick');

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-6">{strings.summaryHeader || 'Layered Summary'}</h2>

      {/* Level selector */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {LEVELS.map(level => {
          const Icon = level.icon;
          const isActive = active === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setActive(level.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isActive ? 'border-primary/50 bg-primary/8' : 'border-border bg-card hover:border-primary/20'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1.5 ${isActive ? level.color : 'text-muted-foreground'}`} />
              <div className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {strings[level.labelKey] || level.labelKey}
              </div>
              <div className="text-xs text-muted-foreground">{level.description}</div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="prose prose-sm max-w-none">
          {(summaries[active] || '').split('\n\n').map((para, i) => (
            <p key={i} className="text-sm leading-relaxed mb-4 last:mb-0" style={{ color: '#1A1814' }}>
              <MathText text={para} />
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}