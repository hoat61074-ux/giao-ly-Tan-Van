import React, { useState, useMemo, useEffect } from 'react';
import { CatechismClass, CatechismQuestion, AppTab, StudentExamSubmission } from '../types/catechism';
import { submitExamResult } from '../services/storage';
import {
  playCorrectChime,
  playSubmissionTone,
  playOptionSelectTick,
  playGentleEncouragementTone,
} from '../services/soundEffects';
import {
  Search,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Check,
  RotateCcw,
  Sparkles,
  Send,
  User,
  Share2,
  CheckCircle2,
  ArrowDownToLine,
  CheckSquare,
  AlertCircle
} from 'lucide-react';

const LOCAL_STORAGE_QA_ANSWERS_KEY = 'bgl_qa_student_answers_v2';
const LOCAL_STORAGE_STUDENT_PROFILE_KEY = 'bgl_qa_student_profile_v2';
const PUBLIC_SHARED_URL = 'https://ais-pre-krph32zhpf4cxfd3ta5d2d-860545552666.asia-southeast1.run.app';

interface QASectionProps {
  classes: CatechismClass[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  questions: CatechismQuestion[];
  onNavigateToTab?: (tab: AppTab) => void;
  onOpenDownload?: () => void;
}

interface QuestionAnswerState {
  selectedOptionIndex: number;
  isSubmitted: boolean;
  isCorrect: boolean;
}

export const QASection: React.FC<QASectionProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  questions,
  onNavigateToTab,
  onOpenDownload,
}) => {
  // Student & Parent Information State
  const [studentName, setStudentName] = useState('');
  const [saintName, setSaintName] = useState('');
  const [parentName, setParentName] = useState('');
  const [subGroup, setSubGroup] = useState('Giáo họ Tân Vạn');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'correct' | 'incorrect'>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Student Answers state: { [questionId]: { selectedOptionIndex: number, isSubmitted: boolean, isCorrect: boolean } }
  const [userAnswers, setUserAnswers] = useState<Record<string, QuestionAnswerState>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_QA_ANSWERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized: Record<string, QuestionAnswerState> = {};
        for (const [key, val] of Object.entries(parsed as Record<string, any>)) {
          if (val && typeof val.selectedOptionIndex === 'number') {
            normalized[key] = {
              selectedOptionIndex: val.selectedOptionIndex,
              isCorrect: Boolean(val.isCorrect),
              // Default to submitted if restored from previous legacy submissions
              isSubmitted: val.isSubmitted !== undefined ? Boolean(val.isSubmitted) : true,
            };
          }
        }
        return normalized;
      }
    } catch (e) {
      console.error('Error reading QA answers from localStorage:', e);
    }
    return {};
  });

  // Sync / Submission status modal
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessModal, setSyncSuccessModal] = useState<{
    isOpen: boolean;
    score: number;
    correctCount: number;
    totalAnswered: number;
    student: string;
    parent: string;
    className: string;
    submittedAt: string;
  } | null>(null);

  // Feedback notifications
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load student profile from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_STUDENT_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.saintName) setSaintName(parsed.saintName);
        if (parsed.parentName) setParentName(parsed.parentName);
        if (parsed.subGroup) setSubGroup(parsed.subGroup);
      } else {
        // First time: expand profile inputs for easy entry
        setIsEditingProfile(true);
      }
    } catch (e) {
      console.error('Error reading student profile:', e);
    }
  }, []);

  // Save student profile whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_STUDENT_PROFILE_KEY,
        JSON.stringify({ studentName, saintName, parentName, subGroup })
      );
    } catch (e) {
      console.error('Error saving student profile:', e);
    }
  }, [studentName, saintName, parentName, subGroup]);

  // Save answers whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_QA_ANSWERS_KEY, JSON.stringify(userAnswers));
    } catch (e) {
      console.error('Error saving QA answers:', e);
    }
  }, [userAnswers]);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Questions belonging to the currently selected class
  const classQuestions = useMemo(() => {
    return questions.filter(q => q.classId === selectedClassId);
  }, [questions, selectedClassId]);

  // Questions that student has SUBMITTED (Đã nộp câu trả lời)
  const submittedInClass = useMemo(() => {
    return classQuestions.filter(q => userAnswers[q.id]?.isSubmitted);
  }, [classQuestions, userAnswers]);

  // Questions answered correctly among submitted
  const correctInClass = useMemo(() => {
    return classQuestions.filter(q => userAnswers[q.id]?.isSubmitted && userAnswers[q.id]?.isCorrect);
  }, [classQuestions, userAnswers]);

  // Questions answered incorrectly among submitted
  const incorrectInClass = useMemo(() => {
    return classQuestions.filter(q => userAnswers[q.id]?.isSubmitted && !userAnswers[q.id]?.isCorrect);
  }, [classQuestions, userAnswers]);

  // Questions student has selected but NOT yet submitted
  const pendingInClass = useMemo(() => {
    return classQuestions.filter(q => {
      const ans = userAnswers[q.id];
      return ans !== undefined && !ans.isSubmitted && typeof ans.selectedOptionIndex === 'number';
    });
  }, [classQuestions, userAnswers]);

  // Scoring metrics (Mỗi câu nộp đúng = 1 điểm, chỉ tính sau khi nộp)
  const currentScore = correctInClass.length;
  const answeredCount = submittedInClass.length;
  const totalClassCount = classQuestions.length;

  const scorePercentage = useMemo(() => {
    if (answeredCount === 0) return 0;
    return Math.round((currentScore / answeredCount) * 100);
  }, [currentScore, answeredCount]);

  // Distinct lessons in this class
  const lessons = useMemo(() => {
    const set = new Set<string>();
    classQuestions.forEach(q => {
      if (q.lesson) {
        const m = q.lesson.match(/Bài\s+\d+/i);
        if (m) set.add(m[0]);
        else set.add(q.lesson);
      }
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.replace(/\D/g, '') || '0', 10);
      return numA - numB;
    });
  }, [classQuestions]);

  // 1. Student selects/changes an option choice (ĐÁNH DẤU CHỌN - ẨN ĐÁP ÁN, CHƯA CHẤM ĐIỂM)
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    // If question is already submitted, clicking option does not alter it unless reset
    if (userAnswers[questionId]?.isSubmitted) {
      const q = classQuestions.find(item => item.id === questionId);
      if (q && optionIndex === q.correctOptionIndex) {
        playCorrectChime();
      } else {
        playOptionSelectTick();
      }
      return;
    }

    playOptionSelectTick();

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOptionIndex: optionIndex,
        isSubmitted: false, // Remains hidden until submitted!
        isCorrect: false, // Score not calculated until submitted
      },
    }));
  };

  // 2. Student submits their choice for this question (NỘP BÀI CÂU NÀY - MỚI HIỂN THỊ ĐÁP ÁN ĐÚNG & CHẤM ĐIỂM)
  const handleSubmitChoice = (questionId: string) => {
    const q = classQuestions.find(item => item.id === questionId);
    const existing = userAnswers[questionId];
    if (!q || existing === undefined || existing.selectedOptionIndex === undefined) return;

    const isCorrect = existing.selectedOptionIndex === q.correctOptionIndex;

    if (isCorrect) {
      playCorrectChime();
    } else {
      playGentleEncouragementTone();
    }

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOptionIndex: existing.selectedOptionIndex,
        isSubmitted: true,
        isCorrect, // Chấm 1 điểm nếu đúng!
      },
    }));
  };

  // 3. Submit all pending chosen questions at once
  const handleSubmitAllPending = () => {
    let hasCorrect = false;
    setUserAnswers(prev => {
      const next = { ...prev };
      classQuestions.forEach(q => {
        const existing = next[q.id];
        if (existing && !existing.isSubmitted && typeof existing.selectedOptionIndex === 'number') {
          const isCorrect = existing.selectedOptionIndex === q.correctOptionIndex;
          if (isCorrect) hasCorrect = true;
          next[q.id] = {
            selectedOptionIndex: existing.selectedOptionIndex,
            isSubmitted: true,
            isCorrect,
          };
        }
      });
      return next;
    });

    if (hasCorrect) {
      playCorrectChime();
    } else {
      playOptionSelectTick();
    }
  };

  // Reset answer/selection for a single question
  const handleResetSingleQuestion = (questionId: string) => {
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Reset all answers for current class
  const handleResetClassAnswers = () => {
    setUserAnswers(prev => {
      const next = { ...prev };
      classQuestions.forEach(q => {
        delete next[q.id];
      });
      return next;
    });
    setShowResetConfirm(false);
  };

  // Sync results with Ban Giáo Lý Kiểm Tra
  const handleSyncWithBGL = async () => {
    setFormError(null);

    // Validation
    if (!studentName.trim()) {
      setFormError('Vui lòng nhập Họ và Tên học sinh ở phần thông tin phía trên trước khi đồng bộ.');
      setIsEditingProfile(true);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (!parentName.trim()) {
      setFormError('Vui lòng nhập Họ và Tên bố mẹ để Ban Giáo Lý ghi nhận bài làm của em.');
      setIsEditingProfile(true);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // Auto-submit any pending selected answers before syncing so student work isn't discarded
    let activeSubmissions = { ...userAnswers };
    let finalAnsweredCount = answeredCount;
    let finalCorrectCount = currentScore;

    if (pendingInClass.length > 0) {
      classQuestions.forEach(q => {
        const item = activeSubmissions[q.id];
        if (item && !item.isSubmitted && typeof item.selectedOptionIndex === 'number') {
          const isCorrect = item.selectedOptionIndex === q.correctOptionIndex;
          activeSubmissions[q.id] = {
            selectedOptionIndex: item.selectedOptionIndex,
            isSubmitted: true,
            isCorrect,
          };
        }
      });
      setUserAnswers(activeSubmissions);
      const submittedList = classQuestions.filter(q => activeSubmissions[q.id]?.isSubmitted);
      const correctList = classQuestions.filter(q => activeSubmissions[q.id]?.isSubmitted && activeSubmissions[q.id]?.isCorrect);
      finalAnsweredCount = submittedList.length;
      finalCorrectCount = correctList.length;
    }

    if (finalAnsweredCount === 0) {
      setFormError('Em hãy chọn và nộp câu trả lời ít nhất 1 câu hỏi để Ban Giáo Lý có thể chấm điểm.');
      return;
    }

    setIsSyncing(true);

    try {
      const submittedList = classQuestions.filter(q => activeSubmissions[q.id]?.isSubmitted);

      // Build submission record
      const answersSummary = submittedList.map(q => {
        const ans = activeSubmissions[q.id];
        return {
          questionId: q.id,
          questionText: q.question,
          selectedOptionIndex: ans.selectedOptionIndex,
          correctOptionIndex: q.correctOptionIndex,
          options: q.options,
          isCorrect: ans.isCorrect,
        };
      });

      const submission: StudentExamSubmission = {
        id: `qa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentName: studentName.trim(),
        saintName: saintName.trim(),
        parentName: parentName.trim(),
        className: currentClass.name,
        classId: currentClass.id,
        subGroup: subGroup.trim() || 'Giáo họ Tân Vạn',
        submissionType: 'qa',
        score: finalCorrectCount, // Mỗi câu đúng 1 điểm!
        maxScore: totalClassCount,
        correctCount: finalCorrectCount,
        totalQuestions: finalAnsweredCount,
        timeSpentSeconds: 0,
        submittedAt: new Date().toISOString(),
        verified: false,
        teacherNote: '',
        answersSummary,
      };

      await submitExamResult(submission);
      playSubmissionTone();

      setSyncSuccessModal({
        isOpen: true,
        score: finalCorrectCount,
        correctCount: finalCorrectCount,
        totalAnswered: finalAnsweredCount,
        student: `${saintName ? saintName + ' ' : ''}${studentName}`,
        parent: parentName,
        className: currentClass.name,
        submittedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      });
    } catch (err) {
      console.error('Lỗi khi đồng bộ kết quả:', err);
      setFormError('Có lỗi xảy ra khi gửi bài làm. Vui lòng kiểm tra lại kết nối và thử lại.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy Public Link to share with parents/students
  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(PUBLIC_SHARED_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Vietnamese Speech TTS (Chỉ đọc đáp án nếu đã nộp bài)
  const speakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Filter questions list
  const filteredQuestions = useMemo(() => {
    return classQuestions.filter(q => {
      // Search
      const s = searchQuery.toLowerCase().trim();
      const matchSearch =
        !s ||
        q.question.toLowerCase().includes(s) ||
        q.answer.toLowerCase().includes(s) ||
        (q.explanation && q.explanation.toLowerCase().includes(s)) ||
        (q.lesson && q.lesson.toLowerCase().includes(s));

      // Lesson
      const matchLesson =
        selectedLesson === 'all' ||
        (q.lesson && q.lesson.toLowerCase().includes(selectedLesson.toLowerCase()));

      // Status
      const ans = userAnswers[q.id];
      const isSub = ans?.isSubmitted === true;
      let matchStatus = true;
      if (statusFilter === 'unanswered') matchStatus = !isSub;
      else if (statusFilter === 'correct') matchStatus = isSub && ans.isCorrect;
      else if (statusFilter === 'incorrect') matchStatus = isSub && !ans.isCorrect;

      return matchSearch && matchLesson && matchStatus;
    });
  }, [classQuestions, searchQuery, selectedLesson, statusFilter, userAnswers]);

  return (
    <div className="w-full max-w-[1850px] mx-auto space-y-6 pb-16">
      {/* 1. PUBLIC LINK SHARING BANNER (Sửa lỗi các máy khác không mở được) */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white rounded-xl p-4 sm:p-5 border border-amber-600/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                Đường Link Làm Bài Công Khai Toàn Thể Họ Tân Vạn
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-stone-100">
              Mọi máy tính, điện thoại iPhone & Android đều mở được trực tiếp không bị lỗi
            </h2>
            <p className="text-xs text-stone-300">
              Phụ huynh và các em học sinh nhấp vào đường link công khai bên dưới để ôn bài và làm trắc nghiệm mọi lúc mọi nơi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {onOpenDownload && (
              <button
                onClick={onOpenDownload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all bg-stone-800 hover:bg-stone-750 text-amber-300 border border-amber-500/40 shadow-sm active:scale-95"
              >
                <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                <span>Tải Về Máy / In PDF</span>
              </button>
            )}

            <button
              onClick={handleCopyPublicLink}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                copiedLink
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Đã Sao Chép Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Sao Chép Link Gửi Zalo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. STUDENT & PARENT PROFILE CARD (Thêm mục họ tên học sinh, lớp, họ tên bố mẹ) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 uppercase tracking-wide">
                Thông Tin Học Sinh & Phụ Huynh
              </h2>
              <p className="text-xs text-stone-500">
                Thông tin được lưu tự động để đồng bộ bài làm cho Ban Giáo Lý Họ Tân Vạn kiểm tra
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-colors border border-amber-200"
          >
            {isEditingProfile ? 'Thu gọn' : 'Chỉnh sửa thông tin'}
          </button>
        </div>

        {/* Profile Inputs (Always visible if empty or editing) */}
        {(!studentName || !parentName || isEditingProfile) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Tên Thánh & Họ Tên Học Sinh */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tên Thánh & Họ Tên Học Sinh <span className="text-rose-600">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên Thánh (VD: Giuse)"
                  value={saintName}
                  onChange={(e) => setSaintName(e.target.value)}
                  className="w-1/3 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Họ và Tên em (VD: Nguyễn Văn An)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-2/3 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Lớp Giáo Lý */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Lớp Giáo Lý <span className="text-rose-600">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-semibold focus:ring-2 focus:ring-amber-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({questions.filter(q => q.classId === c.id).length} câu)
                  </option>
                ))}
              </select>
            </div>

            {/* Họ và Tên Bố Mẹ */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Họ và Tên Bố Mẹ <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Bình & Maria Trần Thị Hương"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Giáo Họ / Tổ */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Giáo Họ / Tổ
              </label>
              <input
                type="text"
                placeholder="VD: Giáo họ Tân Vạn"
                value={subGroup}
                onChange={(e) => setSubGroup(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        ) : (
          /* Profile Summary Badge */
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-stone-800">
              <div>
                <span className="text-stone-500">Học sinh:</span>{' '}
                <strong className="text-stone-900 font-bold">
                  {saintName ? `${saintName} ` : ''}{studentName}
                </strong>
              </div>
              <div className="h-3 w-px bg-stone-300 hidden sm:block" />
              <div>
                <span className="text-stone-500">Lớp:</span>{' '}
                <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {currentClass.name}
                </span>
              </div>
              <div className="h-3 w-px bg-stone-300 hidden sm:block" />
              <div>
                <span className="text-stone-500">Bố mẹ:</span>{' '}
                <strong className="text-stone-900">{parentName}</strong>
              </div>
              {subGroup && (
                <>
                  <div className="h-3 w-px bg-stone-300 hidden sm:block" />
                  <div>
                    <span className="text-stone-500">Địa chỉ:</span>{' '}
                    <span>{subGroup}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium flex items-center gap-2">
            <span className="text-rose-600 font-bold">⚠️</span>
            <span>{formError}</span>
          </div>
        )}
      </div>

      {/* 3. SCORING & SYNC CONTROL BAR (Ẩn đáp án ban đầu - Nộp câu trả lời mới hiện đáp án đúng và chấm 1đ/câu) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
        {/* Class Title & Sync Button Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 uppercase tracking-wide">
                Hỏi & Trả Lời: Lớp {currentClass.name}
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Đáp án đúng được <strong>ẩn ban đầu</strong>. Học sinh nhấp chọn đáp án và bấm <strong>&ldquo;Nộp câu trả lời&rdquo;</strong> để xem đáp án đúng và được chấm <strong>1 điểm cho mỗi câu đúng</strong>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {pendingInClass.length > 0 && (
              <button
                onClick={handleSubmitAllPending}
                className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Nộp {pendingInClass.length} câu đã chọn</span>
              </button>
            )}

            <button
              onClick={handleSyncWithBGL}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Nộp Bài & Đồng Bộ Lên BGL'}</span>
            </button>
          </div>
        </div>

        {/* Live Score Metrics Ribbon (Chỉ tính sau khi học sinh nộp câu trả lời) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {/* Điểm Hiện Tại */}
          <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-300 rounded-xl">
            <span className="text-amber-800 text-xs font-semibold block">Điểm Đã Đạt (1đ/câu)</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 font-mono mt-0.5">
              {currentScore} <span className="text-sm font-semibold text-amber-700">điểm</span>
            </div>
          </div>

          {/* Số câu đúng */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-emerald-800 text-xs font-semibold block">Số Câu Đã Nộp Đúng</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono mt-0.5">
              {currentScore} <span className="text-xs font-normal text-emerald-700">/ {answeredCount} đã nộp</span>
            </div>
          </div>

          {/* Đã nộp / Tổng số */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
            <span className="text-stone-600 text-xs font-semibold block">Tiến Độ Đã Nộp</span>
            <div className="text-2xl sm:text-3xl font-black text-stone-800 font-mono mt-0.5">
              {answeredCount} <span className="text-xs font-normal text-stone-500">/ {totalClassCount} câu</span>
            </div>
          </div>

          {/* Tỉ Lệ Chính Xác */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-blue-800 text-xs font-semibold block">Tỉ Lệ Chính Xác</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono mt-0.5">
              {scorePercentage}%
            </div>
          </div>
        </div>

        {/* Pending Banner if user has chosen but not submitted yet */}
        {pendingInClass.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Em đang có <strong>{pendingInClass.length} câu đã chọn</strong> nhưng chưa nộp. Hãy bấm <strong>&ldquo;Nộp câu trả lời&rdquo;</strong> ở từng câu hoặc bấm nút bên cạnh để chấm điểm.
              </span>
            </div>
            <button
              onClick={handleSubmitAllPending}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs"
            >
              Nộp tất cả {pendingInClass.length} câu này
            </button>
          </div>
        )}

        {/* Progress Bar & Reset Option */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>Tiến độ hoàn thành bài: <strong>{Math.round((answeredCount / (totalClassCount || 1)) * 100)}%</strong> ({answeredCount}/{totalClassCount} câu đã nộp)</span>
            {answeredCount > 0 && (
              showResetConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleResetClassAnswers}
                    className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700"
                  >
                    Xác nhận xóa hết
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[11px] hover:bg-stone-300"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-stone-500 hover:text-rose-600 flex items-center gap-1 text-[11px] hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Làm lại từ đầu</span>
                </button>
              )
            )}
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((answeredCount / (totalClassCount || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm câu hỏi, nội dung..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Lesson Filter */}
          <div>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              aria-label="Lọc theo bài học"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tất cả bài học ({totalClassCount} câu)</option>
              {lessons.map(lsn => (
                <option key={lsn} value={lsn}>
                  {lsn}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Lọc theo trạng thái câu hỏi"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tất cả câu hỏi ({totalClassCount})</option>
              <option value="unanswered">Chưa nộp ({totalClassCount - answeredCount})</option>
              <option value="correct">Đã nộp đúng (+1đ) ({currentScore})</option>
              <option value="incorrect">Đã nộp sai (0đ) ({incorrectInClass.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. QUESTIONS LIST (Ẩn đáp án ban đầu; chỉ hiện đáp án đúng và chấm điểm sau khi nộp) */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-stone-200 text-stone-500">
            <p className="text-base font-semibold text-stone-700">Không tìm thấy câu hỏi phù hợp</p>
            <p className="text-xs text-stone-500 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chuyển bộ lọc bài học / trạng thái về Tất cả.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isSpeaking = speakingId === q.id;
            const answerState = userAnswers[q.id];
            const hasChosen = answerState !== undefined && typeof answerState.selectedOptionIndex === 'number';
            const isSubmitted = answerState?.isSubmitted === true;
            const isStudentCorrect = isSubmitted && answerState.isCorrect;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl p-5 border transition-all shadow-xs ${
                  !isSubmitted
                    ? hasChosen
                      ? 'border-amber-300 bg-amber-50/10 ring-1 ring-amber-400/20'
                      : 'border-stone-200 hover:border-amber-300'
                    : isStudentCorrect
                    ? 'border-emerald-300 bg-emerald-50/15 ring-1 ring-emerald-400/20'
                    : 'border-rose-300 bg-rose-50/15 ring-1 ring-rose-400/20'
                }`}
              >
                {/* Question title & actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-7 h-7 rounded-md bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center border border-stone-200 font-mono">
                      {q.questionNumber || idx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-stone-900 text-sm sm:text-base leading-snug">
                        {q.question}
                      </h3>
                      {q.lesson && (
                        <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-200/60">
                          {q.lesson}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Status Badge: Only revealed when submitted */}
                    {isSubmitted ? (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isStudentCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isStudentCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đúng (+1 điểm)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Chưa đúng (0 điểm)</span>
                          </>
                        )}
                      </span>
                    ) : hasChosen ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Đã chọn (Chưa nộp)
                      </span>
                    ) : null}

                    {/* Reset button for this question */}
                    {(hasChosen || isSubmitted) && (
                      <button
                        onClick={() => handleResetSingleQuestion(q.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg text-xs"
                        title={isSubmitted ? "Làm lại câu này" : "Bỏ chọn câu này"}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Audio pronunciation: only reads answer if submitted */}
                    <button
                      onClick={() => speakText(q.id, `Câu hỏi: ${q.question}. ${isSubmitted ? `Đáp án đúng là: ${q.answer}` : ''}`)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSpeaking
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-stone-50 text-stone-500 hover:text-stone-800 border-stone-200'
                      }`}
                      title="Nghe đọc câu hỏi"
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options Grid (ẨN ĐÁP ÁN: Học sinh chưa nộp thì hiển thị lựa chọn trung tính, sau khi bấm Nộp mới hiện đáp án đúng) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 pl-0 sm:pl-9">
                  {q.options.map((opt, optIdx) => {
                    const optLetter = ['A', 'B', 'C', 'D'][optIdx];
                    const isCorrectOpt = optIdx === q.correctOptionIndex;
                    const isChosenByStudent = hasChosen && answerState.selectedOptionIndex === optIdx;

                    let buttonStyle = 'bg-stone-50/80 border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300';
                    let letterBadgeStyle = 'bg-stone-200 text-stone-700';

                    if (!isSubmitted) {
                      // NOT SUBMITTED YET: Correct answer is completely HIDDEN
                      if (isChosenByStudent) {
                        buttonStyle = 'bg-amber-50 border-amber-400 text-stone-900 font-medium ring-2 ring-amber-400/30';
                        letterBadgeStyle = 'bg-amber-500 text-white font-bold';
                      }
                    } else {
                      // SUBMITTED: Reveal correct answer and mark student's choice
                      if (isCorrectOpt) {
                        buttonStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400/40';
                        letterBadgeStyle = 'bg-emerald-600 text-white';
                      } else if (isChosenByStudent && !isCorrectOpt) {
                        buttonStyle = 'bg-rose-50 border-rose-300 text-rose-950 line-through opacity-90';
                        letterBadgeStyle = 'bg-rose-600 text-white';
                      } else {
                        buttonStyle = 'bg-stone-50/40 border-stone-200 text-stone-400 opacity-60';
                        letterBadgeStyle = 'bg-stone-200 text-stone-400';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-3 rounded-lg text-xs sm:text-sm flex items-start gap-2.5 border transition-all ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer'
                        } ${buttonStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${letterBadgeStyle}`}
                        >
                          {optLetter}
                        </span>
                        <span className="leading-relaxed flex-1 break-words whitespace-normal">{opt}</span>

                        {/* Visual indicators when answered */}
                        {!isSubmitted && isChosenByStudent && (
                          <span className="shrink-0 text-amber-700 font-bold text-[11px] bg-amber-100 px-2 py-0.5 rounded">
                            Đang chọn
                          </span>
                        )}

                        {isSubmitted && isCorrectOpt && (
                          <span className="shrink-0 text-emerald-600 flex items-center gap-1 font-bold text-[11px]">
                            <CheckCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Đáp án đúng</span>
                          </span>
                        )}

                        {isSubmitted && isChosenByStudent && !isCorrectOpt && (
                          <span className="shrink-0 text-rose-600 flex items-center gap-1 font-bold text-[11px]">
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Em đã chọn</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Submitting choice section: Before submission, show action to submit */}
                {!isSubmitted && (
                  <div className="pl-0 sm:pl-9 mt-2">
                    {hasChosen ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-amber-50/70 border border-amber-300 rounded-lg animate-fadeIn">
                        <div className="text-xs text-stone-700">
                          <span className="font-semibold text-amber-900">Em đã chọn đáp án: </span>
                          <strong className="text-amber-800 font-bold px-2 py-0.5 bg-amber-100 rounded border border-amber-300">
                            {['A', 'B', 'C', 'D'][answerState.selectedOptionIndex]}
                          </strong>
                          <span className="text-stone-500 ml-1.5 hidden sm:inline">(Đáp án đúng đang được ẩn)</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleResetSingleQuestion(q.id)}
                            className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-medium rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors"
                          >
                            Chọn lại
                          </button>
                          <button
                            onClick={() => handleSubmitChoice(q.id)}
                            className="flex-1 sm:flex-none px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Nộp câu trả lời & Chấm điểm</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic">
                        👉 Hãy nhấp chọn 1 đáp án A, B, C hoặc D rồi bấm &ldquo;Nộp câu trả lời&rdquo; để xem đáp án đúng và được chấm 1 điểm.
                      </p>
                    )}
                  </div>
                )}

                {/* Revealed Answer & Catechism Explanation (CHỈ HIỂN THỊ SAU KHI HỌC SINH ĐÃ NỘP BÀI) */}
                {isSubmitted && (
                  <div className="ml-0 sm:ml-9 mt-3 p-3.5 bg-amber-50/80 rounded-lg border border-amber-300/80 text-xs sm:text-sm space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Đáp Án Đúng Chuẩn Giáo Lý Họ Tân Vạn:</span>
                      </div>
                      <button
                        onClick={() => handleResetSingleQuestion(q.id)}
                        className="text-stone-500 hover:text-amber-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Làm lại</span>
                      </button>
                    </div>
                    <p className="text-stone-900 leading-relaxed font-semibold pl-5">
                      {q.answer}
                    </p>
                    {q.explanation && (
                      <p className="text-[11px] text-stone-600 italic pl-5 pt-0.5 border-t border-amber-200/60">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. SUCCESS SYNC MODAL */}
      {syncSuccessModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 uppercase">
                Đồng Bộ Thành Công Lên Ban Giáo Lý!
              </h3>
              <p className="text-xs text-stone-600">
                Bài làm của em đã được gửi trực tiếp đến hệ thống Ban Giáo Lý Họ Tân Vạn
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Học sinh:</span>
                <strong className="text-stone-900 font-bold">{syncSuccessModal.student}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Lớp Giáo Lý:</span>
                <strong className="text-amber-800 font-bold">{syncSuccessModal.className}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Họ và tên bố mẹ:</span>
                <strong className="text-stone-900">{syncSuccessModal.parent}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Số câu đúng:</span>
                <strong className="text-emerald-700 font-bold">
                  {syncSuccessModal.correctCount} / {syncSuccessModal.totalAnswered} câu
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500 font-semibold">Điểm số (1đ/câu):</span>
                <strong className="text-amber-900 font-mono text-base font-black">
                  {syncSuccessModal.score} điểm
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => setSyncSuccessModal(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-lg transition-colors"
              >
                Tiếp Tục Ôn Tập
              </button>
              {onNavigateToTab && (
                <button
                  onClick={() => {
                    setSyncSuccessModal(null);
                    onNavigateToTab('results');
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors"
                >
                  Xem Tại BGL Kiểm Tra
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
