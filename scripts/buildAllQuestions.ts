import fs from 'fs';
import path from 'path';

interface CatechismQuestion {
  id: string;
  classId: string;
  lesson?: string;
  category: string;
  questionNumber: number;
  question: string;
  answer: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation?: string;
}

interface CatechismClass {
  id: string;
  name: string;
  shortCode: string;
  targetAge: string;
  description: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
}

export const CATECHISM_CLASSES: CatechismClass[] = [
  {
    id: 'so-cap-1',
    name: 'Sơ Cấp 1',
    shortCode: 'SC1',
    targetAge: '6 - 7 tuổi',
    description: 'Thiên Chúa sáng tạo, Đức Giê-su thời niên thiếu, Lời Chúa và Kinh nguyện căn bản.',
    themeColor: 'from-amber-600 to-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
  },
  {
    id: 'so-cap-2',
    name: 'Sơ Cấp 2',
    shortCode: 'SC2',
    targetAge: '7 - 8 tuổi',
    description: 'Hội Thánh, Mẹ Maria, Mười Điều Răn, Bí tích Rửa Tội, Thánh Thể và Giao Hòa.',
    themeColor: 'from-sky-600 to-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
  },
  {
    id: 'can-ban-1',
    name: 'Căn Bản 1',
    shortCode: 'CB1',
    targetAge: '9 - 10 tuổi',
    description: 'Mặc khải, Kinh Thánh, Lịch sử Cứu Độ, Mười Điều Răn và Đời sống nhân đức Kitô giáo.',
    themeColor: 'from-emerald-600 to-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
  },
  {
    id: 'can-ban-2',
    name: 'Căn Bản 2',
    shortCode: 'CB2',
    targetAge: '10 - 11 tuổi',
    description: 'Đức Giê-su Đấng Cứu Thế, Cuộc Thương Khó, Phục Sinh, Tám Mối Phúc và Các Nhân Đức.',
    themeColor: 'from-rose-600 to-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
  },
  {
    id: 'can-ban-3',
    name: 'Căn Bản 3',
    shortCode: 'CB3',
    targetAge: '11 - 12 tuổi',
    description: 'Chúa Thánh Thần, Mầu nhiệm Chúa Ba Ngôi, Bảy Bí Tích và Lịch sử Hội Thánh Việt Nam.',
    themeColor: 'from-indigo-600 to-indigo-700',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
  },
  {
    id: 'kinh-thanh-1',
    name: 'Kinh Thánh 1',
    shortCode: 'KT1',
    targetAge: '13 - 15 tuổi',
    description: 'Mặc khải và Sách Thánh, Lịch sử Cứu Độ Cựu Ước, Các Tổ Phụ, Vua và Ngôn Sứ.',
    themeColor: 'from-violet-600 to-violet-700',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-900',
  },
];

