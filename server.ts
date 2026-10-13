import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS and common headers so other devices can access seamlessly
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Health check endpoint for external ping
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Explicitly serve /public directory for static PWA assets & icons with proper headers
const publicDir = path.join(__dirname, 'public');

// Direct download endpoint for Standalone Offline App HTML
app.get('/api/download-app', (_req, res) => {
  const offlineAppPath = path.join(publicDir, 'Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html');
  if (fs.existsSync(offlineAppPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(offlineAppPath);
  }
  res.status(404).send('Tệp ứng dụng offline chưa được khởi tạo');
});

// Direct route to view the standalone offline app directly in browser
app.get('/app-offline', (_req, res) => {
  const offlineAppPath = path.join(publicDir, 'Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html');
  if (fs.existsSync(offlineAppPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(offlineAppPath);
  }
  res.status(404).send('Tệp ứng dụng offline chưa được khởi tạo');
});

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('sw.js')) {
        res.setHeader('Service-Worker-Allowed', '/');
      }
    }
  }));
}

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const resultsFile = path.join(dataDir, 'results.json');
const customQuestionsFile = path.join(dataDir, 'custom_questions.json');

// Helper to read JSON
function readJSON(filePath: string, defaultVal: any) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultVal;
}

// Helper to write JSON
function writeJSON(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// ----------------- API ROUTES -----------------

// 1. Results endpoints (Publicly saved & readable by Ban Giáo Lý)
app.get('/api/results', (req, res) => {
  const results = readJSON(resultsFile, []);
  const classId = req.query.classId as string;
  const search = (req.query.search as string || '').toLowerCase().trim();

  let filtered = results;
  if (classId && classId !== 'all') {
    filtered = filtered.filter((r: any) => r.classId === classId);
  }
  if (search) {
    filtered = filtered.filter((r: any) =>
      (r.studentName && r.studentName.toLowerCase().includes(search)) ||
      (r.saintName && r.saintName.toLowerCase().includes(search)) ||
      (r.parentName && r.parentName.toLowerCase().includes(search)) ||
      (r.className && r.className.toLowerCase().includes(search))
    );
  }

  // Sort descending by submittedAt
  filtered.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/results', (req, res) => {
  try {
    const newResult = req.body;
    if (!newResult || !newResult.studentName) {
      return res.status(400).json({ success: false, error: 'Thiếu họ tên học sinh' });
    }

    const results = readJSON(resultsFile, []);
    const resultToSave = {
      ...newResult,
      id: newResult.id || `result_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: newResult.submittedAt || new Date().toISOString(),
      verified: newResult.verified || false,
      teacherNote: newResult.teacherNote || '',
    };

    results.unshift(resultToSave);
    writeJSON(resultsFile, results);

    res.json({ success: true, data: resultToSave });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update teacher's note / verification
app.patch('/api/results/:id/note', (req, res) => {
  const { id } = req.params;
  const { teacherNote, verified } = req.body;
  const results = readJSON(resultsFile, []);
  const index = results.findIndex((r: any) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy kết quả' });
  }

  if (typeof teacherNote !== 'undefined') {
    results[index].teacherNote = teacherNote;
  }
  if (typeof verified !== 'undefined') {
    results[index].verified = verified;
  }

  writeJSON(resultsFile, results);
  res.json({ success: true, data: results[index] });
});

// Delete a result
app.delete('/api/results/:id', (req, res) => {
  const { id } = req.params;
  const results = readJSON(resultsFile, []);
  const filtered = results.filter((r: any) => r.id !== id);
  writeJSON(resultsFile, filtered);
  res.json({ success: true, message: 'Đã xóa kết quả thành công' });
});

// 2. Custom questions endpoints
app.get('/api/questions/custom', (_req, res) => {
  const questions = readJSON(customQuestionsFile, []);
  res.json({ success: true, data: questions });
});

app.post('/api/questions/custom', (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Dữ liệu câu hỏi không hợp lệ' });
    }

    const current = readJSON(customQuestionsFile, []);
    const updated = [...current, ...questions];
    writeJSON(customQuestionsFile, updated);

    res.json({ success: true, count: questions.length, total: updated.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/questions/custom/:id', (req, res) => {
  const { id } = req.params;
  const current = readJSON(customQuestionsFile, []);
  const filtered = current.filter((q: any) => q.id !== id);
  writeJSON(customQuestionsFile, filtered);
  res.json({ success: true, message: 'Đã xóa câu hỏi thành công' });
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ON TAP GIAO LY running on port ${PORT} on 0.0.0.0`);
  });
}

startServer();
