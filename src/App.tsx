import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppTab, CatechismClass, CatechismQuestion } from './types/catechism';
import { getCatechismClasses, getAllQuestions } from './services/storage';
import { Header } from './components/Header';
import { ClassSelector } from './components/ClassSelector';
import { QASection } from './components/QASection';
import { PracticeSection } from './components/PracticeSection';
import { ExamSection } from './components/ExamSection';
import { ResultsLeaderboard } from './components/ResultsLeaderboard';
import { MaterialsSection } from './components/MaterialsSection';
import { DirectDownloadModal } from './components/DirectDownloadModal';
import { ArrowDownToLine } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('classes');
  const [classes, setClasses] = useState<CatechismClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('so-cap-1');
  const [questions, setQuestions] = useState<CatechismQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [downloadModalTab, setDownloadModalTab] = useState<'app' | 'materials' | 'link'>('app');

  const handleOpenDownload = (tab: 'app' | 'materials' | 'link' = 'app') => {
    setDownloadModalTab(tab);
    setIsDownloadModalOpen(true);
  };

  const loadData = async () => {
    try {
      const clsList = getCatechismClasses();
      setClasses(clsList);
      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }

      const qList = await getAllQuestions();
      setQuestions(qList);
    } catch (err) {
      console.error('Error loading catechism data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Smooth scroll to top whenever the user switches tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans">
      {/* Liturgical Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalQuestionsCount={questions.length}
        onOpenDownload={handleOpenDownload}
      />

      {/* Main Workspace Body with Smooth Page Transitions & Maximum Wide Screen */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 overflow-x-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-500 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Đang tải dữ liệu Giáo Lý Ban Họ Tân Vạn...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full"
            >
              {currentTab === 'classes' && (
                <ClassSelector
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  questions={questions}
                  onNavigateToTab={setCurrentTab}
                  onOpenDownload={() => handleOpenDownload('app')}
                />
              )}

              {currentTab === 'qa' && (
                <QASection
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  questions={questions}
                  onNavigateToTab={setCurrentTab}
                  onOpenDownload={() => handleOpenDownload('app')}
                />
              )}

              {currentTab === 'practice' && (
                <PracticeSection
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  questions={questions}
                />
              )}

              {currentTab === 'exam' && (
                <ExamSection
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  questions={questions}
                  onNavigateToTab={setCurrentTab}
                />
              )}

              {currentTab === 'results' && (
                <ResultsLeaderboard
                  classes={classes}
                />
              )}

              {currentTab === 'materials' && (
                <MaterialsSection
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onRefreshQuestions={loadData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Quiet, Anti-Slop Liturgical Footer */}
      <footer className="mt-auto bg-stone-900 border-t border-stone-800 text-stone-400 py-6 text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-serif">✝</span>
            <span className="font-semibold text-stone-300">
              ÔN TẬP GIÁO LÝ - BGL HỌ TÂN VẠN
            </span>
          </div>
          <div className="text-stone-500 text-center sm:text-right">
            Ngân hàng {questions.length} câu hỏi giáo lý chính thức · Tự động xáo trộn đáp án chuẩn xác
          </div>
        </div>
      </footer>

      {/* Floating 1-Click Download Button for PC and Mobile */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          onClick={() => handleOpenDownload('app')}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-amber-300/80 cursor-pointer"
          title="Tải ứng dụng và tài liệu về máy tính & điện thoại bằng 1 cú nhấp"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <ArrowDownToLine className="w-4 h-4 text-white" />
          <div className="flex flex-col text-left leading-none">
            <span className="text-xs font-black tracking-tight uppercase">Tải Về Máy</span>
            <span className="text-[10px] text-amber-100 font-semibold mt-0.5">1 Cú Nhấp · PC & Mobile</span>
          </div>
        </button>
      </div>

      {/* Direct Download to Computer & Phone Modal */}
      <DirectDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        classes={classes}
        selectedClassId={selectedClassId}
        questions={questions}
        initialTab={downloadModalTab}
      />
    </div>
  );
}
