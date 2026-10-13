import React, { useState } from 'react';
import { CatechismClass, CatechismQuestion } from '../types/catechism';
import { addCustomQuestions } from '../services/storage';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Download, Plus } from 'lucide-react';

interface MaterialsSectionProps {
  classes: CatechismClass[];
  selectedClassId: string;
  onRefreshQuestions: () => void;
}

export const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  classes,
  selectedClassId,
  onRefreshQuestions,
}) => {
  const [targetClassId, setTargetClassId] = useState(selectedClassId);
  const [inputText, setInputText] = useState('');
  const [shuffleDefaultD, setShuffleDefaultD] = useState(true);
  const [parsedPreview, setParsedPreview] = useState<CatechismQuestion[]>([]);
  const [parseMessage, setParseMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        handleParse(content);
      }
    };
    reader.readAsText(file);
  };

  // Parser function
  const handleParse = (textToParse = inputText) => {
    if (!textToParse.trim()) {
      setParseMessage('Vui lòng dán hoặc tải nội dung tài liệu câu hỏi lên.');
      return;
    }

    const lines = textToParse.split('\n');
    const questions: CatechismQuestion[] = [];
    let currentQNum: number | null = null;
    let currentQText = '';
    let optionsMap: { A?: string; B?: string; C?: string; D?: string } = {};

    function finalizeQ() {
      if (currentQNum !== null && currentQText && optionsMap.A && optionsMap.B && optionsMap.C && optionsMap.D) {
        const origA = optionsMap.A.trim();
        const origB = optionsMap.B.trim();
        const origC = optionsMap.C.trim();
        const origD = optionsMap.D.trim();

        let finalOpts: [string, string, string, string] = [origA, origB, origC, origD];
        let correctIdx = 3; // Default D

        if (shuffleDefaultD) {
          // Shuffle options so correct answer is balanced
          correctIdx = (currentQNum * 3 + targetClassId.length) % 4;
          const wrongOpts = [origA, origB, origC];
          if (currentQNum % 2 === 1) wrongOpts.reverse();

          const newOpts: string[] = [];
          let wIdx = 0;
          for (let i = 0; i < 4; i++) {
            if (i === correctIdx) newOpts.push(origD);
            else newOpts.push(wrongOpts[wIdx++]);
          }
          finalOpts = newOpts as [string, string, string, string];
        }

        const lessonMatch = currentQText.match(/\((Bài\s+[^)]+)\)/i);
        const lessonStr = lessonMatch ? lessonMatch[1].trim() : undefined;
        const cleanQuestion = currentQText.replace(/\((Bài\s+[^)]+)\)/gi, '').trim();

        questions.push({
          id: `custom_${targetClassId}_${Date.now()}_${currentQNum}`,
          classId: targetClassId,
          lesson: lessonStr,
          category: classes.find(c => c.id === targetClassId)?.name || 'Tài Liệu Tải Lên',
          question: cleanQuestion,
          answer: origD,
          options: finalOpts,
          correctOptionIndex: correctIdx,
          isCustom: true,
        });
      }
      optionsMap = {};
    }

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const qMatch = line.match(/^Câu\s+(\d+)\s*:\s*(.*)/i);
      if (qMatch) {
        finalizeQ();
        currentQNum = parseInt(qMatch[1], 10);
        currentQText = qMatch[2].trim();
        continue;
      }

      // Check options
      const optRegex = /([A-D])\.\s*/g;
      const foundMarkers: { key: 'A' | 'B' | 'C' | 'D'; start: number; textStart: number }[] = [];
      let m;
      while ((m = optRegex.exec(line)) !== null) {
        foundMarkers.push({
          key: m[1] as any,
          start: m.index,
          textStart: m.index + m[0].length,
        });
      }

      if (foundMarkers.length > 0) {
        for (let i = 0; i < foundMarkers.length; i++) {
          const key = foundMarkers[i].key;
          const start = foundMarkers[i].textStart;
          const end = i + 1 < foundMarkers.length ? foundMarkers[i + 1].start : line.length;
          const chunk = line.substring(start, end).trim();
          optionsMap[key] = (optionsMap[key] ? optionsMap[key] + ' ' : '') + chunk;
        }
        continue;
      }

      if (currentQNum !== null) {
        if (Object.keys(optionsMap).length === 0) {
          currentQText += ' ' + line;
        } else {
          const lastKey = (['D', 'C', 'B', 'A'] as const).find(k => optionsMap[k] !== undefined);
          if (lastKey) {
            optionsMap[lastKey] += ' ' + line;
          }
        }
      }
    }

    finalizeQ();

    if (questions.length > 0) {
      setParsedPreview(questions);
      setParseMessage(`Đã nhận diện thành công ${questions.length} câu hỏi hợp lệ!`);
    } else {
      setParsedPreview([]);
      setParseMessage('Không tìm thấy câu hỏi đúng định dạng. Xin xem mẫu hướng dẫn bên dưới.');
    }
  };

  const handleSaveToBank = async () => {
    if (parsedPreview.length === 0) return;
    setIsSaving(true);
    const ok = await addCustomQuestions(parsedPreview);
    setIsSaving(false);

    if (ok) {
      setIsSuccess(true);
      setInputText('');
      setParsedPreview([]);
      onRefreshQuestions();
      setTimeout(() => setIsSuccess(false), 5000);
    }
  };

  const downloadSampleTemplate = () => {
    const sample = `Câu 1: Ai là Đấng sáng tạo nên trời đất muôn vật? (Bài 1, trang 5)
A. Các thiên thần
B. Các vị vua trần gian
C. Tự nhiên mà có
D. Thiên Chúa tình yêu

Câu 2: Kinh nào tóm tắt các điều người Công Giáo phải tin? (Bài 2, trang 8)
A. Kinh Lạy Cha
B. Kinh Kính Mừng
C. Kinh Sáng Danh
D. Kinh Tin Kính
`;
    const blob = new Blob([sample], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mau_De_Thi_Giao_Ly_BGL_Ho_Tan_Van.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <h2 className="text-xl font-bold text-stone-900 font-display uppercase tracking-wide">
            TẢI TÀI LIỆU & CẬP NHẬT ĐỀ THI GIÁO LÝ
          </h2>
        </div>
        <p className="text-stone-500 text-xs sm:text-sm">
          Ban Giáo Lý Họ Tân Vạn có thể tải file hoặc dán trực tiếp câu hỏi trắc nghiệm của các lớp. 
          Hệ thống sẽ tự động phân tích và xáo trộn 4 đáp án theo yêu cầu.
        </p>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Thêm vào Lớp:
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={shuffleDefaultD}
                onChange={(e) => setShuffleDefaultD(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
              />
              <span>Tự động xáo trộn đáp án chuẩn D sang ngẫu nhiên A, B, C, D</span>
            </label>
          </div>
        </div>

        {/* Upload box */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Nội Dung Tài Liệu:
            </span>
            <button
              onClick={downloadSampleTemplate}
              className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu .txt</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán câu hỏi vào đây theo mẫu:&#10;Câu 1: Thiên Chúa nói cho ta biết...&#10;A. Đáp án 1&#10;B. Đáp án 2&#10;C. Đáp án 3&#10;D. Đáp án 4..."
            className="w-full p-3 font-mono text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium rounded-lg border border-stone-300 cursor-pointer flex items-center gap-1.5 transition-colors">
              <UploadCloud className="w-4 h-4" />
              <span>Chọn file từ máy tính (.txt, .json)</span>
              <input
                type="file"
                accept=".txt,.json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => handleParse()}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Phân Tích & Xem Trước</span>
            </button>
          </div>

          {parseMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                parsedPreview.length > 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {parsedPreview.length > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{parseMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Đã lưu thành công câu hỏi vào ngân hàng đề thi của Ban Giáo Lý!</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {parsedPreview.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Xem Trước Các Câu Hỏi Đã Phân Tích ({parsedPreview.length} câu)
              </h3>
              <p className="text-xs text-stone-500">
                Kiểm tra lại trước khi lưu chính thức vào ngân hàng đề
              </p>
            </div>

            <button
              onClick={handleSaveToBank}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Vào Ngân Hàng Đề'}</span>
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {parsedPreview.map((q, idx) => (
              <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">
                    Câu {idx + 1}: {q.question}
                  </span>
                  {q.lesson && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                      {q.lesson}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] pl-3">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={oIdx === q.correctOptionIndex ? 'font-bold text-emerald-800' : 'text-stone-600'}
                    >
                      {['A', 'B', 'C', 'D'][oIdx]}. {opt}
                      {oIdx === q.correctOptionIndex && ' ✓ (Đáp án đúng)'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
