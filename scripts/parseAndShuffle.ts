import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RAW_SO_CAP_1 } from '../src/data/rawQuestions.js';
import { RAW_SO_CAP_2 } from '../src/data/rawSoCap2.js';
import { RAW_CAN_BAN_1 } from '../src/data/rawCanBan1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ParsedQuestion {
  id: string;
  classId: string;
  questionNumber: number;
  lesson: string;
  category: string;
  question: string;
  answer: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation?: string;
}

// Pseudo-random deterministic generator for consistent shuffling
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleOptions(
  options: [string, string, string, string],
  originalCorrectIndex: number, // 3 for 'D'
  seed: number
): { shuffledOptions: [string, string, string, string]; newCorrectIndex: number } {
  // Original correct option
  const correctText = options[originalCorrectIndex];

  // Pick target index: 0, 1, 2, or 3
  // Distribute target index across questions: 0=A, 1=B, 2=C, 3=D
  const targetIndex = Math.floor(seededRandom(seed) * 4);

  // Remaining indices for the other 3 options
  const otherIndices = [0, 1, 2, 3].filter(i => i !== targetIndex);
  const otherOptions = options.filter((_, idx) => idx !== originalCorrectIndex);

  // Shuffle other options into remaining slots
  const result: string[] = new Array(4);
  result[targetIndex] = correctText;

  // Distribute other options
  const perm = (seed % 6); // 6 permutations of 3 items
  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  const chosenPerm = perms[perm];

  for (let i = 0; i < 3; i++) {
    result[otherIndices[i]] = otherOptions[chosenPerm[i]];
  }

  return {
    shuffledOptions: result as [string, string, string, string],
    newCorrectIndex: targetIndex,
  };
}

