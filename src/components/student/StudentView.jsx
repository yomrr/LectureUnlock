import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { List, BookOpen, Layers, Search, ChevronLeft } from 'lucide-react';
import OutlinePanel from './OutlinePanel';
import SummaryPanel from './SummaryPanel';
import FlashcardsPanel from './FlashcardsPanel';
import SearchPanel from './SearchPanel';
import LanguageSelector from './LanguageSelector';
import { base44 } from '@/api/base44Client';

export const UI_STRINGS = {
  en: {
    outline: 'Outline',
    summary: 'Summary',
    flashcards: 'Flashcards',
    search: 'Search',
    outlineHeader: 'Lecture Outline',
    summaryHeader: 'Layered Summary',
    flashcardsHeader: 'Flashcards',
    searchHeader: 'Ask the Lecture',
    searchPlaceholder: 'Ask a question about this lecture...',
    searchIntro: "Ask any question about this lecture — I'll find the exact moment that covers it.",
    summaryQuick: 'Quick',
    summaryMedium: 'Medium',
    summaryFull: 'Full',
    flashcardClickToFlip: 'Click the card to flip',
    flashcardQuestion: (x, y) => `Question ${x} of ${y}`,
  },
  es: {
    outline: 'Esquema',
    summary: 'Resumen',
    flashcards: 'Tarjetas',
    search: 'Buscar',
    outlineHeader: 'Esquema de la Conferencia',
    summaryHeader: 'Resumen por Niveles',
    flashcardsHeader: 'Tarjetas de Estudio',
    searchHeader: 'Pregunta a la Conferencia',
    searchPlaceholder: 'Haz una pregunta sobre esta conferencia...',
    searchIntro: 'Haz cualquier pregunta sobre esta conferencia — encontraré el momento exacto que lo cubre.',
    summaryQuick: 'Rápido',
    summaryMedium: 'Medio',
    summaryFull: 'Completo',
    flashcardClickToFlip: 'Haz clic para voltear la tarjeta',
    flashcardQuestion: (x, y) => `Pregunta ${x} de ${y}`,
  },
  fr: {
    outline: 'Plan',
    summary: 'Résumé',
    flashcards: 'Fiches',
    search: 'Recherche',
    outlineHeader: 'Plan du Cours',
    summaryHeader: 'Résumé par Niveaux',
    flashcardsHeader: 'Fiches de Révision',
    searchHeader: 'Interroger le Cours',
    searchPlaceholder: 'Posez une question sur ce cours...',
    searchIntro: "Posez n'importe quelle question sur ce cours — je trouverai le moment exact qui le couvre.",
    summaryQuick: 'Rapide',
    summaryMedium: 'Moyen',
    summaryFull: 'Complet',
    flashcardClickToFlip: 'Cliquez pour retourner la carte',
    flashcardQuestion: (x, y) => `Question ${x} sur ${y}`,
  },
  ar: {
    outline: 'مخطط',
    summary: 'ملخص',
    flashcards: 'بطاقات',
    search: 'بحث',
    outlineHeader: 'مخطط المحاضرة',
    summaryHeader: 'ملخص متعدد المستويات',
    flashcardsHeader: 'بطاقات الدراسة',
    searchHeader: 'اسأل عن المحاضرة',
    searchPlaceholder: 'اطرح سؤالاً حول هذه المحاضرة...',
    searchIntro: 'اطرح أي سؤال حول هذه المحاضرة — سأجد اللحظة الدقيقة التي تغطيه.',
    summaryQuick: 'سريع',
    summaryMedium: 'متوسط',
    summaryFull: 'كامل',
    flashcardClickToFlip: 'انقر لقلب البطاقة',
    flashcardQuestion: (x, y) => `سؤال ${x} من ${y}`,
  },
  de: {
    outline: 'Gliederung',
    summary: 'Zusammenfassung',
    flashcards: 'Karteikarten',
    search: 'Suche',
    outlineHeader: 'Vorlesungsgliederung',
    summaryHeader: 'Mehrstufige Zusammenfassung',
    flashcardsHeader: 'Lernkarten',
    searchHeader: 'Vorlesung befragen',
    searchPlaceholder: 'Stellen Sie eine Frage zu dieser Vorlesung...',
    searchIntro: 'Stellen Sie jede Frage zu dieser Vorlesung — ich finde den genauen Moment, der sie abdeckt.',
    summaryQuick: 'Schnell',
    summaryMedium: 'Mittel',
    summaryFull: 'Vollständig',
    flashcardClickToFlip: 'Klicken Sie, um die Karte umzudrehen',
    flashcardQuestion: (x, y) => `Frage ${x} von ${y}`,
  },
};

const TABS = [
  { id: 'outline', labelKey: 'outline', icon: List },
  { id: 'summary', labelKey: 'summary', icon: BookOpen },
  { id: 'flashcards', labelKey: 'flashcards', icon: Layers },
  { id: 'search', labelKey: 'search', icon: Search },
];