function parseFile(filePath: string, classId: string, className: string): CatechismQuestion[] {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const questions: CatechismQuestion[] = [];

  let currentQNum: number | null = null;
  let currentQText = '';
  let optionsMap: { [k in 'A' | 'B' | 'C' | 'D']?: string } = {};

  function finalize() {
    if (currentQNum !== null && currentQText && optionsMap.A && optionsMap.B && optionsMap.C && optionsMap.D) {
      const origA = optionsMap.A.trim();
      const origB = optionsMap.B.trim();
      const origC = optionsMap.C.trim();
      const origD = optionsMap.D.trim(); // Original correct answer is ALWAYS D

      // Distribute correct answer evenly across indices 0, 1, 2, 3 (A, B, C, D)
      // We use a pseudo-random hash of currentQNum and classId
      const targetCorrectIdx = (currentQNum * 3 + classId.length * 2) % 4;

      const wrongOpts = [origA, origB, origC];
      if ((currentQNum + classId.length) % 2 === 1) {
        wrongOpts.reverse();
      }

      const finalOptions: string[] = [];
      let wIdx = 0;
      for (let i = 0; i < 4; i++) {
        if (i === targetCorrectIdx) {
          finalOptions.push(origD);
        } else {
          finalOptions.push(wrongOpts[wIdx++]);
        }
      }

      // Extract lesson annotation e.g. (Bài 1, câu 1, trang 8)
      const lessonMatch = currentQText.match(/\((Bài\s+[^)]+)\)/i);
      const lessonStr = lessonMatch ? lessonMatch[1].trim() : undefined;
      const cleanQuestion = currentQText.replace(/\((Bài\s+[^)]+)\)/gi, '').trim();

      questions.push({
        id: `${classId}-q${currentQNum}`,
        classId,
        questionNumber: currentQNum,
        category: className,
        lesson: lessonStr,
        question: cleanQuestion,
        answer: origD, // The correct answer text
        options: finalOptions as [string, string, string, string],
        correctOptionIndex: targetCorrectIdx,
        explanation: lessonStr ? `Trích từ: ${lessonStr}` : undefined,
      });
    }
    optionsMap = {};
  }

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for "Câu \d+:"
    const qMatch = line.match(/^Câu\s+(\d+)\s*:\s*(.*)/i);
    if (qMatch) {
      finalize();
      currentQNum = parseInt(qMatch[1], 10);
      currentQText = qMatch[2].trim();
      continue;
    }

    // Check for options A., B., C., D.
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

    // Continuation line
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

  finalize();
  return questions;
}

function run() {
  const root = process.cwd();
  const rawDir = path.join(root, 'raw_data');

  const filesConfig = [
    { file: 'so_cap_1.txt', id: 'so-cap-1', name: 'Sơ Cấp 1' },
    { file: 'so_cap_2.txt', id: 'so-cap-2', name: 'Sơ Cấp 2' },
    { file: 'can_ban_1.txt', id: 'can-ban-1', name: 'Căn Bản 1' },
    { file: 'can_ban_2.txt', id: 'can-ban-2', name: 'Căn Bản 2' },
    { file: 'can_ban_3.txt', id: 'can-ban-3', name: 'Căn Bản 3' },
    { file: 'kinh_thanh_1.txt', id: 'kinh-thanh-1', name: 'Kinh Thánh 1' },
  ];

  let allQuestions: CatechismQuestion[] = [];
  const stats: Record<string, number> = {};

  for (const cfg of filesConfig) {
    const filePath = path.join(rawDir, cfg.file);
    const parsed = parseFile(filePath, cfg.id, cfg.name);
    stats[cfg.name] = parsed.length;
    allQuestions = allQuestions.concat(parsed);
  }

  console.log('Parsing summary:', stats);
  console.log('Total questions parsed:', allQuestions.length);

  // Write to src/data/allCatechismQuestions.ts
  const tsContent = `// Auto-generated Catholic Catechism Question Bank
// Ban Giáo Lý - BGL HỒ TẤN VÂN
// Tổng cộng ${allQuestions.length} câu hỏi giáo lý chính thức từ các lớp

import { CatechismClass, CatechismQuestion } from '../types/catechism';

export const CATECHISM_CLASSES: CatechismClass[] = ${JSON.stringify(CATECHISM_CLASSES, null, 2)};

export const ALL_CATECHISM_QUESTIONS: CatechismQuestion[] = ${JSON.stringify(allQuestions, null, 2)};
`;

  fs.writeFileSync(path.join(root, 'src', 'data', 'allCatechismQuestions.ts'), tsContent, 'utf-8');
  console.log('Wrote src/data/allCatechismQuestions.ts successfully!');

  // Also ensure data/default_questions.json exists for backend
  const dataDir = path.join(root, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(dataDir, 'default_questions.json'), JSON.stringify(allQuestions, null, 2), 'utf-8');
  console.log('Wrote data/default_questions.json successfully!');
}

run();
