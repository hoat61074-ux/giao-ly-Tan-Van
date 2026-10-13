import React, { useState } from 'react';
import { CatechismClass, CatechismQuestion } from '../types/catechism';
import { parseUploadedTextToQuestions, addCustomQuestions, saveCustomClass } from '../services/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, PlusCircle, HelpCircle } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: CatechismClass[];
  selectedClassId: string;
  onQuestionsAdded: (count: number) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onQuestionsAdded,
}) => {
  const [targetClassId, setTargetClassId] = useState(selectedClassId);
  const [isCreatingNewClass, setIsCreatingNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassAge, setNewClassAge] = useState('');

  const [rawText, setRawText] = useState('');
  const [defaultAnswerIsD, setDefaultAnswerIsD] = useState(true);
  const [parsedQuestions, setParsedQuestions] = useState<CatechismQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      setIsParsed(false);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung câu hỏi tài liệu!');
      return;
    }

    let classIdToUse = targetClassId;
    if (isCreatingNewClass) {
      if (!newClassName.trim()) {
        alert('Vui lòng nhập tên lớp mới!');
        return;
      }
      const newId = `custom-class-${Date.now()}`;
      const newClass: CatechismClass = {
        id: newId,
        name: newClassName.trim(),
        shortCode: newClassName.trim().substring(0, 3).toUpperCase(),
        targetAge: newClassAge.trim() || 'Mọi lứa tuổi',
        description: `Tài liệu giáo lý lớp ${newClassName.trim()} do Ban Giáo Lý tải lên.`,
        themeColor: 'from-purple-600 to-purple-700',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-900',
      };
      saveCustomClass(newClass);
      classIdToUse = newId;
    }

    const { questions, errors } = parseUploadedTextToQuestions(rawText, classIdToUse, defaultAnswerIsD);
    setParsedQuestions(questions);
    setParseErrors(errors);
    setIsParsed(true);
  };

  const handleSaveToBank = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSaving(true);
    await addCustomQuestions(parsedQuestions);
    setIsSaving(false);
    onQuestionsAdded(parsedQuestions.length);
    onClose();
  };

  const insertSampleTemplate = () => {
    const sample = `Câu 1: Thiên Chúa nói cho ta biết về Người là Cha yêu thương qua những điều gì và những ai? (Bài 1, câu 1, trang 8)
A. Qua công trình tạo dựng
B. Qua các tổ phụ, qua cha mẹ ta
C. Qua cha quản xứ, qua thầy cô giáo lý viên
D. Qua thiên nhiên, qua các tổ phụ, các ngôn sứ và nhất là qua Chúa Giê-su

Câu 2: Cuốn sách nào ghi lời Thiên Chúa nói với ta? (Bài 1, câu 2, trang 8)
A. Sách giáo lý
B. Sách kinh
C. Sách giáo khoa
D. Sách Kinh Thánh`;
    setRawText(sample);
    setIsParsed(false);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 font-display uppercase tracking-wide">
                TẢI TÀI LIỆU LÊN & QUẢN LÝ ĐỀ THI
              </h3>
              <p className="text-xs text-stone-500">
                Nhập file câu hỏi hoặc dán văn bản để tự động trích xuất và xáo trộn đáp án
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Class selection */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800">Lớp Giáo Lý Áp Dụng:</span>
              <button
                type="button"
                onClick={() => setIsCreatingNewClass(!isCreatingNewClass)}
                className="text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isCreatingNewClass ? 'Chọn lớp có sẵn' : 'Tạo thêm lớp mới'}
              </button>
            </div>

            {!isCreatingNewClass ? (
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-stone-300 font-medium text-stone-800 bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.targetAge})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Tên lớp mới (vd: Sơ Cấp 3, Căn Bản 2...)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="p-2 rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Lứa tuổi (vd: 9 - 10 tuổi)"
                  value={newClassAge}
                  onChange={(e) => setNewClassAge(e.target.value)}
                  className="p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>
            )}
          </div>

          {/* Options & Configuration */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultAnswerIsD}
                onChange={(e) => setDefaultAnswerIsD(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="font-bold text-amber-950 text-xs">
                Tài liệu gốc mặc định đáp án là D (Tự động xáo trộn ngẫu nhiên A, B, C, D)
              </span>
            </label>

            <button
              type="button"
              onClick={insertSampleTemplate}
              className="text-amber-800 hover:text-amber-900 underline font-medium text-right self-end sm:self-auto"
            >
              Dán mẫu thử
            </button>
          </div>

          {/* Text Area or File input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800">
                Nội dung tài liệu câu hỏi (Văn bản hoặc chọn tệp .txt):
              </label>
              <label className="cursor-pointer text-stone-600 hover:text-stone-900 font-medium inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Chọn file .txt từ máy</span>
                <input type="file" accept=".txt,.json,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setIsParsed(false);
              }}
              placeholder={`Dán nội dung câu hỏi tại đây theo định dạng:
Câu 1: Ai đã tạo dựng nên trời đất? (Bài 1, trang 8)
A. Tự nhiên mà có
B. Các thiên thần
C. Các thánh
D. Thiên Chúa`}
              className="w-full p-3 font-mono text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/40"
            />
          </div>

          {/* Parse Trigger Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleParse}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold transition-all shadow-sm"
            >
              Phân Tích & Xem Trước ({rawText.split('\n').filter(l => /^câu\s+\d+/i.test(l.trim())).length} câu phát hiện)
            </button>

            {isParsed && (
              <span className="text-emerald-700 font-bold">
                ✓ Đã phân tích thành công: {parsedQuestions.length} câu hỏi
              </span>
            )}
          </div>

          {/* Errors if any */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="font-bold text-rose-800 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Lưu ý khi phân tích ({parseErrors.length} cảnh báo):
              </div>
              <ul className="list-disc list-inside text-rose-700 space-y-0.5">
                {parseErrors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview parsed questions */}
          {isParsed && parsedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-stone-800 uppercase tracking-wider">
                Xem Trước Các Câu Hỏi Đã Xáo Trộn:
              </h4>

              <div className="max-h-56 overflow-y-auto space-y-2.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-stone-200 text-xs">
                    <div className="font-bold text-stone-900">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1.5 text-stone-600">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1 rounded text-[11px] ${
                            oIdx === q.correctOptionIndex
                              ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                              : ''
                          }`}
                        >
                          {letters[oIdx]}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-semibold text-xs"
          >
            Đóng
          </button>

          <button
            onClick={handleSaveToBank}
            disabled={!isParsed || parsedQuestions.length === 0 || isSaving}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSaving ? 'Đang Lưu...' : `Lưu ${parsedQuestions.length} Câu Vào Ngân Hàng`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
