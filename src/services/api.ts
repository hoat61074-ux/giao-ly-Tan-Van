import { CatechismClass, CatechismQuestion, StudentExamSubmission } from '../types/catechism';
import { OFFICIAL_CLASSES, OFFICIAL_QUESTIONS } from '../data/allOfficialQuestions';

const STORAGE_RESULTS_KEY = 'bgl_exam_results_v1';
const STORAGE_CUSTOM_QUESTIONS_KEY = 'bgl_custom_questions_v1';
const STORAGE_CUSTOM_CLASSES_KEY = 'bgl_custom_classes_v1';

// Seed initial demo/real results for Ban Giáo Lý Họ Tân Vạn to immediately test if empty
const INITIAL_DEMO_RESULTS: StudentExamSubmission[] = [
  {
    id: 'res_demo_1',
    studentName: 'Nguyễn Văn Minh',
    saintName: 'Giuse',
    parentName: 'Nguyễn Văn Hùng & Lê Thị Lan',
    className: 'Sơ Cấp 1',
    classId: 'so-cap-1',
    subGroup: 'Tổ 1 - Giáo họ Tân Vạn',
    submissionType: 'qa',
    score: 19,
    maxScore: 20,
    correctCount: 19,
    totalQuestions: 20,
    timeSpentSeconds: 420,
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    verified: true,
    teacherNote: 'Học bài rất kỹ, đã nắm chắc bài học về Tạo Dựng và Kinh Lạy Cha.',
    answersSummary: [],
  },
  {
    id: 'res_demo_2',
    studentName: 'Trần Thị Mai Khanh',
    saintName: 'Maria Têrêsa',
    parentName: 'Trần Văn Đức & Nguyễn Thị Mai',
    className: 'Sơ Cấp 1',
    classId: 'so-cap-1',
    subGroup: 'Tổ 2 - Giáo họ Tân Vạn',
    submissionType: 'exam',
    score: 8.5,
    maxScore: 10,
    correctCount: 17,
    totalQuestions: 20,
    timeSpentSeconds: 510,
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    verified: true,
    teacherNote: 'Ngoan ngoãn, cần chú ý thêm câu hỏi về các Tông Đồ.',
    answersSummary: [],
  },
  {
    id: 'res_demo_3',
    studentName: 'Lê Hoàng Phúc',
    saintName: 'Phanxicô Xaviê',
    parentName: 'Lê Văn An & Maria Phạm Thị Oanh',
    className: 'Sơ Cấp 2',
    classId: 'so-cap-2',
    subGroup: 'Tổ 3 - Giáo họ Tân Vạn',
    submissionType: 'exam',
    score: 10.0,
    maxScore: 10,
    correctCount: 20,
    totalQuestions: 20,
    timeSpentSeconds: 380,
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    verified: true,
    teacherNote: 'Xuất sắc! Đã thuộc lòng 5 bước xưng tội và ý nghĩa Bí tích Thánh Thể.',
    answersSummary: [],
  },
  {
    id: 'res_demo_4',
    studentName: 'Đặng Ngọc Quỳnh Như',
    saintName: 'Anrê Dũng Lạc',
    parentName: 'Đặng Văn Cường & Vũ Thị Thúy',
    className: 'Căn Bản 1',
    classId: 'can-ban-1',
    subGroup: 'Tổ 1 - Giáo họ Tân Vạn',
    submissionType: 'qa',
    score: 18,
    maxScore: 20,
    correctCount: 18,
    totalQuestions: 20,
    timeSpentSeconds: 490,
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    verified: false,
    teacherNote: 'Nắm vững Mười Điều Răn và các tác giả Tin Mừng.',
    answersSummary: [],
  },
];

