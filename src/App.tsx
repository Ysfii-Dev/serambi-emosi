import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import InputAudioPage from './components/InputAudioPage';
import Navbar from './components/Navbar';
import ResultPage from './components/ResultPage';
import type { AnalysisResponse } from './types/analysis';

type PageState = 'landing' | 'input' | 'result';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageState>('landing');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const handleStart = () => {
    setCurrentPage('input');
  };

  const handleGoHome = () => {
    setCurrentPage('landing');
  };

  const handleGoInput = () => {
    setCurrentPage('input');
  };

  const handleGoResult = () => {
    if (analysisResult) {
      setCurrentPage('result');
    }
  };

  const handleAnalyze = (file: File | null, result: AnalysisResponse) => {
    setAudioFile(file);
    setAnalysisResult(result);
    setCurrentPage('result');
  };

  const handleReset = () => {
    setAudioFile(null);
    setAnalysisResult(null);
    setCurrentPage('input');
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-cream text-ink font-sans selection:bg-terracotta/20 selection:text-terracotta-dark">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-terracotta/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-calm-blue/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sage/10 blur-3xl" />
      </div>

      <Navbar
        currentPage={currentPage}
        hasResult={Boolean(analysisResult)}
        onGoHome={handleGoHome}
        onGoInput={handleGoInput}
        onGoResult={handleGoResult}
        onRestart={handleReset}
      />

      <main className="relative z-10 flex-1 pt-24 sm:pt-[6.5rem]">
        <AnimatePresence mode="wait">
          {currentPage === 'landing' && (
            <motion.div key="landing" className="h-full">
              <LandingPage onStart={handleStart} />
            </motion.div>
          )}

          {currentPage === 'input' && (
            <motion.div key="input" className="h-full">
              <InputAudioPage onAnalyze={handleAnalyze} />
            </motion.div>
          )}

          {currentPage === 'result' && (
            <motion.div key="result" className="h-full">
              <ResultPage
                file={audioFile}
                result={analysisResult}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer
        currentPage={currentPage}
        hasResult={Boolean(analysisResult)}
        onGoHome={handleGoHome}
        onGoInput={handleGoInput}
        onGoResult={handleGoResult}
      />
    </div>
  );
}
