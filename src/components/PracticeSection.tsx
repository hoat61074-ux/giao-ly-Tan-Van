import React, { useState, useMemo, useEffect } from 'react';
import { CatechismClass, CatechismQuestion } from '../types/catechism';
import { playCorrectChime, playGentleEncouragementTone } from '../services/soundEffects';
import {
  RotateCw,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trophy,
  Target,
  LayoutGrid,
  RotateCcw,
  CheckCircle,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const LOCAL_STORAGE_PRACTICE_KEY = 'bgl_practice_known_questions_v2';

interface PracticeSectionProps {
  classes: CatechismClass[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  questions: CatechismQuestion[];
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  questions,
}) => {
  const [practiceMode, setPracticeMode] = useState<'flashcard' | 'quickquiz'>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQuestionMap, setShowQuestionMap] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => {
      const next = !prev;
      if (next) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Quick quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Known / Completed questions stored in localStorage
  const [knownQuestions, setKnownQuestions] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PRACTICE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {
      console.error('Error reading practice progress from localStorage:', e);
    }
    return new Set<string>();
  });

  // Save to localStorage whenever knownQuestions change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRACTICE_KEY, JSON.stringify(Array.from(knownQuestions)));
    } catch (e) {
      console.error('Error saving practice progress:', e);
    }
  }, [knownQuestions]);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  const classQuestions = useMemo(() => {
    return questions.filter(q => q.classId === selectedClassId);
  }, [questions, selectedClassId]);

  // Questions completed in the currently selected class
  const classKnownCount = useMemo(() => {
    return classQuestions.filter(q => knownQuestions.has(q.id)).length;
  }, [classQuestions, knownQuestions]);

  const completionPercent = useMemo(() => {
    if (classQuestions.length === 0) return 0;
    return Math.round((classKnownCount / classQuestions.length) * 100);
  }, [classKnownCount, classQuestions.length]);

  const currentQ = classQuestions[currentIndex] || classQuestions[0];

  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < classQuestions.length) {
      setCurrentIndex(index);
      setIsFlipped(false);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    if (currentIndex < classQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(classQuestions.length - 1);
    }
  };

  const toggleKnown = (qId: string) => {
    setKnownQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleResetClassProgress = () => {
    if (window.confirm(`Em có chắc chắn muốn đặt lại tiến độ ôn tập cho lớp ${currentClass.name}?`)) {
      setKnownQuestions(prev => {
        const next = new Set(prev);
        classQuestions.forEach(q => next.delete(q.id));
        return next;
      });
    }
  };

  const handleQuickQuizSubmit = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optIndex);
    setIsAnswerSubmitted(true);
    if (optIndex === currentQ?.correctOptionIndex) {
      playCorrectChime();
      setKnownQuestions(prev => new Set(prev).add(currentQ.id));
    } else {
      playGentleEncouragementTone();
    }
  };

  if (classQuestions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-stone-200 text-center text-stone-500">
        Chưa có câu hỏi nào trong lớp này.
      </div>
    );
  }

  const isKnown = knownQuestions.has(currentQ?.id || '');
  const isAllCompleted = classQuestions.length > 0 && classKnownCount === classQuestions.length;

  return (
    <div className={isFullScreen ? "fixed inset-0 z-50 bg-stone-100 overflow-y-auto p-3 sm:p-6 lg:p-8 flex flex-col" : "space-y-5 w-full max-w-[1850px] mx-auto pb-16"}>
      {/* Top Header & Mode Toggle */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-display uppercase tracking-wide">
              CHẾ ĐỘ ÔN TẬP & LUYỆN NHỚ GIÁO LÝ
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Lớp {currentClass.name} · {classKnownCount} / {classQuestions.length} câu đã thuộc ({completionPercent}%)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Select */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              onSelectClass(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
              setSelectedOption(null);
              setIsAnswerSubmitted(false);
            }}
            aria-label="Chọn Lớp Ôn Tập"
            className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Lớp {c.name}
              </option>
            ))}
          </select>

          {/* Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => {
                setPracticeMode('flashcard');
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                practiceMode === 'flashcard'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Thẻ Flashcard
            </button>
            <button
              onClick={() => {
                setPracticeMode('quickquiz');
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                practiceMode === 'quickquiz'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Luyện Trắc Nghiệm
            </button>
          </div>

          {/* Fullscreen / Wide Screen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="px-2.5 sm:px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={isFullScreen ? "Thu nhỏ giao diện" : "Mở rộng màn hình tối đa (Toàn màn hình)"}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-stone-800" />
                <span className="hidden md:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden md:inline">Màn hình rộng tối đa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Completion Celebration Card */}
      {isAllCompleted && (
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                Xuất Sắc! Em Đã Thuộc Toàn Bộ Câu Hỏi Lớp {currentClass.name} 🎉
              </h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                Đã hoàn thành 100% ({classQuestions.length}/{classQuestions.length} câu). Em có thể tự tin vào mục Thi Thử hoặc Hỏi & Đáp để kiểm tra kết quả!
              </p>
            </div>
          </div>
          <button
            onClick={handleResetClassProgress}
            className="px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg border border-emerald-500/40 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ôn luyện lại từ đầu</span>
          </button>
        </div>
      )}

      {/* 2-Column Responsive Widescreen Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Sidebar on Desktop / Top Section on Mobile: Visual Progress Indicator & Question Map */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-4">
            {/* Progress Header & Stats */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Tiến Độ
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      completionPercent === 100
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {completionPercent}%
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                    Lớp {currentClass.name} · {classKnownCount} / {classQuestions.length} câu
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowQuestionMap(!showQuestionMap)}
                  className="lg:hidden text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{showQuestionMap ? 'Ẩn' : 'Xem sơ đồ'}</span>
                </button>
                {classKnownCount > 0 && (
                  <button
                    onClick={handleResetClassProgress}
                    title="Đặt lại tiến độ lớp này"
                    className="text-xs text-stone-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Đã thuộc: <strong className="text-emerald-700">{classKnownCount}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span>Đang xem: <strong>{currentIndex + 1}/{classQuestions.length}</strong></span>
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Interactive Question Map Grid (Always on desktop, toggleable on mobile) */}
            <div className={`${showQuestionMap ? 'block' : 'hidden lg:block'} pt-2 border-t border-stone-100 space-y-2.5`}>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wide">
                  Sơ đồ câu hỏi:
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Đã thuộc
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Đang xem
                  </span>
                </div>
              </div>

              {/* Grid of question pills */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-64 lg:max-h-80 overflow-y-auto pr-1 py-1">
                {classQuestions.map((q, idx) => {
                  const isItemKnown = knownQuestions.has(q.id);
                  const isCurrent = idx === currentIndex;

                  let pillStyle = 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400';
                  if (isItemKnown) {
                    pillStyle = isCurrent
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-amber-400 border-emerald-700'
                      : 'bg-emerald-100/90 text-emerald-800 border-emerald-300 font-semibold hover:bg-emerald-200';
                  } else if (isCurrent) {
                    pillStyle = 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-2 ring-amber-300';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(idx)}
                      title={`Câu ${idx + 1}: ${q.question.substring(0, 50)}...`}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-all relative cursor-pointer ${pillStyle}`}
                    >
                      {idx + 1}
                      {isItemKnown && !isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Stage: Giant Spacious Flashcard or Quick Quiz */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* FLASHCARD MODE */}
          {practiceMode === 'flashcard' && (
            <div className="space-y-4">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`min-h-[320px] sm:min-h-[420px] rounded-2xl p-6 sm:p-10 lg:p-12 border-2 transition-all cursor-pointer shadow-md flex flex-col justify-between relative select-none ${
                  isFlipped
                    ? 'bg-amber-950 text-stone-100 border-amber-800 shadow-amber-950/20'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-amber-400'
                }`}
              >
                {/* Header info inside card */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-stone-200/40">
                  <span className={`font-bold px-3 py-1 rounded-full ${isFlipped ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                    {currentQ.lesson || `Câu hỏi ${currentIndex + 1} / ${classQuestions.length}`}
                  </span>
                  <span className={`text-xs font-medium flex items-center gap-1.5 ${isFlipped ? 'text-amber-300' : 'text-stone-500'}`}>
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Chạm để lật lại câu hỏi' : 'Chạm để lật xem đáp án'}</span>
                  </span>
                </div>

                {/* Main content */}
                <div className="my-auto py-6 text-center">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block">
                        CÂU HỎI SỐ {currentIndex + 1}:
                      </span>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-relaxed text-stone-900 break-words whitespace-normal">
                        {currentQ.question}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                        ĐÁP ÁN CHUẨN GIÁO LÝ:
                      </span>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold leading-relaxed text-amber-200 break-words whitespace-normal">
                        {currentQ.answer}
                      </p>
                      {currentQ.explanation && (
                        <p className="text-sm sm:text-base text-stone-300 italic mt-3 max-w-2xl mx-auto leading-relaxed">
                          {currentQ.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer card hint */}
                <div className="text-center text-xs opacity-70 pt-3 border-t border-stone-200/40 font-medium">
                  {isFlipped ? 'Mặt Sau: Đáp Án Giáo Lý' : 'Mặt Trước: Câu Hỏi (Nhấp bất kỳ đâu trên thẻ để lật)'}
                </div>
              </div>

              {/* Flashcard Bottom Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrev}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <button
                  onClick={() => toggleKnown(currentQ.id)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                    isKnown
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isKnown ? 'Đã thuộc bài' : 'Đánh dấu đã thuộc'}</span>
                </button>

                <button
                  onClick={handleNext}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-black rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Câu sau</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* QUICK QUIZ PRACTICE MODE */}
          {practiceMode === 'quickquiz' && (
            <div className="bg-white rounded-2xl p-5 sm:p-8 lg:p-10 border border-stone-200 shadow-md space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 text-xs sm:text-sm">
                <span className="font-extrabold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                  Câu {currentIndex + 1} / {classQuestions.length}
                </span>
                {currentQ.lesson && (
                  <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-medium border border-stone-200">
                    {currentQ.lesson}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  Câu hỏi trắc nghiệm:
                </span>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-stone-900 leading-relaxed break-words whitespace-normal">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options - Spacious Responsive Grid so questions & options never get obscured */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Chọn câu trả lời (A, B, C hoặc D):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
                  {currentQ.options.map((opt, idx) => {
                    const optLetter = ['A', 'B', 'C', 'D'][idx];
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQ.correctOptionIndex;

                    let btnStyle = 'bg-stone-50/70 hover:bg-stone-100 hover:border-amber-300 border-stone-200 text-stone-800';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-4 ring-emerald-300/40';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-100 border-rose-500 text-rose-950 ring-4 ring-rose-300/40';
                      } else {
                        btnStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => handleQuickQuizSubmit(idx)}
                        className={`w-full p-4 sm:p-5 rounded-2xl text-left border-2 flex items-start gap-3.5 sm:gap-4 transition-all min-h-[64px] sm:min-h-[76px] cursor-pointer ${btnStyle}`}
                      >
                        <span
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-2xs mt-0.5 ${
                            isAnswerSubmitted && isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isAnswerSubmitted && isSelected && !isCorrect
                              ? 'bg-rose-600 text-white'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {optLetter}
                        </span>
                        <span className="text-sm sm:text-base lg:text-lg leading-relaxed flex-1 font-medium break-words whitespace-normal text-stone-900">{opt}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback & explanation callout */}
              {isAnswerSubmitted && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm ${
                    selectedOption === currentQ.correctOptionIndex
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 mb-1.5 text-sm sm:text-base">
                    {selectedOption === currentQ.correctOptionIndex ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Chính Xác! Em đã trả lời đúng.</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5 text-rose-600" />
                        <span>Chưa đúng rồi! Hãy ghi nhớ đáp án chuẩn sau:</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 font-bold text-stone-900 text-sm sm:text-base">
                    Đáp án: {currentQ.answer}
                  </p>
                  {currentQ.explanation && (
                    <p className="mt-1.5 text-stone-700 italic leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Next Question Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-stone-100">
                <button
                  onClick={handlePrev}
                  className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <div className="text-xs sm:text-sm text-stone-500 font-medium">
                  Câu <strong>{currentIndex + 1}</strong> trên <strong>{classQuestions.length}</strong>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{currentIndex < classQuestions.length - 1 ? 'Câu tiếp theo' : 'Bắt đầu lại'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