// Helper for local storage
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('LocalStorage read error:', e);
  }
  return defaultVal;
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// ----------------- RESULTS API -----------------
export async function fetchAllResults(classId = 'all', search = ''): Promise<StudentExamSubmission[]> {
  try {
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.append('classId', classId);
    if (search) params.append('search', search);

    const res = await fetch(`/api/results?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (data.data.length === 0) {
          // If server file is fresh empty, initialize with demo results
          for (const item of INITIAL_DEMO_RESULTS) {
            await submitExamResult(item);
          }
          return INITIAL_DEMO_RESULTS;
        }
        return data.data;
      }
    }
  } catch (e) {
    console.warn('Backend API unavailable, using localStorage fallback', e);
  }

  // Fallback to localStorage
  let localResults = getLocal<StudentExamSubmission[]>(STORAGE_RESULTS_KEY, INITIAL_DEMO_RESULTS);
  if (classId && classId !== 'all') {
    localResults = localResults.filter(r => r.classId === classId);
  }
  if (search) {
    const s = search.toLowerCase().trim();
    localResults = localResults.filter(r =>
      (r.studentName && r.studentName.toLowerCase().includes(s)) ||
      (r.saintName && r.saintName.toLowerCase().includes(s)) ||
      (r.className && r.className.toLowerCase().includes(s))
    );
  }
  return localResults.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function submitExamResult(submission: StudentExamSubmission): Promise<StudentExamSubmission> {
  // Update local storage backup
  const localList = getLocal<StudentExamSubmission[]>(STORAGE_RESULTS_KEY, INITIAL_DEMO_RESULTS);
  const updatedList = [submission, ...localList.filter(r => r.id !== submission.id)];
  setLocal(STORAGE_RESULTS_KEY, updatedList);

  try {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (e) {
    console.warn('Backend submission failed, persisted locally', e);
  }

  return submission;
}

export async function updateTeacherNote(id: string, teacherNote: string, verified = true): Promise<boolean> {
  // Update local storage
  const localList = getLocal<StudentExamSubmission[]>(STORAGE_RESULTS_KEY, INITIAL_DEMO_RESULTS);
  const idx = localList.findIndex(r => r.id === id);
  if (idx !== -1) {
    localList[idx].teacherNote = teacherNote;
    localList[idx].verified = verified;
    setLocal(STORAGE_RESULTS_KEY, localList);
  }

  try {
    const res = await fetch(`/api/results/${id}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherNote, verified }),
    });
    return res.ok;
  } catch (e) {
    console.warn('API error updating note', e);
    return true;
  }
}

