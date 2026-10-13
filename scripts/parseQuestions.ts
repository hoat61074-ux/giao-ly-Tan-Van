import fs from 'fs';
import path from 'path';

// Parse a block of questions text
// Rule from user: Original correct answer is ALWAYS D!
// We shuffle the options so the correct answer is balanced across A, B, C, D.

interface ParsedQ {
  id: string;
  classId: string;
  lesson?: string;
  category: string;
  questionNumber: number;
  question: string;
  answer: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
}

export function parseRawClassQuestions(rawText: string, classId: string, className: string): ParsedQ[] {
  const lines = rawText.split('\n');
  const questions: ParsedQ[] = [];
  
  let currentQNum: number | null = null;
  let currentQText = '';
  let currentLesson = '';
  let optionsMap: { A?: string; B?: string; C?: string; D?: string } = {};

  function finalizeQuestion() {
    if (currentQNum !== null && currentQText && optionsMap.A && optionsMap.B && optionsMap.C && optionsMap.D) {
      const origA = optionsMap.A.trim();
      const origB = optionsMap.B.trim();
      const origC = optionsMap.C.trim();
      const origD = optionsMap.D.trim(); // This was the original correct answer!

      // Deterministic pseudo-random shuffle based on question number
      // We want uniform distribution across [0, 1, 2, 3] (A, B, C, D)
      // For instance: (currentQNum * 7 + 1) % 4 for target index of the correct answer
      const targetCorrectIdx = (currentQNum * 3 + 2) % 4;

      const wrongOptions = [origA, origB, origC];
      // Shuffle the wrong options as well deterministically
      if (currentQNum % 2 === 1) {
        wrongOptions.reverse();
      }

      const newOptions: string[] = [];
      let wrongIdx = 0;
      for (let i = 0; i < 4; i++) {
        if (i === targetCorrectIdx) {
          newOptions.push(origD);
        } else {
          newOptions.push(wrongOptions[wrongIdx++]);
        }
      }

      // Extract lesson if present e.g. (Bài 1, câu 1, trang 8)
      let lessonMatch = currentQText.match(/\((Bài\s+\d+[^)]*)\)/i);
      let lessonStr = lessonMatch ? lessonMatch[1] : '';
      let cleanQText = currentQText.replace(/\((Bài\s+\d+[^)]*)\)/gi, '').trim();

      questions.push({
        id: `${classId}-c${currentQNum}`,
        classId,
        questionNumber: currentQNum,
        category: className,
        lesson: lessonStr || undefined,
        question: cleanQText,
        answer: origD, // The correct answer text
        options: newOptions as [string, string, string, string],
        correctOptionIndex: targetCorrectIdx,
      });
    }
    optionsMap = {};
  }

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect question header e.g. "Câu 1: ...", "Câu 193: ..."
    const qMatch = trimmed.match(/^Câu\s+(\d+)\s*:\s*(.*)/i);
    if (qMatch) {
      finalizeQuestion();
      currentQNum = parseInt(qMatch[1], 10);
      currentQText = qMatch[2].trim();
      continue;
    }

    // Detect options in line: might have multiple options on one line e.g. "A. ... B. ..."
    // Let's use regex to extract A., B., C., D.
    const hasOptionMarkers = /(?:^|\s+)([A-D])\.\s+/g;
    const matches = [...trimmed.matchAll(/(?:^|\s+)([A-D])\.\s+([^A-D\t]+(?:\s+(?![A-D]\.)[^A-D\t]+)*)/g)];
    
    if (matches.length > 0) {
      // Find all option splits in this line
      const optRegex = /([A-D])\.\s*/g;
      const optIndices: { key: 'A' | 'B' | 'C' | 'D'; start: number; textStart: number }[] = [];
      let m;
      while ((m = optRegex.exec(trimmed)) !== null) {
        optIndices.push({
          key: m[1] as 'A' | 'B' | 'C' | 'D',
          start: m.index,
          textStart: m.index + m[0].length
        });
      }

      if (optIndices.length > 0) {
        for (let i = 0; i < optIndices.length; i++) {
          const key = optIndices[i].key;
          const start = optIndices[i].textStart;
          const end = i + 1 < optIndices.length ? optIndices[i + 1].start : trimmed.length;
          const optText = trimmed.substring(start, end).trim();
          optionsMap[key] = (optionsMap[key] ? optionsMap[key] + ' ' : '') + optText;
        }
        continue;
      }
    }

    // If continuation of question text
    if (currentQNum !== null && Object.keys(optionsMap).length === 0) {
      currentQText += ' ' + trimmed;
    } else if (currentQNum !== null && Object.keys(optionsMap).length > 0) {
      // continuation of the last option
      const lastKey = (['D', 'C', 'B', 'A'] as const).find(k => optionsMap[k] !== undefined);
      if (lastKey) {
        optionsMap[lastKey] += ' ' + trimmed;
      }
    }
  }

  finalizeQuestion();
  return questions;
}
