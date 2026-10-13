import React from 'react';
import { CatechismClass, CatechismQuestion, AppTab } from '../types/catechism';
import { BookOpen, GraduationCap, Award, CheckCircle2, ChevronRight, Sparkles, ArrowDownToLine, Smartphone, Laptop, FileText } from 'lucide-react';
import { DailyVerse } from './DailyVerse';

interface ClassSelectorProps {
  classes: CatechismClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  questions: CatechismQuestion[];
  onNavigateToTab: (tab: AppTab) => void;
  onOpenDownload?: () => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  questions,
  onNavigateToTab,
  onOpenDownload,
}) => {
  const getQuestionCountForClass = (classId: string) => {
    return questions.filter(q => q.classId === classId).length;
  };

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-8 py-2">
      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-10 shadow-lg border border-amber-900/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>BAN GIÁO LÝ HỌ TÂN VẠN · ÔN TẬP & KHẢO HẠCH GIÁO LÝ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-display mb-3 uppercase">
            HỌC HỎI GIÁO LÝ, RÈN LUYỆN ĐỨC TIN & KHẢO HẠCH
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
            Hệ thống ngân hàng câu hỏi chính thức {questions.length} câu đã được xáo trộn đáp án chuẩn xác. 
            Cung cấp sổ tay Hỏi & Trả Lời, thẻ ôn tập tương tác, thi thử tính giờ và bảng lưu kết quả công khai 
            để Ban Giáo Lý Họ Tân Vạn và phụ huynh dễ dàng kiểm tra, đánh giá.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('exam')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm rounded-lg shadow transition-all flex items-center gap-2 active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Thi Thử Ngay Lớp {currentClass.name}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('qa')}
              className="px-4 py-2.5 bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-sm rounded-lg transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Xem Sổ Tay Hỏi & Đáp</span>
            </button>
            <button
              onClick={() => onNavigateToTab('practice')}
              className="px-4 py-2.5 bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-sm rounded-lg transition-all flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Ôn Luyện Flashcard</span>
            </button>
            {onOpenDownload && (
              <button
                onClick={onOpenDownload}
                className="px-4 py-2.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-semibold text-sm rounded-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                <span>Tải Về Máy Tính & ĐT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Class Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight font-display uppercase tracking-wide">
              DANH SÁCH CÁC LỚP GIÁO LÝ
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              Chọn lớp học của em để bắt đầu ôn tập hoặc thi thử
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
            {classes.length} Lớp Đã Sẵn Sàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classes.map((cls) => {
            const count = getQuestionCountForClass(cls.id);
            const isSelected = cls.id === selectedClassId;

            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className={`relative rounded-xl p-5 border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-400/30 shadow-md'
                    : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-lg bg-stone-900 text-amber-400 font-brand font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {cls.shortCode}
                    </span>
                    <div>
                      <h3 className="font-bold text-stone-900 text-base leading-snug">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">
                        Độ tuổi: {cls.targetAge}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-amber-600 flex items-center text-xs font-medium bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Đang chọn
                    </span>
                  )}
                </div>

                <p className="text-stone-600 text-xs leading-relaxed line-clamp-2 mb-4">
                  {cls.description}
                </p>

                {/* Footer metadata & actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900">
                    {count} câu hỏi trắc nghiệm
                  </span>

                  <div className="flex items-center gap-1.5 text-stone-600 font-medium hover:text-amber-700">
                    <span>Vào học</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch Cards for currently selected class */}
      <div className="bg-stone-100/70 rounded-xl p-5 sm:p-6 border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base">
              Học Tập Với Lớp {currentClass.name}
            </h3>
            <p className="text-stone-500 text-xs">
              Các hoạt động được thiết kế riêng cho học sinh lớp này
            </p>
          </div>
          <span className="text-xs text-stone-600 bg-white px-2.5 py-1 rounded border border-stone-200">
            {getQuestionCountForClass(currentClass.id)} câu trong ngân hàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateToTab('qa')}
            className="p-4 bg-white rounded-lg border border-stone-200 hover:border-amber-400 text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center mb-2.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
              1. Sổ Tay Hỏi & Trả Lời
            </h4>
            <p className="text-stone-500 text-xs mt-1 leading-normal">
              Tra cứu {getQuestionCountForClass(currentClass.id)} câu hỏi đáp có trích dẫn bài học và đọc to.
            </p>
          </button>

          <button
            onClick={() => onNavigateToTab('practice')}
            className="p-4 bg-white rounded-lg border border-stone-200 hover:border-amber-400 text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
              2. Ôn Tập Flashcard
            </h4>
            <p className="text-stone-500 text-xs mt-1 leading-normal">
              Lật thẻ ghi nhớ, tự kiểm tra kiến thức trước kỳ khảo hạch.
            </p>
          </button>

          <button
            onClick={() => onNavigateToTab('exam')}
            className="p-4 bg-white rounded-lg border border-stone-200 hover:border-amber-400 text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
              3. Làm Bài Thi Thử
            </h4>
            <p className="text-stone-500 text-xs mt-1 leading-normal">
              Kiểm tra tính giờ, lưu kết quả công khai cho Ban Giáo Lý xem.
            </p>
          </button>
        </div>
      </div>

      {/* Feature Section: Tải Trực Tiếp Về Máy Tính & Điện Thoại */}
      {onOpenDownload && (
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-amber-50/90 via-stone-50 to-stone-100 border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                <ArrowDownToLine className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                Tải Ứng Dụng & Tài Liệu Về Máy Tính, Điện Thoại
              </h3>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Cài đặt ứng dụng trực tiếp lên màn hình chính điện thoại (iPhone, Android) và máy tính (Windows, Mac) để học tập mượt mà ngay cả khi không có mạng wifi. Hoặc tải ngay trọn bộ Sổ tay Hỏi & Trả Lời và Đề thi trắc nghiệm (PDF / A4 in ấn).
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                iOS (Safari) & Android (Chrome)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-amber-700" />
                Máy tính Windows / Mac
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                In khổ A4 & lưu PDF
              </span>
            </div>
          </div>

          <button
            onClick={onOpenDownload}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Mở Trung Tâm Tải Về Máy</span>
          </button>
        </div>
      )}

      {/* Daily Bible Verse - Added to bottom of main dashboard */}
      <DailyVerse />
    </div>
  );
};
