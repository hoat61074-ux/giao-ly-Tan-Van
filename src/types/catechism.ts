export interface CatechismClass {
  id: string;
  name: string;
  shortCode: string;
  targetAge: string;
  description: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
}

export interface CatechismQuestion {
  id: string;
  classId: string;
  questionNumber?: number;
  lesson?: string;
  category: string;
  question: string;
  answer: string;
  bibleVerse?: string;
  options: [string, string, string, string];
  correctOptionIndex: number; // 0 | 1 | 2 | 3
  explanation?: string;
  isCustom?: boolean;
}

export interface StudentAnswerRecord {
  questionId: string;
  questionText: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  options: string[];
  isCorrect: boolean;
}

export interface StudentExamSubmission {
  id: string;
  studentName: string;
  saintName?: string;
  className: string;
  classId: string;
  parentName?: string; // Họ và tên bố mẹ
  submissionType?: 'qa' | 'exam' | 'practice'; // 'qa' = Hỏi & Trả Lời, 'exam' = Thi Thử Trắc Nghiệm
  subGroup?: string; // Giáo họ, xứ đoàn, tổ
  score: number; // Điểm số (mỗi câu 1 điểm đối với Hỏi & Trả Lời, thang điểm 10 đối với Thi Thử)
  maxScore?: number; // Tổng số điểm tối đa
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  submittedAt: string;
  verified?: boolean;
  teacherNote?: string;
  answersSummary: StudentAnswerRecord[];
}

export type AppTab = 'classes' | 'qa' | 'practice' | 'exam' | 'results' | 'materials';
