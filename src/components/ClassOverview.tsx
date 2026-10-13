import React from 'react';
import { CatechismClass, CatechismQuestion } from '../types/catechism';
import { BookOpen, CheckCircle, GraduationCap, ArrowRight, Sparkles, FileText, Upload } from 'lucide-react';

interface ClassOverviewProps {
  classes: CatechismClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  questions: CatechismQuestion[];
  onStartQA: (classId: string) => void;
  onStartPractice: (classId: string) => void;
  onStartExam: (classId: string) => void;
  onOpenUpload: () => void;
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  questions,
  onStartQA,
  onStartPractice,
  onStartExam,
  onOpenUpload,
}) => {
  const getQuestionCountForClass = (classId: string) => {
    return questions.filter(q => q.classId === classId).length;
  };

  return (
    <div className="space-y-8">
      {/* Sacred Pastoral Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 text-white p-6 sm:p-10 shadow-lg">
        {/* Liturgical Golden Light Accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Hệ Thống Khảo Hạch Giáo Lý Trực Tuyến
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-100 font-brand">
            ÔN TẬP GIÁO LÝ - BGL HỌ TÂN VẠN
          </h1>

          <p className="mt-3 text-stone-300 text-sm sm:text-base leading-relaxed">
            Nền tảng học hỏi Lời Chúa và Giáo lý Công giáo dành riêng cho các em thiếu nhi và thiếu niên.
            Bộ đề đã được chuẩn hóa, xáo trộn ngẫu nhiên đáp án A, B, C, D công bằng, lưu kết quả công khai
            để Ban Giáo Lý Họ Tân Vạn và Phụ Huynh thuận tiện kiểm tra, theo dõi tiến độ từng em.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onStartExam(selectedClassId)}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Bắt Đầu Thi Thử Ngay
            </button>
            <button
              onClick={() => onStartQA(selectedClassId)}
              className="px-4 py-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 text-stone-200 font-medium text-sm transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Xem Toàn Bộ Câu Hỏi & Đáp
            </button>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2.5 rounded-lg bg-stone-800/50 hover:bg-stone-700/60 border border-stone-700 text-amber-300 font-medium text-sm transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              Tải Thêm Đề Mới
            </button>
          </div>
        </div>
      </section>

      {/* Class Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-display uppercase tracking-wide">DANH SÁCH LỚP GIÁO LÝ</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Chọn lớp để xem câu hỏi, học ôn tập bài hoặc tiến hành kiểm tra
            </p>
          </div>
          <span className="text-xs text-stone-500 tabular-nums">
            {classes.length} Lớp đang mở
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const count = getQuestionCountForClass(cls.id);
            const isSelected = selectedClassId === cls.id;

            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className={`relative rounded-xl border p-5 transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                }`}
              >
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-800 text-xs border border-stone-200 font-mono">
                      {cls.shortCode}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">{cls.name}</h3>
                      <p className="text-xs text-stone-500">{cls.targetAge}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200 tabular-nums">
                    {count} câu hỏi
                  </span>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 mb-5 min-h-[32px]">
                  {cls.description}
                </p>

                {/* Action button row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.id);
                      onStartQA(cls.id);
                    }}
                    className="py-1.5 px-2 text-center text-xs font-medium rounded bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors"
                  >
                    Hỏi & Đáp
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.id);
                      onStartPractice(cls.id);
                    }}
                    className="py-1.5 px-2 text-center text-xs font-medium rounded bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors"
                  >
                    Ôn Tập
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.id);
                      onStartExam(cls.id);
                    }}
                    className="py-1.5 px-2 text-center text-xs font-semibold rounded bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-sm"
                  >
                    Thi Thử
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pedagogical Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5 font-bold">
            <CheckCircle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">Đã Xáo Trộn Đáp Án</h4>
          <p className="text-xs text-stone-600 mt-1">
            Toàn bộ câu hỏi gốc có đáp án mặc định D đã được phân bố ngẫu nhiên và chuẩn xác vào A, B, C, D để các em học tập trung và khách quan.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center mb-2.5 font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">Lưu Kết Quả Công Khai</h4>
          <p className="text-xs text-stone-600 mt-1">
            Học sinh nhập Tên Thánh, Họ và Tên khi nộp bài. Ban Giáo Lý có thể tra cứu, kiểm tra chi tiết bài làm của từng em và xuất file báo cáo.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5 font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">Đọc To & Thẻ Ghi Nhớ</h4>
          <p className="text-xs text-stone-600 mt-1">
            Hỗ trợ giọng đọc tiếng Việt cho các em nhỏ nghe đi nghe lại câu hỏi, học qua flashcards lật thẻ và làm bài kiểm tra tính giờ.
          </p>
        </div>
      </div>
    </div>
  );
};
