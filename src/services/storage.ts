import { CatechismQuestion, StudentExamSubmission, CatechismClass } from '../types/catechism';
import { ALL_CATECHISM_QUESTIONS, CATECHISM_CLASSES } from '../data/allCatechismQuestions';

const LOCAL_STORAGE_RESULTS_KEY = 'bgl_hotanvan_exam_results_v1';
const LOCAL_STORAGE_CUSTOM_QUESTIONS_KEY = 'bgl_hotanvan_custom_questions_v1';

// Get all classes
export function getCatechismClasses(): CatechismClass[] {
  return CATECHISM_CLASSES;
}

// Get all questions (pre-seeded 820 questions + custom)
export async function getAllQuestions(): Promise<CatechismQuestion[]> {
  let custom: CatechismQuestion[] = [];
  try {
    const res = await fetch('/api/questions/custom');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        custom = data.data;
      }
    }
  } catch (err) {
    // fallback local
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_QUESTIONS_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch {}
  }

  return [...ALL_CATECHISM_QUESTIONS, ...custom];
}

// Get results list (server API with fallback)
export async function getExamResults(classId?: string, search?: string): Promise<StudentExamSubmission[]> {
  try {
    let url = '/api/results';
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.append('classId', classId);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Also save latest cache
        try {
          localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(json.data));
        } catch {}
        return json.data;
      }
    }
  } catch (err) {
    console.warn('API getExamResults error, using local storage cache:', err);
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
    if (raw) {
      let results: StudentExamSubmission[] = JSON.parse(raw);
      if (classId && classId !== 'all') {
        results = results.filter(r => r.classId === classId);
      }
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(r => 
          r.studentName.toLowerCase().includes(s) || 
          (r.saintName && r.saintName.toLowerCase().includes(s)) ||
          (r.parentName && r.parentName.toLowerCase().includes(s)) ||
          r.className.toLowerCase().includes(s)
        );
      }
      return results;
    }
  } catch {}

  return [];
}

// Submit new exam result
export async function submitExamResult(result: Omit<StudentExamSubmission, 'id' | 'submittedAt'>): Promise<StudentExamSubmission> {
  const newSubmission: StudentExamSubmission = {
    ...result,
    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    submittedAt: new Date().toISOString(),
    verified: false,
    teacherNote: '',
  };

  try {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSubmission),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // update local cache
        cacheLocalResult(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('API submitExamResult error, saving locally:', err);
  }

  // Save locally
  cacheLocalResult(newSubmission);
  return newSubmission;
}

function cacheLocalResult(record: StudentExamSubmission) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
    const list: StudentExamSubmission[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(list));
  } catch {}
}

// Update teacher note or verification
export async function updateTeacherNote(id: string, note: string, verified: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/results/${id}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherNote: note, verified }),
    });
    if (res.ok) return true;
  } catch {}

  // Fallback local update
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
    if (raw) {
      const list: StudentExamSubmission[] = JSON.parse(raw);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].teacherNote = note;
        list[idx].verified = verified;
        localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(list));
        return true;
      }
    }
  } catch {}

  return false;
}

// Delete exam result (Catechist action)
export async function deleteExamResult(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/results/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // update local cache
      const raw = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
      if (raw) {
        const list: StudentExamSubmission[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(list.filter(r => r.id !== id)));
      }
      return true;
    }
  } catch {}

  return false;
}

// Add custom batch questions
export async function addCustomQuestions(questions: CatechismQuestion[]): Promise<boolean> {
  try {
    const res = await fetch('/api/questions/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    });
    if (res.ok) return true;
  } catch {}

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_QUESTIONS_KEY);
    const list: CatechismQuestion[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_QUESTIONS_KEY, JSON.stringify([...list, ...questions]));
    return true;
  } catch {}

  return false;
}