export async function deleteExamResult(id: string): Promise<boolean> {
  const localList = getLocal<StudentExamSubmission[]>(STORAGE_RESULTS_KEY, INITIAL_DEMO_RESULTS);
  setLocal(STORAGE_RESULTS_KEY, localList.filter(r => r.id !== id));

  try {
    const res = await fetch(`/api/results/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    return true;
  }
}

// ----------------- QUESTIONS & CLASSES API -----------------
export function getAllClasses(): CatechismClass[] {
  const customClasses = getLocal<CatechismClass[]>(STORAGE_CUSTOM_CLASSES_KEY, []);
  return [...OFFICIAL_CLASSES, ...customClasses];
}

export function saveCustomClass(cls: CatechismClass): void {
  const customClasses = getLocal<CatechismClass[]>(STORAGE_CUSTOM_CLASSES_KEY, []);
  const exists = customClasses.findIndex(c => c.id === cls.id);
  if (exists >= 0) {
    customClasses[exists] = cls;
  } else {
    customClasses.push(cls);
  }
  setLocal(STORAGE_CUSTOM_CLASSES_KEY, customClasses);
}

export async function getAllQuestions(classId?: string): Promise<CatechismQuestion[]> {
  const localCustom = getLocal<CatechismQuestion[]>(STORAGE_CUSTOM_QUESTIONS_KEY, []);
  let all = [...OFFICIAL_QUESTIONS, ...localCustom];

  if (classId && classId !== 'all') {
    all = all.filter(q => q.classId === classId);
  }
  return all;
}

export async function addCustomQuestions(questions: CatechismQuestion[]): Promise<number> {
  const localCustom = getLocal<CatechismQuestion[]>(STORAGE_CUSTOM_QUESTIONS_KEY, []);
  const updated = [...localCustom, ...questions];
  setLocal(STORAGE_CUSTOM_QUESTIONS_KEY, updated);

  try {
    await fetch('/api/questions/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    });
  } catch (e) {
    console.warn('Failed to save to server, saved locally', e);
  }

  return questions.length;
}

// ----------------- SMART DOCUMENT PARSER -----------------
export function parseUploadedTextToQuestions(
  rawText: string,
  classId: string,
  defaultAnswerIsD = true
): { questions: CatechismQuestion[]; errors: string[] } {
  const lines = rawText.split('\n');
  const questions: CatechismQuestion[] = [];
  const errors: string[] = [];

  let currentNum = 0;
  let currentLesson = '';
  let currentQuestionText = '';
  let optionA = '';
  let optionB = '';
  let optionC = '';
  let optionD = '';
  let answerKey = defaultAnswerIsD ? 'D' : '';
  let building = false;

  function commit() {
    if (currentQuestionText && optionA && optionB && optionC && optionD) {
      const rawOptions: [string, string, string, string] = [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()];
      
      let correctIndex = 3; // Default D
      if (answerKey === 'A') correctIndex = 0;
      else if (answerKey === 'B') correctIndex = 1;
      else if (answerKey === 'C') correctIndex = 2;
      else if (answerKey === 'D') correctIndex = 3;

      // Shuffle options so correct answer is NOT always D, unless it's a combined option like "Cả A, B và C"
      const optD = rawOptions[correctIndex];
      const isCombined = /^cả\s*a,?\s*b\s*và\s*c/i.test(optD) || /^tất cả/i.test(optD) || /^cả\s*a\s*và\s*b/i.test(optD);

      let finalOptions: [string, string, string, string] = [...rawOptions];
      let finalCorrectIndex = correctIndex;

      if (!isCombined) {
        // Distribute to random target index 0, 1, 2, or 3
        const targetIndex = Math.floor(Math.random() * 4);
        const correctText = rawOptions[correctIndex];
        const otherOptions = rawOptions.filter((_, idx) => idx !== correctIndex);

        const newOpts: string[] = new Array(4);
        newOpts[targetIndex] = correctText;
        const otherIndices = [0, 1, 2, 3].filter(i => i !== targetIndex);
        for (let i = 0; i < 3; i++) {
          newOpts[otherIndices[i]] = otherOptions[i];
        }
        finalOptions = newOpts as [string, string, string, string];
        finalCorrectIndex = targetIndex;
      }

      questions.push({
        id: `${classId}-custom-${Date.now()}-${questions.length + 1}`,
        classId,
        category: 'Tài Liệu Tải Lên',
        lesson: currentLesson || `Câu hỏi ${questions.length + 1}`,
        question: currentQuestionText.trim(),
        answer: finalOptions[finalCorrectIndex],
        options: finalOptions,
        correctOptionIndex: finalCorrectIndex,
        explanation: currentLesson ? `Trích dẫn: ${currentLesson}` : undefined,
        isCustom: true,
      });
    } else if (building && currentQuestionText) {
      errors.push(`Câu "${currentQuestionText.substring(0, 40)}..." thiếu đáp án A, B, C hoặc D.`);
    }

    currentNum = 0;
    currentLesson = '';
    currentQuestionText = '';
    optionA = '';
    optionB = '';
    optionC = '';
    optionD = '';
    answerKey = defaultAnswerIsD ? 'D' : '';
    building = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const qMatch = line.match(/^Câu\s+(\d+)[\s*.:\-]+(.*)/i);
    if (qMatch) {
      if (building) commit();
      currentNum = parseInt(qMatch[1], 10);
      let text = qMatch[2].trim();

      const lessonMatch = text.match(/\((Bài\s+[^)]+)\)$/i);
      if (lessonMatch) {
        currentLesson = lessonMatch[1].trim();
        text = text.replace(/\((Bài\s+[^)]+)\)$/i, '').trim();
      }
      currentQuestionText = text;
      building = true;
      continue;
    }

    if (!building) continue;

    // Check inline options
    if (line.includes('A.') && line.includes('B.')) {
      const matchA = line.match(/A\.\s*(.*?)(?=\s+B\.|$)/);
      const matchB = line.match(/B\.\s*(.*?)(?=\s+C\.|$)/);
      const matchC = line.match(/C\.\s*(.*?)(?=\s+D\.|$)/);
      const matchD = line.match(/D\.\s*(.*)/);

      if (matchA) optionA = matchA[1].trim();
      if (matchB) optionB = matchB[1].trim();
      if (matchC) optionC = matchC[1].trim();
      if (matchD) optionD = matchD[1].trim();
      continue;
    }

    if (line.includes('C.') && line.includes('D.')) {
      const matchC = line.match(/C\.\s*(.*?)(?=\s+D\.|$)/);
      const matchD = line.match(/D\.\s*(.*)/);
      if (matchC) optionC = matchC[1].trim();
      if (matchD) optionD = matchD[1].trim();
      continue;
    }

    // Individual line options
    if (/^A\.\s*(.*)/.test(line)) {
      optionA = line.replace(/^A\.\s*/, '').trim();
    } else if (/^B\.\s*(.*)/.test(line)) {
      optionB = line.replace(/^B\.\s*/, '').trim();
    } else if (/^C\.\s*(.*)/.test(line)) {
      optionC = line.replace(/^C\.\s*/, '').trim();
    } else if (/^D\.\s*(.*)/.test(line)) {
      optionD = line.replace(/^D\.\s*/, '').trim();
    } else if (/^(Đáp án|Đáp án đúng|Key):\s*([ABCD])/i.test(line)) {
      const match = line.match(/^(?:Đáp án|Đáp án đúng|Key):\s*([ABCD])/i);
      if (match) answerKey = match[1].toUpperCase();
    } else {
      if (optionD) optionD += ' ' + line;
      else if (optionC) optionC += ' ' + line;
      else if (optionB) optionB += ' ' + line;
      else if (optionA) optionA += ' ' + line;
      else currentQuestionText += ' ' + line;
    }
  }

  if (building) commit();

  return { questions, errors };
}

// ----------------- CSV EXPORT -----------------
export function exportResultsToCSV(results: StudentExamSubmission[]): void {
  const headers = [
    'Mã bài thi',
    'Tên Thánh',
    'Họ và Tên Học Sinh',
    'Lớp Giáo Lý',
    'Họ và Tên Bố Mẹ',
    'Hình Thức',
    'Giáo họ / Tổ',
    'Điểm số',
    'Số câu đúng',
    'Tổng số câu',
    'Thời gian (giây)',
    'Ngày nộp',
    'Trạng thái duyệt',
    'Nhận xét Ban Giáo Lý',
  ];

  const rows = results.map(r => [
    `"${r.id}"`,
    `"${r.saintName || ''}"`,
    `"${r.studentName}"`,
    `"${r.className}"`,
    `"${r.parentName || ''}"`,
    `"${r.submissionType === 'qa' ? 'Hỏi & Trả Lời' : 'Thi Thử'}"`,
    `"${r.subGroup || ''}"`,
    `"${r.score}"`,
    `"${r.correctCount}"`,
    `"${r.totalQuestions}"`,
    `"${r.timeSpentSeconds}"`,
    `"${new Date(r.submittedAt).toLocaleString('vi-VN')}"`,
    `"${r.verified ? 'Đã kiểm tra' : 'Chưa kiểm tra'}"`,
    `"${(r.teacherNote || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bang_Diem_Giao_Ly_BGL_Ho_Tan_Van_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
