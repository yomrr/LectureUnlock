import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronLeft, Lock, ChevronDown } from 'lucide-react';
import OverviewTab from './OverviewTab';
import DimensionTab from './DimensionTab';
import ActionItemsTab from './ActionItemsTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'delivery', label: 'Delivery Quality' },
  { id: 'visual_narration', label: 'Visual Narration' },
  { id: 'depth', label: 'Lecture Depth' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'pacing', label: 'Pacing & Structure' },
  { id: 'action_items', label: 'Action Items' },
];

const DIMENSION_KEYS = ['delivery', 'visual_narration', 'depth', 'accuracy', 'pacing'];

export default function FacultyView({ data, videoId, onReset }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeLabel = TABS.find(t => t.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            New Lecture
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: '#6B6560' }} />
            <span className="text-sm font-semibold font-mono tracking-wide" style={{ color: '#6B6560' }}>FACULTY AUDIT</span>
          </div>
          <div className="w-28" />
        </div>
      </div>

      {/* Dropdown selector */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-2">
        <div className="relative inline-block w-full max-w-xs">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:border-[#6B6560]/40 transition-colors text-sm font-medium text-foreground"
          >
            <span>{activeLabel}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 w-full z-30 rounded-lg border border-border bg-card shadow-xl overflow-hidden"
              >
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  const dim = DIMENSION_KEYS.includes(tab.id) ? data?.dimensions?.[tab.id] : null;
                  const dimScore = dim?.numeric_score ?? null;
                  const dimGrade = dim?.letter_grade ?? null;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                        isActive ? 'bg-[#6B6560]/10 hover:bg-[#6B6560]/15' : 'hover:bg-secondary text-foreground'
                      }`}
                      style={isActive ? { color: '#5C564F' } : {}}
                    >
                      <span>{tab.label}</span>
                      {dimGrade && dimScore !== null && (
                        <span className={`text-xs font-mono font-semibold ${gradeTextColor(dimGrade ?? '')} `}>
                          {dimGrade} · {dimScore}/10
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Privacy banner */}
      <div className="max-w-5xl mx-auto px-4 pb-2">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary border border-border">
          <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">This report is private and for your eyes only.</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 py-6" onClick={() => dropdownOpen && setDropdownOpen(false)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {DIMENSION_KEYS.includes(activeTab) && (
              <DimensionTab
                dimKey={activeTab}
                dim={data?.dimensions?.[activeTab]}
                videoId={videoId}
              />
            )}
            {activeTab === 'action_items' && (
              <ActionItemsTab actionItems={data?.action_items || []} videoId={videoId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function gradeTextColor(grade) {
  if (grade === 'A' || grade === 'B') return 'text-green-700';
  if (grade === 'C') return 'text-orange-600';
  return 'text-destructive';
}