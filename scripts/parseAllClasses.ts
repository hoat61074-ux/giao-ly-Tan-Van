import fs from 'fs';
import path from 'path';

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
  const correctText = options[originalCorrectIndex];
  const targetIndex = Math.floor(seededRandom(seed) * 4);

  const otherIndices = [0, 1, 2, 3].filter(i => i !== targetIndex);
  const otherOptions = options.filter((_, idx) => idx !== originalCorrectIndex);

  const result: string[] = new Array(4);
  result[targetIndex] = correctText;

  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  const chosenPerm = perms[seed % 6];

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
      let optA = optionA.trim();
      let optB = optionB.trim();
      let optC = optionC.trim();
      let optD = optionD.trim();

      const rawOptions: [string, string, string, string] = [optA, optB, optC, optD];

      let shuffledOptions: [string, string, string, string];
      let newCorrectIndex: number;

      // Check if D is a reference like "Cả A, B và C" or "Cả A và B"
      const isAllThree = /^cả\s*a,?\s*b\s*và\s*c/i.test(optD) || /^cả\s*3\s*ý/i.test(optD) || /^tất\s*cả\s*các\s*ý/i.test(optD);
      const isAB = /^cả\s*a\s*và\s*b/i.test(optD);
      const isAC = /^cả\s*a\s*và\s*c/i.test(optD);
      const isBC = /^cả\s*b\s*và\s*c/i.test(optD);

      if (isAllThree || isAB || isAC || isBC) {
        // Keep at D so referencing letters remains 100% consistent and natural
        shuffledOptions = [optA, optB, optC, optD];
        newCorrectIndex = 3;
      } else {
        const seed = currentNum * 31 + classId.length * 17;
        const res = shuffleOptions(rawOptions, 3, seed);
        shuffledOptions = res.shuffledOptions;
        newCorrectIndex = res.newCorrectIndex;
      }

      let category = defaultCategory;
      if (/bài\s*1\b|bài\s*2\b|bài\s*3\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 1`;
      else if (/bài\s*4\b|bài\s*5\b|bài\s*6\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 2`;
      else if (/bài\s*7\b|bài\s*8\b|bài\s*9\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 3`;
      else if (/bài\s*10\b|bài\s*11\b|bài\s*12\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 4`;
      else if (/bài\s*13\b|bài\s*14\b|bài\s*15\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 5`;
      else if (/bài\s*16\b|bài\s*17\b|bài\s*18\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 6`;
      else if (/bài\s*19\b|bài\s*20\b|bài\s*21\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 7`;
      else if (/bài\s*22\b|bài\s*23\b|bài\s*24\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 8`;
      else if (/bài\s*25\b|bài\s*26\b|bài\s*27\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 9`;
      else if (/bài\s*28\b|bài\s*29\b|bài\s*30\b|bài\s*31\b/i.test(currentLesson)) category = `${defaultCategory} · Phần 10`;

      questions.push({
        id: `${classId}-q${currentNum}`,
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

      const lessonMatch = text.match(/\((Bài\s+[^)]+)\)$/i) || text.match(/\((Bài\s+[^)]+)\)$/i);
      if (lessonMatch) {
        currentLesson = lessonMatch[1].trim();
        text = text.replace(/\((Ba?[iì]\s+[^)]+)\)$/i, '').trim();
      }
      currentQuestionText = text;
      building = true;
      continue;
    }

    if (!building) continue;

    // Check multiple options on the same line
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
      for (let j = 0; j < foundMarkers.length; j++) {
        const marker = foundMarkers[j];
        const nextStart = j + 1 < foundMarkers.length ? foundMarkers[j + 1].start : line.length;
        const text = line.substring(marker.textStart, nextStart).trim();

        if (marker.key === 'A') optionA = (optionA ? optionA + ' ' : '') + text;
        else if (marker.key === 'B') optionB = (optionB ? optionB + ' ' : '') + text;
        else if (marker.key === 'C') optionC = (optionC ? optionC + ' ' : '') + text;
        else if (marker.key === 'D') optionD = (optionD ? optionD + ' ' : '') + text;
      }
      continue;
    }

    // Continuation line
    if (optionD) optionD += ' ' + line;
    else if (optionC) optionC += ' ' + line;
    else if (optionB) optionB += ' ' + line;
    else if (optionA) optionA += ' ' + line;
    else currentQuestionText += ' ' + line;
  }

  commitQuestion();
  return questions;
}

const CLASSES_CONFIG = [
  {
    file: 'raw_data/so_cap_1.txt',
    id: 'so-cap-1',
    name: 'Sơ Cấp 1',
    shortCode: 'SC1',
    targetAge: '6 - 7 tuổi',
    description: 'Thiên Chúa sáng tạo, Đức Giê-su thời niên thiếu, Lời Chúa và Kinh nguyện căn bản.',
    themeColor: 'from-amber-600 to-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    defaultCategory: 'Sơ Cấp 1',
  },
  {
    file: 'raw_data/so_cap_2.txt',
    id: 'so-cap-2',
    name: 'Sơ Cấp 2',
    shortCode: 'SC2',
    targetAge: '7 - 8 tuổi',
    description: 'Hội Thánh, Mẹ Maria, Mười Điều Răn, Bí tích Rửa Tội, Thánh Thể và Giao Hòa.',
    themeColor: 'from-sky-600 to-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    defaultCategory: 'Sơ Cấp 2',
  },
  {
    file: 'raw_data/can_ban_1.txt',
    id: 'can-ban-1',
    name: 'Căn Bản 1',
    shortCode: 'CB1',
    targetAge: '8 - 9 tuổi',
    description: 'Bí tích Thánh Thể, Hy tế Thập giá, Phụng vụ Thánh lễ và Đời sống đức tin.',
    themeColor: 'from-emerald-600 to-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    defaultCategory: 'Căn Bản 1',
  },
  {
    file: 'raw_data/can_ban_2.txt',
    id: 'can-ban-2',
    name: 'Căn Bản 2',
    shortCode: 'CB2',
    targetAge: '9 - 10 tuổi',
    description: 'Chúa Thánh Thần, 7 ơn Chúa Thánh Thần, Hội Thánh và Lịch sử cứu độ.',
    themeColor: 'from-indigo-600 to-indigo-700',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    defaultCategory: 'Căn Bản 2',
  },
  {
    file: 'raw_data/can_ban_3.txt',
    id: 'can-ban-3',
    name: 'Căn Bản 3',
    shortCode: 'CB3',
    targetAge: '10 - 11 tuổi',
    description: 'Đức tin & Luân lý Kitô giáo, Tuyên xưng Đức tin và Bí tích Thêm Sức.',
    themeColor: 'from-rose-600 to-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    defaultCategory: 'Căn Bản 3',
  },
  {
    file: 'raw_data/kinh_thanh_1.txt',
    id: 'kinh-thanh-1',
    name: 'Kinh Thánh 1',
    shortCode: 'KT1',
    targetAge: '11 - 12 tuổi',
    description: 'Lịch sử cứu độ Cựu Ước, Mạc khải, Ngũ Kinh, Các Tổ phụ và Ngôn sứ.',
    themeColor: 'from-purple-600 to-purple-700',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    defaultCategory: 'Kinh Thánh 1',
  },
  {
    file: 'raw_data/kinh_thanh_2.txt',
    id: 'kinh-thanh-2',
    name: 'Kinh Thánh 2',
    shortCode: 'KT2',
    targetAge: '12 - 13 tuổi',
    description: 'Tân Ước, Bốn sách Tin Mừng, Cuộc đời Đức Giê-su, Mầu nhiệm Vượt Qua và Hội Thánh.',
    themeColor: 'from-teal-600 to-teal-700',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    defaultCategory: 'Kinh Thánh 2',
  },
  {
    file: 'raw_data/kinh_thanh_3.txt',
    id: 'kinh-thanh-3',
    name: 'Kinh Thánh 3',
    shortCode: 'KT3',
    targetAge: '13 - 14 tuổi',
    description: 'Công Vụ Tông Đồ, Các Thư Tân Ước, Khải Huyền, Lịch sử Hội Thánh và Các Thánh Tử Đạo Việt Nam.',
    themeColor: 'from-cyan-600 to-cyan-700',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
    defaultCategory: 'Kinh Thánh 3',
  },
  {
    file: 'raw_data/vao_doi_1.txt',
    id: 'vao-doi-1',
    name: 'Vào Đời 1',
    shortCode: 'VĐ1',
    targetAge: '14 - 15 tuổi',
    description: 'Mặc khải, Đức tin & Khoa học, Chúa Kitô cứu độ, Hội Thánh và Phụng vụ - Bí tích đời sống Kitô hữu.',
    themeColor: 'from-amber-700 to-amber-800',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    defaultCategory: 'Vào Đời 1',
  },
  {
    file: 'raw_data/vao_doi_2.txt',
    id: 'vao-doi-2',
    name: 'Vào Đời 2',
    shortCode: 'VĐ2',
    targetAge: '15 - 16 tuổi',
    description: 'Phẩm giá con người, Tự do & Lương tâm, Mười Điều Răn trong xã hội hiện đại, Hôn nhân và Đời sống luân lý.',
    themeColor: 'from-violet-600 to-violet-700',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-900',
    defaultCategory: 'Vào Đời 2',
  },
  {
    file: 'raw_data/toat_yeu.txt',
    id: 'toat-yeu',
    name: 'Toát Yếu',
    shortCode: 'TY',
    targetAge: '16+ tuổi & GLV',
    description: 'Toát yếu Giáo Lý Phổ Thông: Tuyên xưng Đức Tin, Cử hành Mầu nhiệm Kitô giáo, Đời sống trong Đức Kitô và Kinh nguyện Kitô giáo.',
    themeColor: 'from-orange-600 to-orange-700',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    defaultCategory: 'Toát Yếu',
  },
];

console.log('--- STARTING PARSE FOR ALL CLASSES ---');
const allQuestions: ParsedQuestion[] = [];

for (const c of CLASSES_CONFIG) {
  if (fs.existsSync(c.file)) {
    const raw = fs.readFileSync(c.file, 'utf8');
    const parsed = parseClassText(raw, c.id, c.defaultCategory);
    console.log(`Class ${c.name} (${c.id}): Parsed ${parsed.length} questions`);

    const dist = { A: 0, B: 0, C: 0, D: 0 };
    parsed.forEach(q => {
      const letter = ['A', 'B', 'C', 'D'][q.correctOptionIndex] as keyof typeof dist;
      dist[letter]++;
    });
    console.log(`  Option Distribution: A=${dist.A}, B=${dist.B}, C=${dist.C}, D=${dist.D}`);
    allQuestions.push(...parsed);
  } else {
    console.log(`Warning: File ${c.file} not found!`);
  }
}

console.log(`Total questions parsed across all classes: ${allQuestions.length}`);

// Generate src/data/allOfficialQuestions.ts
const classesForOutput = CLASSES_CONFIG.map(c => ({
  id: c.id,
  name: c.name,
  shortCode: c.shortCode,
  targetAge: c.targetAge,
  description: c.description,
  themeColor: c.themeColor,
  badgeBg: c.badgeBg,
  badgeText: c.badgeText,
}));

const tsContent = `// Dữ liệu ngân hàng câu hỏi chính thức Ban Giáo Lý Họ Tân Vạn
// Tự động phân tích và xáo trộn đáp án ngẫu nhiên
import { CatechismQuestion, CatechismClass } from '../types/catechism';

export const OFFICIAL_CLASSES: CatechismClass[] = ${JSON.stringify(classesForOutput, null, 2)};

export const OFFICIAL_QUESTIONS: CatechismQuestion[] = ${JSON.stringify(allQuestions, null, 2)};
`;

fs.writeFileSync('src/data/allOfficialQuestions.ts', tsContent, 'utf8');
console.log('Saved to src/data/allOfficialQuestions.ts');

// Also update src/data/allCatechismQuestions.ts
const catechismTsContent = `// Auto-generated Catholic Catechism Question Bank
// Ban Giáo Lý - BGL HỌ TÂN VẠN
// Tổng cộng ${allQuestions.length} câu hỏi giáo lý chính thức từ các lớp

import { CatechismClass, CatechismQuestion } from '../types/catechism';

export const CATECHISM_CLASSES: CatechismClass[] = ${JSON.stringify(classesForOutput, null, 2)};

export const ALL_CATECHISM_QUESTIONS: CatechismQuestion[] = ${JSON.stringify(allQuestions, null, 2)};
`;

fs.writeFileSync('src/data/allCatechismQuestions.ts', catechismTsContent, 'utf8');
console.log('Saved to src/data/allCatechismQuestions.ts');
