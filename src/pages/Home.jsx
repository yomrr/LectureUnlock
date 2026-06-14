import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import LandingHero from '../components/LandingHero';
import LoadingScreen from '../components/LoadingScreen';
import StudentView from '../components/student/StudentView';
import FacultyView from '../components/faculty/FacultyView';

const STATE = {
  LANDING: 'landing',
  LOADING: 'loading',
  STUDENT_RESULT: 'student_result',
  FACULTY_RESULT: 'faculty_result',
  ERROR: 'error',
};

const ALL_LANGS = ['es', 'fr', 'ar', 'de'];

// Fire-and-forget: pre-translate content into all languages and cache server-side
function kickOffTranslations(videoId, content) {
  ALL_LANGS.forEach(lang => {
    base44.functions.invoke('translateContent', { videoId, language: lang, content }).catch(() => {});
  });
}

export default function Home() {
  const [appState, setAppState] = useState(STATE.LANDING);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingError, setLoadingError] = useState('');
  const [mode, setMode] = useState('student');
  const [studentData, setStudentData] = useState(null);
  const [facultyData, setFacultyData] = useState(null);
  const [videoId, setVideoId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const translationStarted = useRef(false);
  const shownPrivateMessage = useRef(false);

  const handleSubmit = useCallback(async (url, selectedMode) => {
    setMode(selectedMode);
    setAppState(STATE.LOADING);
    setLoadingStep(0);
    setLoadingError('');
    setErrorMsg('');
    translationStarted.current = false;
    if (selectedMode === 'faculty' && !shownPrivateMessage.current) {
      shownPrivateMessage.current = true;
    }

    try {
      // Step 0: Fetch transcript
      const transcriptRes = await base44.functions.invoke('fetchTranscript', { youtubeUrl: url });
      const { videoId: vid, transcript } = transcriptRes.data;
      setVideoId(vid);

      // Step 1: Analyzing structure (brief visual pause)
      setLoadingStep(1);
      await new Promise(r => setTimeout(r, 700));

      // Step 2: Building study materials (AI processing)
      setLoadingStep(2);

      if (selectedMode === 'student') {
        const processRes = await base44.functions.invoke('processStudent', { transcript, videoId: vid });
        const sData = processRes.data.result;
        const finalData = sData?.response || sData;

        // Step 3: Kick off translations (fire-and-forget)
        setLoadingStep(3);
        if (!translationStarted.current) {
          translationStarted.current = true;
          kickOffTranslations(vid, {
            outline: finalData.outline,
            summaries: finalData.summaries,
            flashcards: finalData.flashcards,
            searchIndex: finalData.searchIndex,
          });
        }
        await new Promise(r => setTimeout(r, 500));

        // Step 4: Almost ready
        setLoadingStep(4);
        await new Promise(r => setTimeout(r, 350));

        setStudentData(finalData);
        setAppState(STATE.STUDENT_RESULT);
      } else {
        const processRes = await base44.functions.invoke('processFaculty', { transcript, videoId: vid });
        const fData = processRes.data.result;
        const finalData = fData?.response || fData;

        // Step 3 (faculty has no translations — just visual)
        setLoadingStep(3);
        await new Promise(r => setTimeout(r, 500));

        // Step 4: Almost ready
        setLoadingStep(4);
        await new Promise(r => setTimeout(r, 350));

        setFacultyData(finalData);
        setAppState(STATE.FACULTY_RESULT);
      }
    } catch (err) {
      const code = err?.response?.data?.error || err.message || '';
      const LOADING_ERRORS = {
        no_transcript: "No transcript is available for this video. This may be because captions are disabled. Please try a different lecture video.",
        not_lecture: "This doesn't appear to be a lecture or educational video. Please paste a YouTube lecture URL to continue.",
      };
      const PAGE_ERRORS = {
        not_youtube: "That doesn't look like a YouTube link. Please paste a valid YouTube URL and try again.",
        video_unavailable: "This video is private, deleted, or unavailable. Please try a different public YouTube video.",
      };

      if (LOADING_ERRORS[code]) {
        setLoadingError(LOADING_ERRORS[code]);
        // Stay on loading screen — it will show the inline error
      } else {
        setErrorMsg(PAGE_ERRORS[code] || "Something went wrong while fetching the video. Please try again with a different URL.");
        setAppState(STATE.ERROR);
      }
    }
  }, []);

  const handleReset = () => {
    setAppState(STATE.LANDING);
    setStudentData(null);
    setFacultyData(null);
    setVideoId('');
    setLoadingStep(0);
    setLoadingError('');
    setErrorMsg('');
    translationStarted.current = false;
  };

  return (
    <AnimatePresence mode="wait">
      {appState === STATE.LANDING && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <LandingHero onSubmit={handleSubmit} />
        </motion.div>
      )}

      {appState === STATE.LOADING && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <LoadingScreen mode={mode} currentStep={loadingStep} errorMsg={loadingError} onReset={handleReset} showPrivateMessage={mode === 'faculty' && shownPrivateMessage.current} />
        </motion.div>
      )}

      {appState === STATE.STUDENT_RESULT && studentData && (
        <motion.div key="student" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <StudentView data={studentData} videoId={videoId} onReset={handleReset} />
        </motion.div>
      )}

      {appState === STATE.FACULTY_RESULT && facultyData && (
        <motion.div key="faculty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <FacultyView data={facultyData} videoId={videoId} onReset={handleReset} />
        </motion.div>
      )}

      {appState === STATE.ERROR && (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          className="min-h-screen grid-bg flex items-center justify-center px-4"
        >
          <div className="max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}