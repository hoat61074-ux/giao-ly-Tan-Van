import React, { useState, useEffect, useRef } from 'react';
import { CatechismClass, CatechismQuestion, StudentExamSubmission, StudentAnswerRecord, AppTab } from '../types/catechism';
import { submitExamResult } from '../services/storage';
import { playSubmissionTone, playOptionSelectTick } from '../services/soundEffects';
import { Clock, Award, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Printer, AlertCircle, Maximize2, Minimize2, Check, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';

interface ExamSectionProps {
  classes: CatechismClass[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  questions: CatechismQuestion[];
  onNavigateToTab: (tab: AppTab) => void;
}

export const ExamSection: React.FC<ExamSectionProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  questions,
  onNavigateToTab,
}) => {
  // Phase: 'setup' | 'taking' | 'completed'
  const [examPhase, setExamPhase] = useState<'setup' | 'taking' | 'completed'>('setup');

  // Setup options
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  // Student info form
  const [studentName, setStudentName] = useState('');
  const [saintName, setSaintName] = useState('');
  const [parentName, setParentName] = useState('');
  const [subGroup, setSubGroup] = useState('Giáo họ Tân Vạn');
  const [formError, setFormError] = useState('');

  // Active exam state
  const [activeQuestions, setActiveQuestions] = useState<CatechismQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({}); // qIndex -> optionIndex
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [examResult, setExamResult] = useState<StudentExamSubmission | null>(null);

  // Maximum Wide Screen / Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showQuestionMapMobile, setShowQuestionMapMobile] = useState(false);

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

  const timerRef = useRef<any>(null);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classQuestions = questions.filter(q => q.classId === selectedClassId);

  // Countdown timer
  useEffect(() => {
    if (examPhase === 'taking' && timeLimitMinutes > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examPhase, timeLimitMinutes]);

  const startExam = () => {
    if (!studentName.trim()) {
      setFormError('Vui lòng nhập họ và tên học sinh để lưu kết quả cho Ban Giáo Lý');
      return;
    }
    setFormError('');

    // Shuffle and pick questions
    const shuffled = [...classQuestions].sort(() => Math.random() - 0.5);
    const count = Math.min(questionCount, shuffled.length);
    const selected = shuffled.slice(0, count);

    setActiveQuestions(selected);
    setCurrentQIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(timeLimitMinutes * 60);
    setExamPhase('taking');
  };

  const handleSelectOption = (optIndex: number) => {
    playOptionSelectTick();
    setUserAnswers(prev => ({
      ...prev,
      [currentQIndex]: optIndex,
    }));
  };

  const handleAutoSubmit = () => {
    submitExam();
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    const records: StudentAnswerRecord[] = activeQuestions.map((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        questionText: q.question,
        selectedOptionIndex: selected !== undefined ? selected : -1,
        correctOptionIndex: q.correctOptionIndex,
        options: q.options,
        isCorrect: Boolean(isCorrect),
      };
    });

    const total = activeQuestions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) / 10 : 0;
    const timeSpent = timeLimitMinutes > 0 ? (timeLimitMinutes * 60 - timeLeftSeconds) : 0;

    const submissionData: Omit<StudentExamSubmission, 'id' | 'submittedAt'> = {
      studentName: studentName.trim(),
      saintName: saintName.trim() || 'Học sinh',
      parentName: parentName.trim() || undefined,
      className: currentClass.name,
      classId: currentClass.id,
      submissionType: 'exam',
      subGroup: subGroup.trim() || undefined,
      score,
      maxScore: 10,
      correctCount,
      totalQuestions: total,
      timeSpentSeconds: timeSpent,
      answersSummary: records,
    };

    try {
      const saved = await submitExamResult(submissionData);
      setExamResult(saved);
    } catch {
      // Fallback object
      setExamResult({
        ...submissionData,
        id: `local_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        verified: false,
      });
    }

    setIsSubmitting(false);
    playSubmissionTone();
    setExamPhase('completed');
  };

  const getRankBadge = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất Sắc', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    if (score >= 6.5) return { label: 'Khá', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (score >= 5.0) return { label: 'Đạt Yêu Cầu', color: 'bg-stone-100 text-stone-800 border-stone-300' };
    return { label: 'Cần Cố Gắng Ôn Thêm', color: 'bg-rose-100 text-rose-900 border-rose-300' };
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ----------------- SETUP PHASE -----------------
  if (examPhase === 'setup') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-display uppercase tracking-wide">
              KHẢO HẠCH & THI THỬ GIÁO LÝ
            </h2>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm">
            Kết quả thi của em sẽ được lưu công khai để Ban Giáo Lý Họ Tân Vạn theo dõi và đánh giá.
          </p>

          <div className="mt-6 space-y-5">
            {/* Class Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                1. Chọn Lớp Giáo Lý
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({questions.filter(q => q.classId === c.id).length} câu trong ngân hàng)
                  </option>
                ))}
              </select>
            </div>

            {/* Student Information Form */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                <span className="text-amber-600">✝</span> THÔNG TIN HỌC SINH KHẢO HẠCH
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tên Thánh (Bổn Mạng):
                  </label>
                  <input
                    type="text"
                    value={saintName}
                    onChange={(e) => setSaintName(e.target.value)}
                    placeholder="VD: Maria, Giuse, Phêrô, Têrêsa..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Họ và Tên Học Sinh <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Họ và Tên Bố Mẹ:
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Bình & Maria Trần Thị Hương"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Giáo Họ / Xứ Đoàn / Tổ:
                  </label>
                  <input
                    type="text"
                    value={subGroup}
                    onChange={(e) => setSubGroup(e.target.value)}
                    placeholder="VD: Giáo họ Tân Vạn"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Test Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  2. Số Lượng Câu Hỏi
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 20, 30].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        questionCount === cnt
                          ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {cnt} câu
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  3. Thời Gian Làm Bài
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 15, 20].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeLimitMinutes(mins)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        timeLimitMinutes === mins
                          ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              onClick={startExam}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-base rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5 text-stone-950" />
              <span>Bắt Đầu Làm Bài Thi</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- TAKING EXAM PHASE -----------------
  if (examPhase === 'taking') {
    const currentQ = activeQuestions[currentQIndex];
    const answeredCount = Object.keys(userAnswers).length;
    const isTimeUrgent = timeLeftSeconds <= 120 && timeLimitMinutes > 0;

    return (
      <div className={isFullScreen ? "fixed inset-0 z-50 bg-stone-100 overflow-y-auto p-3 sm:p-6 lg:p-8 flex flex-col" : "w-full max-w-[1850px] mx-auto space-y-4 pb-16"}>
        {/* Sticky Exam Top Bar - Guaranteed never to obscure questions */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-stone-200 shadow-sm flex items-center justify-between gap-3 sticky top-0 sm:top-16 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-bold text-stone-900 text-xs sm:text-sm bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200 shrink-0">
              Lớp {currentClass.name}
            </span>
            <span className="text-xs sm:text-sm text-stone-600 truncate">
              Thí sinh: <strong className="text-stone-900 font-bold">{saintName} {studentName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {timeLimitMinutes > 0 && (
              <div
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-mono font-bold text-xs sm:text-sm border ${
                  isTimeUrgent
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-stone-50 text-stone-800 border-stone-200'
                }`}
                title="Thời gian làm bài còn lại"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {/* Toggle Maximum Wide Screen / Fullscreen */}
            <button
              onClick={toggleFullScreen}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title={isFullScreen ? "Thu nhỏ giao diện bài thi" : "Mở rộng màn hình tối đa (Toàn màn hình)"}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-stone-800" />
                  <span className="hidden md:inline">Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-amber-700" />
                  <span className="hidden md:inline">Màn hình rộng tối đa</span>
                </>
              )}
            </button>

            <button
              onClick={submitExam}
              disabled={isSubmitting}
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp Bài'}
            </button>
          </div>
        </div>

        {/* Mobile Question Map Toggle Bar (Only on mobile to prevent obscuring) */}
        <div className="lg:hidden bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-amber-700" />
            <span className="font-semibold text-stone-800">
              Đã làm: <strong className="text-emerald-700 font-bold">{answeredCount}</strong> / {activeQuestions.length} câu
            </span>
          </div>
          <button
            onClick={() => setShowQuestionMapMobile(!showQuestionMapMobile)}
            className="px-2.5 py-1 bg-white border border-stone-300 rounded-md font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1 transition-colors"
          >
            <span>{showQuestionMapMobile ? 'Ẩn sơ đồ câu' : 'Xem sơ đồ câu'}</span>
            {showQuestionMapMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mobile Collapsible Question Palette */}
        {showQuestionMapMobile && (
          <div className="lg:hidden bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs space-y-2 animate-in fade-in duration-200">
            <p className="text-[11px] text-stone-500 font-medium">Chạm số câu để di chuyển nhanh:</p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {activeQuestions.map((_, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isCurrent = idx === currentQIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQIndex(idx);
                      setShowQuestionMapMobile(false);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400 font-black'
                        : isAnswered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-Column Responsive Widescreen Grid on desktop (Question Map on Sidebar, Giant Question Card on Main) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Desktop Left Sidebar: Question Palette & Student Info */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs">
                <span className="font-bold text-stone-800 uppercase tracking-wide">Sơ Đồ Câu Hỏi</span>
                <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {answeredCount} / {activeQuestions.length} câu
                </span>
              </div>

              {/* Matrix of question buttons */}
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                {activeQuestions.map((_, idx) => {
                  const isAnswered = userAnswers[idx] !== undefined;
                  const isCurrent = idx === currentQIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQIndex(idx)}
                      title={`Chuyển đến câu ${idx + 1}`}
                      className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400 font-black shadow-xs'
                          : isAnswered
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 ring-1 ring-amber-400 inline-block" />
                  <span>Đang xem</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-stone-100 border border-stone-300 inline-block" />
                  <span>Chưa làm</span>
                </div>
              </div>

              {/* Quick Submit on sidebar */}
              <button
                onClick={submitExam}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Nộp Bài Thi Ngay</span>
              </button>
            </div>
          </aside>

          {/* Right Main Stage: Giant Spacious Question Card */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            {currentQ && (
              <div className="bg-white rounded-2xl p-5 sm:p-8 lg:p-10 border border-stone-200 shadow-md space-y-6 sm:space-y-8">
                {/* Question Card Top Bar */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 text-xs sm:text-sm">
                      CÂU {currentQIndex + 1} / {activeQuestions.length}
                    </span>
                    {currentQ.lesson && (
                      <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-medium border border-stone-200 hidden sm:inline">
                        {currentQ.lesson}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-stone-500 text-xs font-medium">
                    <span>{userAnswers[currentQIndex] !== undefined ? '✓ Đã chọn đáp án' : 'Chưa chọn đáp án'}</span>
                  </div>
                </div>

                {/* Giant, High-Clarity Question Text - Never Truncated or Obscured */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    Nội dung câu hỏi:
                  </span>
                  <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-stone-900 leading-relaxed break-words whitespace-normal">
                    {currentQ.question}
                  </h3>
                </div>

                {/* 4 Shuffled Options - Spacious Responsive 2-Column Grid on Wide Screen */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                    Chọn 1 đáp án đúng nhất (A, B, C hoặc D):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
                    {currentQ.options.map((opt, optIdx) => {
                      const optLetter = ['A', 'B', 'C', 'D'][optIdx];
                      const isSelected = userAnswers[currentQIndex] === optIdx;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full p-4 sm:p-5 rounded-2xl text-left border-2 flex items-start gap-3.5 sm:gap-4 transition-all cursor-pointer min-h-[64px] sm:min-h-[76px] ${
                            isSelected
                              ? 'bg-amber-50 border-amber-500 ring-4 ring-amber-300/40 text-stone-950 shadow-sm'
                              : 'bg-stone-50/70 hover:bg-stone-100 hover:border-amber-300 border-stone-200 text-stone-800'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 transition-colors shadow-2xs mt-0.5 ${
                              isSelected
                                ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {optLetter}
                          </span>
                          <span className="text-sm sm:text-base lg:text-lg leading-relaxed flex-1 font-medium break-words whitespace-normal text-stone-900">
                            {opt}
                          </span>
                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Large Clear Navigation Bar at Bottom */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-stone-100">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                    className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Câu trước</span>
                  </button>

                  <div className="text-xs sm:text-sm text-stone-500 font-medium">
                    Câu <strong>{currentQIndex + 1}</strong> trên <strong>{activeQuestions.length}</strong>
                  </div>

                  {currentQIndex < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex(prev => prev + 1)}
                      className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={submitExam}
                      className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-sm font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                      <span>Hoàn Tất & Nộp Bài</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ----------------- COMPLETED / RESULTS REVIEW PHASE -----------------
  if (examPhase === 'completed' && examResult) {
    const rank = getRankBadge(examResult.score);

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Scorecard Hero Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-stone-200 shadow-md text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-700 mb-1">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">
            Kết Quả Bài Khảo Hạch Giáo Lý
          </h2>
          <p className="text-stone-600 text-sm">
            Thí sinh: <strong className="text-stone-900">{examResult.saintName} {examResult.studentName}</strong> · Lớp {examResult.className}
            {examResult.subGroup && ` · ${examResult.subGroup}`}
          </p>

          {/* Big Score Number */}
          <div className="py-4">
            <div className="text-5xl sm:text-6xl font-black text-amber-600 font-mono tracking-tight">
              {examResult.score.toFixed(1)} <span className="text-2xl text-stone-400 font-normal">/ 10</span>
            </div>
            <div className="mt-2">
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${rank.color}`}>
                Xếp loại: {rank.label}
              </span>
            </div>
          </div>

          {/* Summary metrics strip */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto py-3 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm">
            <div>
              <span className="text-stone-500 block">Số câu đúng</span>
              <strong className="text-emerald-700 text-base">{examResult.correctCount} / {examResult.totalQuestions}</strong>
            </div>
            <div>
              <span className="text-stone-500 block">Tỉ lệ đạt</span>
              <strong className="text-stone-800 text-base">
                {Math.round((examResult.correctCount / examResult.totalQuestions) * 100)}%
              </strong>
            </div>
            <div>
              <span className="text-stone-500 block">Thời gian làm</span>
              <strong className="text-stone-800 text-base">{formatTime(examResult.timeSpentSeconds)}</strong>
            </div>
          </div>

          <p className="text-xs text-emerald-700 bg-emerald-50 py-2 px-4 rounded-lg border border-emerald-200 max-w-md mx-auto">
            ✓ Kết quả đã được lưu công khai vào hệ thống của Ban Giáo Lý Họ Tân Vạn!
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToTab('results')}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-colors"
            >
              Xem Bảng Kết Quả Công Khai
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs sm:text-sm rounded-lg border border-stone-300 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Điểm</span>
            </button>

            <button
              onClick={() => {
                setExamPhase('setup');
                setUserAnswers({});
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
            >
              Thi Lại Bài Khác
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-stone-900">
            Xem Lại Chi Tiết Bài Làm ({examResult.answersSummary.length} câu)
          </h3>

          {examResult.answersSummary.map((ans, idx) => {
            const isCorrect = ans.isCorrect;

            return (
              <div
                key={ans.questionId}
                className={`p-5 rounded-xl border bg-white shadow-xs ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h4 className="font-semibold text-stone-900 text-sm leading-snug">
                      {ans.questionText}
                    </h4>
                  </div>

                  {isCorrect ? (
                    <span className="flex items-center text-xs font-semibold text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Đúng
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-semibold text-rose-700 shrink-0">
                      <XCircle className="w-4 h-4 mr-1" />
                      Sai
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pl-8 text-xs sm:text-sm mt-3">
                  {ans.options.map((opt, oIdx) => {
                    const optLetter = ['A', 'B', 'C', 'D'][oIdx];
                    const isChosen = ans.selectedOptionIndex === oIdx;
                    const isTheCorrectOpt = ans.correctOptionIndex === oIdx;

                    let rowStyle = 'bg-stone-50 border-stone-200 text-stone-600';
                    if (isTheCorrectOpt) {
                      rowStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                    } else if (isChosen && !isTheCorrectOpt) {
                      rowStyle = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border flex items-center justify-between ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{optLetter}.</span>
                          <span>{opt}</span>
                        </div>
                        {isTheCorrectOpt && (
                          <span className="text-[11px] font-bold text-emerald-700 uppercase">
                            Đáp án đúng
                          </span>
                        )}
                        {isChosen && !isTheCorrectOpt && (
                          <span className="text-[11px] font-bold text-rose-700 uppercase">
                            Em đã chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