const ALL_LANGS = ['es', 'fr', 'ar', 'de'];

export default function StudentView({ data, videoId, onReset }) {
  const [activeTab, setActiveTab] = useState('outline');
  const [language, setLanguage] = useState('en');
  // displayData drives ALL panel rendering — must always be in sync with language
  const [displayData, setDisplayData] = useState(data);
  const [renderKey, setRenderKey] = useState(0);

  // Per-language loading state
  const [loadingLangs, setLoadingLangs] = useState({});
  // 'loading' | 'ready' | null
  const [bgStatus, setBgStatus] = useState(null);
  // Timestamp when background translations started (for 15s patience message)
  const [translationStartedAt, setTranslationStartedAt] = useState(null);

  // In-memory translation cache: lang -> merged data object
  const translationCache = useRef({});
  // Ref so background callbacks can always read the latest selected language
  const selectedLangRef = useRef('en');

  const applyLanguage = (lang) => {
    selectedLangRef.current = lang;
    if (lang === 'en') {
      setLanguage('en');
      setDisplayData(data);
      setRenderKey(k => k + 1);
    } else if (translationCache.current[lang]) {
      setLanguage(lang);
      console.log('[LectureUnlock] applyLanguage from cache:', lang, translationCache.current[lang]);
      setDisplayData({ ...translationCache.current[lang] });
      setRenderKey(k => k + 1);
    } else {
      // Not cached yet — just update the language label; displayData stays English
      // until background fetch completes and triggers apply
      setLanguage(lang);
    }
  };

  // Background preload all four languages in parallel
  useEffect(() => {
    setBgStatus('loading');
    setTranslationStartedAt(Date.now());

    const loadLang = async (lang) => {
      if (translationCache.current[lang]) return;
      setLoadingLangs(prev => ({ ...prev, [lang]: true }));
      try {
        const res = await base44.functions.invoke('translateContent', {
          videoId,
          language: lang,
          content: {
            outline: data.outline,
            summaries: data.summaries,
            flashcards: data.flashcards,
            searchIndex: data.searchIndex,
          },
        });
        const translated = res.data?.translated;
        const translationError = res.data?.translationError;
        if (translated) {
          const merged = translationError
            ? { ...data, _translationError: true }
            : {
                ...data,
                outline: translated.outline ?? data.outline,
                summaries: translated.summaries ?? data.summaries,
                flashcards: translated.flashcards ?? data.flashcards,
                searchIndex: translated.searchIndex ?? data.searchIndex,
              };
          translationCache.current[lang] = merged;

          // If this is what the user is currently viewing, update displayData
          if (selectedLangRef.current === lang) {
            setDisplayData({ ...merged });
            setRenderKey(k => k + 1);
          }
        }
      } finally {
        setLoadingLangs(prev => ({ ...prev, [lang]: false }));
      }
    };

    Promise.all(ALL_LANGS.map(loadLang)).then(() => {
      setBgStatus('ready');
      setTimeout(() => setBgStatus(null), 3000);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRTL = language === 'ar';
  const strings = UI_STRINGS[language] || UI_STRINGS.en;

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
          <span className="text-sm font-semibold text-primary font-mono tracking-wide">STUDENT MODE</span>
          <LanguageSelector
            selected={language}
            onChange={applyLanguage}
            loadingLangs={loadingLangs}
            bgStatus={bgStatus}
            translationStartedAt={translationStartedAt}
          />
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {strings[tab.labelKey]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Spinner when user selected a language that's still loading */}
        {language !== 'en' && loadingLangs[language] && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading translation…
          </div>
        )}
        {/* Translation unavailable fallback notice */}
        {language !== 'en' && displayData._translationError && (
          <div className="text-xs text-muted-foreground mb-4 px-3 py-2 rounded-lg bg-secondary border border-border">
            Translation unavailable — showing English instead
          </div>
        )}
        {/* Student disclaimer */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 border border-border mb-6">
          <span className="text-xs text-muted-foreground leading-relaxed">
            Study materials were generated from the lecture transcript. Visual content shown on screen during the lecture may not be fully captured in text form.
          </span>
        </div>
        <motion.div
          key={`${activeTab}-${renderKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'outline' && <OutlinePanel outline={displayData.outline} videoId={videoId} strings={strings} />}
          {activeTab === 'summary' && <SummaryPanel summaries={displayData.summaries} strings={strings} />}
          {activeTab === 'flashcards' && <FlashcardsPanel flashcards={displayData.flashcards} videoId={videoId} strings={strings} isRTL={isRTL} />}
          {activeTab === 'search' && <SearchPanel searchIndex={displayData.searchIndex} videoId={videoId} language={language} strings={strings} />}
        </motion.div>
      </div>
    </div>
  );
}