function parseClassText(rawText: string, classId: string, defaultCategory: string): ParsedQuestion[] {
  const lines = rawText.split('\n');
  const questions: ParsedQuestion[] = [];

  let currentNum = 0;
  let currentLesson = '';
  let currentQuestionText = '';
  let optionA = '';
  let optionB = '';
  let optionC = '';
  let optionD = '';
  let building = false;

  function commitQuestion() {
    if (currentNum > 0 && currentQuestionText && optionA && optionB && optionC && optionD) {
      // Check if option D references A, B, C
      let optD = optionD.trim();
      let optA = optionA.trim();
      let optB = optionB.trim();
      let optC = optionC.trim();

      // Normalize if D was "Cả A, B và C"
      let isCombined = false;
      if (/^cả\s*a,?\s*b\s*và\s*c/i.test(optD) || /^cả\s*3\s*ý/i.test(optD)) {
        isCombined = true;
      }

      const rawOptions: [string, string, string, string] = [optA, optB, optC, optD];

      // If it's a combined option like "Cả A, B và C", keeping it at D or rewriting to "Tất cả các ý trên đều đúng"
      // If we keep composite options at D or shuffle:
      let shuffledOptions: [string, string, string, string];
      let newCorrectIndex: number;

      if (isCombined || /^cả\s*a\s*và\s*b/i.test(optD) || /^cả\s*b\s*và\s*c/i.test(optD) || /^cả\s*a\s*và\s*c/i.test(optD)) {
        // If it refers to other letters, let's keep it at D (index 3) so A, B, C letters are unchanged and logical,
        // OR transform text: e.g. "Cả 3 điều trên đều đúng"
        // To satisfy user's request: "tat ca cac lop nguoi ta mac dinh dap an D, ban xao tron lai vaf lam dap an cho minh luon nhe"
        // For non-combined (the vast majority), shuffle target across 0, 1, 2, 3!
        // For combined, let's check: if we change "Cả A, B và C" to "Tất cả các câu trên đều đúng", it makes sense at D.
        // Wait, what if we also shuffle some combined questions by writing self-contained statements?
        // To be safe and 100% natural, for normal questions (~80%), target index is evenly distributed (A: 25%, B: 25%, C: 25%, D: 25%).
        shuffledOptions = [optA, optB, optC, optD];
        newCorrectIndex = 3;
      } else {
        const seed = currentNum * 37 + (classId === 'so-cap-1' ? 101 : classId === 'so-cap-2' ? 203 : 307);
        const res = shuffleOptions(rawOptions, 3, seed);
        shuffledOptions = res.shuffledOptions;
        newCorrectIndex = res.newCorrectIndex;
      }

      // Category derivation from lesson
      let category = defaultCategory;
      if (/bài\s*1\b|bài\s*2\b|bài\s*3\b/i.test(currentLesson)) category = 'Thiên Chúa & Tạo Dựng';
      else if (/bài\s*4\b|bài\s*5\b|bài\s*6\b/i.test(currentLesson)) category = 'Con Người & Tội Lỗi';
      else if (/bài\s*7\b|bài\s*8\b|bài\s*9\b/i.test(currentLesson)) category = 'Giao Ước & Dân Chúa';
      else if (/bài\s*10\b|bài\s*11\b|bài\s*12\b|bài\s*13\b|bài\s*14\b/i.test(currentLesson)) category = 'Chúa Giê-su Kitô';
      else if (/bài\s*15\b|bài\s*16\b|bài\s*17\b/i.test(currentLesson)) category = 'Kinh Nguyện & Cầu Nguyện';
      else if (/bài\s*18\b|bài\s*19\b|bài\s*20\b/i.test(currentLesson)) category = 'Bữa Tiệc Ly & Phục Sinh';
      else if (/bài\s*21\b|bài\s*22\b|bài\s*23\b/i.test(currentLesson)) category = 'Bí Tích & Đời Sống';
      else if (/bài\s*24\b|bài\s*25\b|bài\s*26\b|bài\s*27\b/i.test(currentLesson)) category = 'Chúa Thánh Thần & Ba Ngôi';
      else if (/điều răn/i.test(currentQuestionText) || /bài\s*28\b|bài\s*29\b|bài\s*30\b/i.test(currentLesson)) category = 'Mười Điều Răn';

      questions.push({
        id: `${classId}-c${currentNum}`,
        classId,
        questionNumber: currentNum,
        lesson: currentLesson || `Câu ${currentNum}`,
        category,
        question: currentQuestionText.trim(),
        answer: shuffledOptions[newCorrectIndex],
        options: shuffledOptions,
        correctOptionIndex: newCorrectIndex,
        explanation: currentLesson ? `Trích: ${currentLesson}` : undefined,
      });
    }

    currentNum = 0;
    currentLesson = '';
    currentQuestionText = '';
    optionA = '';
    optionB = '';
    optionC = '';
    optionD = '';
    building = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const qMatch = line.match(/^Câu\s+(\d+)[\s*.:\-]+(.*)/i);
    if (qMatch) {
      if (building) {
        commitQuestion();
      }
      currentNum = parseInt(qMatch[1], 10);
      let text = qMatch[2].trim();

      // Check for lesson reference in parenthesis at end e.g. (Bài 1, câu 1, trang 8)
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

    // Check for inline options like "A. ... B. ... C. ... D. ..." or "A. ... B. ..."
    if (line.includes('A.') && line.includes('B.')) {
      // Could be inline options on 1 or 2 lines
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

    // Check individual line options
    if (/^A\.\s*(.*)/.test(line)) {
      optionA = line.replace(/^A\.\s*/, '').trim();
    } else if (/^B\.\s*(.*)/.test(line)) {
      optionB = line.replace(/^B\.\s*/, '').trim();
    } else if (/^C\.\s*(.*)/.test(line)) {
      optionC = line.replace(/^C\.\s*/, '').trim();
    } else if (/^D\.\s*(.*)/.test(line)) {
      optionD = line.replace(/^D\.\s*/, '').trim();
    } else {
      // Continuation line
      if (optionD) optionD += ' ' + line;
      else if (optionC) optionC += ' ' + line;
      else if (optionB) optionB += ' ' + line;
      else if (optionA) optionA += ' ' + line;
      else currentQuestionText += ' ' + line;
    }
  }

  if (building) {
    commitQuestion();
  }

  return questions;
}

const soCap1List = parseClassText(RAW_SO_CAP_1, 'so-cap-1', 'Giáo Lý Sơ Cấp 1');
const soCap2List = parseClassText(RAW_SO_CAP_2, 'so-cap-2', 'Giáo Lý Sơ Cấp 2');
const canBan1List = parseClassText(RAW_CAN_BAN_1, 'can-ban-1', 'Giáo Lý Căn Bản 1');

console.log(`Parsed Sơ Cấp 1: ${soCap1List.length} questions`);
console.log(`Parsed Sơ Cấp 2: ${soCap2List.length} questions`);
console.log(`Parsed Căn Bản 1: ${canBan1List.length} questions`);

// Check answer distribution for So Cap 1
const dist1 = { A: 0, B: 0, C: 0, D: 0 };
soCap1List.forEach(q => {
  const letters = ['A', 'B', 'C', 'D'];
  dist1[letters[q.correctOptionIndex] as 'A' | 'B' | 'C' | 'D']++;
});
console.log('So Cap 1 Answer Distribution:', dist1);

// Write output to src/data/allOfficialQuestions.ts
const allQuestions = [...soCap1List, ...soCap2List, ...canBan1List];

const outputTS = `// Dữ liệu ngân hàng câu hỏi chính thức Ban Giáo Lý Hồ Tấn Vân
import { CatechismQuestion, CatechismClass } from '../types/catechism';

export const OFFICIAL_CLASSES: CatechismClass[] = [
  {
    id: 'so-cap-1',
    name: 'Sơ Cấp 1',
    shortCode: 'SC1',
    targetAge: '7 - 8 tuổi (Khai Tâm / Xưng Tội 1)',
    description: 'Thiên Chúa sáng tạo trời đất, Chúa Giêsu, các Tông Đồ, Kinh Lạy Cha và Chúa Thánh Thần (85 câu).',
    themeColor: 'from-amber-600 to-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
  },
  {
    id: 'so-cap-2',
    name: 'Sơ Cấp 2',
    shortCode: 'SC2',
    targetAge: '8 - 9 tuổi (Rước Lễ Lần Đầu)',
    description: 'Hội Thánh, Mẹ Maria, Tội lỗi, Mười Điều Răn, Bí tích Thánh Thể & Bí tích Giao Hòa (107 câu).',
    themeColor: 'from-sky-600 to-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
  },
  {
    id: 'can-ban-1',
    name: 'Căn Bản 1',
    shortCode: 'CB1',
    targetAge: '10 - 12 tuổi (Thêm Sức 1)',
    description: 'Kinh Thánh Cựu Ước - Tân Ước, Mạc khải, Đức tin, Lời Chúa, Cầu nguyện & Mười Điều Răn (129 câu).',
    themeColor: 'from-emerald-600 to-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
  },
];

export const OFFICIAL_QUESTIONS: CatechismQuestion[] = ${JSON.stringify(allQuestions, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/allOfficialQuestions.ts'), outputTS, 'utf-8');
console.log('Successfully written src/data/allOfficialQuestions.ts with', allQuestions.length, 'questions');
