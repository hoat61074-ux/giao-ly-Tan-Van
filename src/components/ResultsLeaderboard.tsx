import React, { useState, useEffect, useMemo } from 'react';
import { StudentExamSubmission, CatechismClass } from '../types/catechism';
import { getExamResults, updateTeacherNote, deleteExamResult } from '../services/storage';
import { Search, Download, Printer, CheckCircle2, Eye, Trash2, RefreshCw, MessageSquare, X } from 'lucide-react';

interface ResultsLeaderboardProps {
  classes: CatechismClass[];
}

export const ResultsLeaderboard: React.FC<ResultsLeaderboardProps> = ({ classes }) => {
  const [results, setResults] = useState<StudentExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all'); // 'all' | 'pass' | 'fail' | 'excellent'

  // Modal detail view
  const [inspectSubmission, setInspectSubmission] = useState<StudentExamSubmission | null>(null);

  // Edit note modal
  const [editingSubmission, setEditingSubmission] = useState<StudentExamSubmission | null>(null);
  const [teacherNoteInput, setTeacherNoteInput] = useState('');
  const [isVerifiedInput, setIsVerifiedInput] = useState(false);

  // Delete confirmation modal
  const [deletingSubmission, setDeletingSubmission] = useState<{ id: string; name: string } | null>(null);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const data = await getExamResults();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Filtered list
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchClass = selectedClassFilter === 'all' || r.classId === selectedClassFilter;
      const s = searchQuery.toLowerCase().trim();
      const matchSearch =
        !s ||
        r.studentName.toLowerCase().includes(s) ||
        (r.saintName && r.saintName.toLowerCase().includes(s)) ||
        (r.parentName && r.parentName.toLowerCase().includes(s)) ||
        (r.subGroup && r.subGroup.toLowerCase().includes(s)) ||
        r.className.toLowerCase().includes(s);

      let matchScore = true;
      if (scoreFilter === 'excellent') matchScore = r.score >= 9.0;
      else if (scoreFilter === 'good') matchScore = r.score >= 8.0 && r.score < 9.0;
      else if (scoreFilter === 'pass') matchScore = r.score >= 5.0;
      else if (scoreFilter === 'fail') matchScore = r.score < 5.0;

      return matchClass && matchSearch && matchScore;
    });
  }, [results, selectedClassFilter, searchQuery, scoreFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (filteredResults.length === 0) {
      return { total: 0, avgScore: 0, passRate: 0, excellentCount: 0 };
    }
    const total = filteredResults.length;
    const sumScore = filteredResults.reduce((acc, curr) => acc + curr.score, 0);
    const passCount = filteredResults.filter(r => r.score >= 5.0).length;
    const excellentCount = filteredResults.filter(r => r.score >= 9.0).length;

    return {
      total,
      avgScore: Math.round((sumScore / total) * 10) / 10,
      passRate: Math.round((passCount / total) * 100),
      excellentCount,
    };
  }, [filteredResults]);

  const handleOpenNoteModal = (sub: StudentExamSubmission) => {
    setEditingSubmission(sub);
    setTeacherNoteInput(sub.teacherNote || '');
    setIsVerifiedInput(Boolean(sub.verified));
  };

  const handleSaveNote = async () => {
    if (!editingSubmission) return;
    await updateTeacherNote(editingSubmission.id, teacherNoteInput, isVerifiedInput);
    setEditingSubmission(null);
    fetchResults();
  };

  const handlePromptDelete = (id: string, name: string) => {
    setDeletingSubmission({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubmission) return;
    await deleteExamResult(deletingSubmission.id);
    setDeletingSubmission(null);
    fetchResults();
  };

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += 'STT,Tên Thánh,Họ và Tên Học Sinh,Lớp Giáo Lý,Họ và Tên Bố Mẹ,Hình Thức,Giáo Họ / Tổ,Điểm Số,Số Câu Đúng,Tổng Số Câu,Thời Gian (giây),Ngày Giờ Nộp,Ban Giáo Lý Đã Duyệt,Nhận Xét\n';

    filteredResults.forEach((r, idx) => {
      const cleanNote = (r.teacherNote || '').replace(/"/g, '""');
      const row = [
        idx + 1,
        `"${r.saintName || ''}"`,
        `"${r.studentName}"`,
        `"${r.className}"`,
        `"${r.parentName || ''}"`,
        `"${r.submissionType === 'qa' ? 'Hỏi & Trả Lời' : 'Thi Thử'}"`,
        `"${r.subGroup || ''}"`,
        r.score,
        r.correctCount,
        r.totalQuestions,
        r.timeSpentSeconds,
        `"${new Date(r.submittedAt).toLocaleString('vi-VN')}"`,
        r.verified ? 'Đã kiểm tra' : 'Chưa kiểm tra',
        `"${cleanNote}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_Diem_Giao_Ly_BGL_Ho_Tan_Van_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRank = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất Sắc', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    if (score >= 8.0) return { label: 'Giỏi', cls: 'bg-blue-100 text-blue-900 border-blue-300' };
    if (score >= 6.5) return { label: 'Khá', cls: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (score >= 5.0) return { label: 'Đạt', cls: 'bg-stone-100 text-stone-800 border-stone-300' };
    return { label: 'Cần cố gắng', cls: 'bg-rose-100 text-rose-900 border-rose-300' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-bold text-stone-900 font-display uppercase tracking-wide">
                BẢNG KẾT QUẢ CÔNG KHAI · BAN GIÁO LÝ HỌ TÂN VẠN
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Tra cứu, kiểm tra điểm số và nhận xét bài thi của từng em học sinh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchResults}
              disabled={isLoading}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium rounded-lg border border-stone-200 flex items-center gap-1.5 transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredResults.length === 0}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium rounded-lg border border-stone-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Xuất file Excel CSV chuẩn tiếng Việt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              title="In bảng điểm niêm yết"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Bảng Điểm</span>
            </button>
          </div>
        </div>

        {/* Statistical Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-stone-100 text-center">
          <div className="p-2.5 bg-stone-50 rounded-lg">
            <span className="text-stone-500 text-xs block">Tổng Lượt Thi</span>
            <strong className="text-stone-900 text-lg sm:text-xl font-bold font-mono">{stats.total}</strong>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-lg">
            <span className="text-stone-500 text-xs block">Điểm Trung Bình</span>
            <strong className="text-amber-700 text-lg sm:text-xl font-bold font-mono">{stats.avgScore} / 10</strong>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-lg">
            <span className="text-stone-500 text-xs block">Tỉ Lệ Đạt (≥ 5.0)</span>
            <strong className="text-emerald-700 text-lg sm:text-xl font-bold font-mono">{stats.passRate}%</strong>
          </div>
          <div className="p-2.5 bg-stone-50 rounded-lg">
            <span className="text-stone-500 text-xs block">Số Em Xuất Sắc</span>
            <strong className="text-blue-700 text-lg sm:text-xl font-bold font-mono">{stats.excellentCount}</strong>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh, tên thánh, giáo họ..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tất cả các lớp giáo lý</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tất cả mức điểm</option>
              <option value="excellent">Xuất sắc (≥ 9.0)</option>
              <option value="good">Giỏi (8.0 - 8.9)</option>
              <option value="pass">Đạt yêu cầu (≥ 5.0)</option>
              <option value="fail">Cần cố gắng (&lt; 5.0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Print Table Title Header */}
      <div className="hidden print:block text-center pb-3 border-b-2 border-stone-800 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider">
          BAN GIÁO LÝ HỌ TÂN VẠN - KẾT QUẢ KHẢO HẠCH
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Ngày xuất: {new Date().toLocaleDateString('vi-VN')} · Tổng số: {filteredResults.length} học sinh
        </p>
      </div>

      {/* Public Results Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="p-10 text-center text-stone-500">
            <p className="font-semibold text-stone-700">Chưa có kết quả thi nào</p>
            <p className="text-xs mt-1">
              Học sinh sau khi hoàn thành bài thi thử sẽ xuất hiện ngay tại đây để Ban Giáo Lý kiểm tra.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Học Sinh & Phụ Huynh</th>
                  <th className="py-3 px-4">Lớp Giáo Lý</th>
                  <th className="py-3 px-4 text-center">Hình Thức</th>
                  <th className="py-3 px-4 text-center">Điểm Số</th>
                  <th className="py-3 px-4 text-center">Đúng / Tổng</th>
                  <th className="py-3 px-4 hidden md:table-cell">Ngày Nộp</th>
                  <th className="py-3 px-4 text-center">Ban Giáo Lý</th>
                  <th className="py-3 px-4 text-right print:hidden">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredResults.map((r, idx) => {
                  const isQA = r.submissionType === 'qa';
                  const rank = getRank(isQA && r.totalQuestions > 0 ? (r.correctCount / r.totalQuestions) * 10 : r.score);

                  return (
                    <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-stone-500">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 leading-snug">
                          {r.saintName && <span className="text-amber-800 mr-1.5 font-medium">{r.saintName}</span>}
                          <span>{r.studentName}</span>
                        </div>
                        {r.parentName && (
                          <div className="text-[11px] text-stone-600 font-medium mt-0.5">
                            Bố mẹ: <span className="text-stone-800">{r.parentName}</span>
                          </div>
                        )}
                        {r.subGroup && (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            {r.subGroup}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800">
                          {r.className}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isQA ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Hỏi & Trả Lời
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Thi Thử
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="font-mono font-black text-base text-amber-700">
                          {isQA ? `${r.score}đ` : r.score.toFixed(1)}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${rank.cls}`}>
                          {isQA ? `${rank.label} (1đ/câu)` : rank.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-xs">
                        <span className="font-bold text-emerald-700">{r.correctCount}</span>
                        <span className="text-stone-400"> / {r.totalQuestions}</span>
                      </td>

                      <td className="py-3 px-4 text-stone-500 text-xs hidden md:table-cell">
                        {new Date(r.submittedAt).toLocaleDateString('vi-VN')} {new Date(r.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {r.verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã kiểm tra</span>
                          </span>
                        ) : (
                          <span className="inline-block text-stone-400 text-xs bg-stone-100 px-2 py-0.5 rounded">
                            Chờ xem
                          </span>
                        )}
                        {r.teacherNote && (
                          <p className="text-[11px] text-stone-600 italic mt-1 line-clamp-1 max-w-[140px] mx-auto">
                            "{r.teacherNote}"
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectSubmission(r)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                            title="Xem chi tiết bài làm của em"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenNoteModal(r)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                            title="Ghi nhận xét của Ban Giáo Lý"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePromptDelete(r.id, `${r.saintName} ${r.studentName}`)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                            title="Xóa kết quả"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: INSPECT TEST DETAIL */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                    Chi Tiết Bài Làm: {inspectSubmission.saintName ? `${inspectSubmission.saintName} ` : ''}{inspectSubmission.studentName}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    inspectSubmission.submissionType === 'qa'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {inspectSubmission.submissionType === 'qa' ? 'Hỏi & Trả Lời' : 'Thi Thử Trắc Nghiệm'}
                  </span>
                </div>
                <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                  <p>
                    Lớp: <strong className="text-stone-800">{inspectSubmission.className}</strong>
                    {inspectSubmission.parentName && (
                      <span className="ml-3">
                        Họ tên bố mẹ: <strong className="text-stone-900">{inspectSubmission.parentName}</strong>
                      </span>
                    )}
                  </p>
                  <p className="text-stone-500">
                    Điểm số: <strong className="text-amber-700 font-mono text-sm">{
                      inspectSubmission.submissionType === 'qa'
                        ? `${inspectSubmission.score} điểm (Mỗi câu đúng 1 điểm)`
                        : `${inspectSubmission.score.toFixed(1)} / 10 điểm`
                    }</strong> · Đạt: <strong>{inspectSubmission.correctCount}/{inspectSubmission.totalQuestions}</strong> câu đúng · Nộp lúc: {new Date(inspectSubmission.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectSubmission(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Questions List */}
            <div className="p-5 overflow-y-auto space-y-4">
              {inspectSubmission.answersSummary && inspectSubmission.answersSummary.length > 0 ? (
                inspectSubmission.answersSummary.map((ans, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                      ans.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-stone-900">
                        Câu {i + 1}: {ans.questionText}
                      </span>
                      <span className={`font-bold shrink-0 text-xs px-2 py-0.5 rounded ${ans.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        {ans.isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    </div>

                    <div className="space-y-1 pl-3 mt-2 text-xs">
                      {ans.options.map((opt, oIdx) => {
                        const optLetter = ['A', 'B', 'C', 'D'][oIdx];
                        const isChosen = ans.selectedOptionIndex === oIdx;
                        const isCorrectOpt = ans.correctOptionIndex === oIdx;

                        return (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded flex items-center justify-between ${
                              isCorrectOpt
                                ? 'bg-emerald-100 text-emerald-950 font-bold'
                                : isChosen && !isCorrectOpt
                                ? 'bg-rose-100 text-rose-950 line-through'
                                : 'text-stone-600'
                            }`}
                          >
                            <span>{optLetter}. {opt}</span>
                            {isCorrectOpt && <span className="text-[10px] uppercase font-bold text-emerald-800">Đáp án chuẩn</span>}
                            {isChosen && !isCorrectOpt && <span className="text-[10px] uppercase font-bold text-rose-800">Em đã chọn</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-stone-500 py-4">Không có bản lưu chi tiết câu hỏi.</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setInspectSubmission(null)}
                className="px-4 py-2 bg-stone-900 text-white text-xs sm:text-sm font-semibold rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TEACHER NOTE & VERIFY */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">
                Nhận Xét Của Ban Giáo Lý
              </h3>
              <button
                onClick={() => setEditingSubmission(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Học sinh: <strong>{editingSubmission.saintName} {editingSubmission.studentName}</strong> (Lớp {editingSubmission.className}) · Điểm: <strong>{editingSubmission.score.toFixed(1)}/10</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lời Nhận Xét / Hướng Dẫn:
              </label>
              <textarea
                rows={3}
                value={teacherNoteInput}
                onChange={(e) => setTeacherNoteInput(e.target.value)}
                placeholder="VD: Đạt yêu cầu lãnh nhận Bí Tích; Cần ôn lại Kinh Tin Kính..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={isVerifiedInput}
                onChange={(e) => setIsVerifiedInput(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <span>Đánh dấu "Đã kiểm tra / Đạt yêu cầu"</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setEditingSubmission(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg shadow-xs"
              >
                Lưu Nhận Xét
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE MODAL */}
      {deletingSubmission && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Xác Nhận Xóa Kết Quả</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600">
              Ban Giáo Lý có chắc chắn muốn xóa bài thi của em <strong className="text-stone-900">{deletingSubmission.name}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setDeletingSubmission(null)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Xóa Kết Quả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
