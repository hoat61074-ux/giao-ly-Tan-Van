import { ALL_CATECHISM_QUESTIONS, CATECHISM_CLASSES } from '../src/data/allCatechismQuestions';
import fs from 'fs';
import path from 'path';

const questionsJson = JSON.stringify(ALL_CATECHISM_QUESTIONS);
const classesJson = JSON.stringify(CATECHISM_CLASSES);

const offlineHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1c1917">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Ôn Tập Giáo Lý">
  <title>ÔN TẬP GIÁO LÝ - BGL HỌ TÂN VẠN (BẢN CHẠY OFFLINE)</title>
  
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='110' fill='%231c1917'/%3E%3Cpath d='M236 90h40v120h100v40h-100v172h-40V250h-100v-40h100z' fill='%23f59e0b' stroke='%23fef3c7' stroke-width='4'/%3E%3Ccircle cx='256' cy='230' r='14' fill='%23ffffff'/%3E%3C/svg%3E">
  <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='110' fill='%231c1917'/%3E%3Cpath d='M236 90h40v120h100v40h-100v172h-40V250h-100v-40h100z' fill='%23f59e0b' stroke='%23fef3c7' stroke-width='4'/%3E%3Ccircle cx='256' cy='230' r='14' fill='%23ffffff'/%3E%3C/svg%3E">

  <style>
    :root {
      --amber-500: #f59e0b;
      --amber-600: #d97706;
      --amber-700: #b45309;
      --stone-900: #1c1917;
      --stone-800: #292524;
      --stone-700: #44403c;
      --stone-200: #e7e5e4;
      --stone-100: #f5f5f4;
      --stone-50: #fafaf9;
      --emerald-600: #059669;
      --rose-600: #e11d48;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--stone-50); color: #1c1917; line-height: 1.5; padding-bottom: 60px; }
    
    header { background: var(--stone-900); color: #fff; border-bottom: 3px solid var(--amber-600); position: sticky; top: 0; z-index: 50; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header-top { height: 3px; background: linear-gradient(90deg, #d97706, #fbbf24, #d97706); }
    .header-content { max-width: 960px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .cross-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #d97706, #b45309); color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; border: 1px solid rgba(251,191,36,0.3); }
    .title-box h1 { font-size: 16px; font-weight: 800; color: #fde68a; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
    .title-box p { font-size: 11px; color: #fbbf24; font-weight: 700; text-transform: uppercase; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .sound-btn { background: #292524; color: #fde68a; border: 1px solid #44403c; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .offline-tag { background: #065f46; color: #a7f3d0; border: 1px solid #059669; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }

    .nav-bar { background: #292524; border-top: 1px solid #44403c; }
    .nav-inner { max-width: 960px; margin: 0 auto; display: flex; gap: 6px; padding: 6px 16px; overflow-x: auto; }
    .nav-btn { background: transparent; border: none; color: #d6d3d1; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
    .nav-btn:hover { background: #44403c; color: #fff; }
    .nav-btn.active { background: #78350f; color: #fde68a; border: 1px solid #d97706; }

    .container { max-width: 960px; margin: 20px auto; padding: 0 16px; }

    .card { background: #fff; border-radius: 12px; border: 1px solid var(--stone-200); padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    
    .class-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; }
    .class-chip { padding: 6px 14px; border-radius: 8px; border: 1px solid #d6d3d1; background: #fafaf9; font-size: 13px; font-weight: 600; color: #44403c; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
    .class-chip:hover { border-color: var(--amber-600); }
    .class-chip.active { background: #78350f; color: #fde68a; border-color: #d97706; font-weight: bold; }

    .search-input { width: 100%; padding: 10px 14px; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .search-input:focus { border-color: var(--amber-600); box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }

    .stats-banner { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #92400e; }

    .q-card { background: #fff; border-radius: 12px; border: 1px solid var(--stone-200); padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .q-head { font-size: 15px; font-weight: 700; color: #1c1917; margin-bottom: 12px; display: flex; justify-content: space-between; gap: 12px; }
    .q-index { color: var(--amber-600); }
    .options-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .opt-btn { padding: 10px 14px; border-radius: 8px; border: 1px solid var(--stone-200); background: #fafaf9; cursor: pointer; font-size: 14px; text-align: left; display: flex; align-items: center; gap: 10px; transition: all 0.15s; }
    .opt-btn:hover { background: #f5f5f4; border-color: #d6d3d1; }
    .opt-btn.selected { border-color: var(--amber-600); background: #fffbeb; font-weight: 600; }
    .opt-btn.correct { border-color: var(--emerald-600); background: #ecfdf5; color: #065f46; font-weight: 700; }
    .opt-btn.wrong { border-color: var(--rose-600); background: #fef2f2; color: #991b1b; text-decoration: line-through; }

    .explanation-box { background: #ecfdf5; border-left: 4px solid var(--emerald-600); padding: 12px 14px; font-size: 13px; color: #065f46; margin-top: 12px; border-radius: 6px; }
    .explanation-box strong { color: #064e3b; }

    .q-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f5f5f4; padding-top: 12px; margin-top: 10px; }
    .btn-submit { background: var(--amber-600); color: #fff; border: none; padding: 7px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s; }
    .btn-submit:hover { background: var(--amber-700); }
    .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-retry { background: #f5f5f4; color: #44403c; border: 1px solid #d6d3d1; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* Flashcard specific */
    .flashcard-box { min-height: 280px; border-radius: 16px; padding: 24px; border: 2px solid var(--stone-200); background: #fff; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; text-align: center; margin-bottom: 16px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .flashcard-box.flipped { background: var(--stone-900); color: #fde68a; border-color: var(--amber-600); }
    .flashcard-prompt { font-size: 12px; color: #78716c; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .flashcard-box.flipped .flashcard-prompt { color: #f59e0b; }
    .flashcard-body { font-size: 20px; font-weight: 700; line-height: 1.6; margin: 30px 0; }
    .flashcard-nav { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .flashcard-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #d6d3d1; background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }

    .help-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; font-size: 13px; color: #1e40af; margin-bottom: 20px; line-height: 1.6; }
    .help-box strong { color: #1e3a8a; }

    footer { text-align: center; color: #78716c; font-size: 12px; margin-top: 40px; padding: 20px; border-top: 1px solid var(--stone-200); }
  </style>
</head>
<body>
  <header>
    <div class="header-top"></div>
    <div class="header-content">
      <div class="brand" onclick="switchNavTab('qa')">
        <div class="cross-icon">✝</div>
        <div class="title-box">
          <h1>ÔN TẬP GIÁO LÝ</h1>
          <p>BGL HỌ TÂN VẠN · BẢN OFFLINE ĐỘC LẬP</p>
        </div>
      </div>
      <div class="header-actions">
        <button id="soundToggle" class="sound-btn" onclick="toggleSound()">🔔 Âm thanh: BẬT</button>
        <span class="offline-tag">✓ 100% Không Cần Mạng</span>
      </div>
    </div>
    <div class="nav-bar">
      <div class="nav-inner">
        <button id="navQa" class="nav-btn active" onclick="switchNavTab('qa')">📖 Hỏi & Trả Lời (${ALL_CATECHISM_QUESTIONS.length} câu)</button>
        <button id="navFlashcard" class="nav-btn" onclick="switchNavTab('flashcard')">⚡ Thẻ Ôn Tập Luyện Nhớ</button>
        <button id="navExam" class="nav-btn" onclick="switchNavTab('exam')">🏆 Thi Thử Trắc Nghiệm</button>
      </div>
    </div>
  </header>

  <div class="container">
    <!-- Notice for phone installation -->
    <div class="help-box">
      <strong>📱 Cài đặt làm ứng dụng trên điện thoại:</strong> 
      Mở file này bằng Google Chrome trên Android hoặc Safari trên iPhone. Bấm nút <strong>3 chấm (⋮)</strong> hoặc nút <strong>Chia sẻ (Share)</strong> trên trình duyệt và chọn <strong>"Thêm vào màn hình chính" (Add to Home screen)</strong>. Biểu tượng Thánh Giá Vàng sẽ xuất hiện ngay trên màn hình như một App thực thụ, mở học tức thì dù không có WiFi/4G!
    </div>

    <!-- Class Selector -->
    <div class="card">
      <div style="font-size: 12px; font-weight: 700; color: #78716c; text-transform: uppercase; margin-bottom: 8px;">
        Chọn Lớp Giáo Lý:
      </div>
      <div class="class-scroll" id="classChips"></div>
      <input type="text" id="searchInput" class="search-input" placeholder="🔍 Tìm kiếm câu hỏi (nhập từ khóa: Bí tích, Chúa Giêsu, Mười điều răn, Đức Mẹ...)" />
    </div>

    <!-- Score Stats Bar -->
    <div class="stats-banner">
      <div>Đang học: <span id="currentClassName" style="color: #78350f;">...</span></div>
      <div>Số câu trong lớp: <span id="classQuestionCount">0</span> câu</div>
      <div>Điểm đạt được: <span id="currentScore">0</span> / <span id="totalAnswered">0</span> câu đúng</div>
    </div>

    <!-- VIEW 1: Q&A Section -->
    <div id="viewQa">
      <div id="questionsContainer"></div>
    </div>

    <!-- VIEW 2: Flashcard Section -->
    <div id="viewFlashcard" style="display: none;">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 13px; font-weight: 700; color: #78716c;">Thẻ <span id="fcCurrentIndex">1</span> / <span id="fcTotalCount">0</span></span>
          <span style="font-size: 12px; color: #d97706; font-weight: 600;">Chạm vào thẻ để lật xem đáp án</span>
        </div>

        <div id="flashcardBox" class="flashcard-box" onclick="flipFlashcard()">
          <div class="flashcard-prompt" id="fcPrompt">CÂU HỎI GIÁO LÝ:</div>
          <div class="flashcard-body" id="fcBody">Đang tải câu hỏi...</div>
          <div style="font-size: 12px; opacity: 0.7;" id="fcHint">Chạm để xem câu trả lời chuẩn</div>
        </div>

        <div class="flashcard-nav">
          <button class="flashcard-btn" onclick="prevFlashcard()">← Câu trước</button>
          <button class="flashcard-btn" style="background: #fef3c7; color: #92400e; font-weight: 700;" onclick="randomFlashcard()">🎲 Ngẫu nhiên</button>
          <button class="flashcard-btn" onclick="nextFlashcard()">Câu tiếp theo →</button>
        </div>
      </div>
    </div>

    <!-- VIEW 3: Timed Exam Section -->
    <div id="viewExam" style="display: none;">
      <div class="card" id="examIntro">
        <h3 style="font-size: 18px; font-weight: 800; color: #78350f; margin-bottom: 8px;">BÀI THI THỬ TRẮC NGHIỆM GIÁO LÝ</h3>
        <p style="font-size: 13px; color: #44403c; line-height: 1.6; margin-bottom: 16px;">
          Hệ thống sẽ lấy ngẫu nhiên 20 câu trắc nghiệm từ lớp giáo lý bạn đang chọn, xáo trộn thứ tự các đáp án và bấm giờ 15 phút. Sau khi nộp bài, bạn sẽ nhận được điểm số (thang điểm 10) và bảng đối chiếu kết quả chi tiết.
        </p>
        <button class="btn-submit" style="padding: 10px 24px; font-size: 14px;" onclick="startExam()">Bắt Đầu Làm Bài Thi Thử</button>
      </div>

      <div id="examActive" style="display: none;">
        <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
          <div><strong>Thời gian còn lại:</strong> <span id="examTimer" style="color: #e11d48; font-size: 16px; font-weight: 800;">15:00</span></div>
          <button class="btn-submit" onclick="submitExam()">Nộp Bài Thi</button>
        </div>
        <div id="examQuestionsContainer"></div>
      </div>

      <div id="examResult" style="display: none;" class="card">
        <h3 style="font-size: 20px; font-weight: 800; color: #065f46; margin-bottom: 6px;">KẾT QUẢ THI THỬ CỦA BẠN</h3>
        <div style="font-size: 32px; font-weight: 900; color: #d97706; margin: 12px 0;" id="examFinalScore">10.0 / 10</div>
        <p id="examSummaryText" style="font-size: 14px; color: #44403c; margin-bottom: 16px;">Đúng 20/20 câu hỏi.</p>
        <button class="btn-submit" onclick="startExam()">Thi Lại Đề Khác</button>
      </div>
    </div>

    <footer>
      ÔN TẬP GIÁO LÝ - BAN GIÁO LÝ HỌ TÂN VẠN<br>
      Tài liệu nội bộ chính thức gồm ${ALL_CATECHISM_QUESTIONS.length} câu hỏi · Bản file HTML độc lập hoàn toàn không cần Internet.
    </footer>
  </div>

  <script>
    const ALL_QUESTIONS = ${questionsJson};
    const ALL_CLASSES = ${classesJson};

    let activeClassId = ALL_CLASSES[0]?.id || 'so-cap-1';
    let currentNavTab = 'qa';
    let userAnswers = {};
    let searchQuery = '';
    let soundEnabled = true;

    // Web Audio Chime Synthesis
    function playChime(isCorrect) {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        if (isCorrect) {
          [ { f: 659.25, t: now, d: 0.5 }, { f: 783.99, t: now + 0.08, d: 0.6 }, { f: 1046.5, t: now + 0.16, d: 0.8 } ].forEach(n => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.f, n.t);
            gain.gain.setValueAtTime(0.0001, n.t);
            gain.gain.exponentialRampToValueAtTime(0.15, n.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, n.t + n.d);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(n.t);
            osc.stop(n.t + n.d);
          });
        }
      } catch (e) {}
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      document.getElementById('soundToggle').innerText = soundEnabled ? '🔔 Âm thanh: BẬT' : '🔕 Âm thanh: TẮT';
      if (soundEnabled) playChime(true);
    }

    function switchNavTab(tab) {
      currentNavTab = tab;
      document.getElementById('navQa').className = 'nav-btn ' + (tab === 'qa' ? 'active' : '');
      document.getElementById('navFlashcard').className = 'nav-btn ' + (tab === 'flashcard' ? 'active' : '');
      document.getElementById('navExam').className = 'nav-btn ' + (tab === 'exam' ? 'active' : '');

      document.getElementById('viewQa').style.display = tab === 'qa' ? 'block' : 'none';
      document.getElementById('viewFlashcard').style.display = tab === 'flashcard' ? 'block' : 'none';
      document.getElementById('viewExam').style.display = tab === 'exam' ? 'block' : 'none';

      if (tab === 'flashcard') {
        initFlashcard();
      }
    }

    function renderClassChips() {
      const container = document.getElementById('classChips');
      container.innerHTML = ALL_CLASSES.map(cls => {
        const count = ALL_QUESTIONS.filter(q => q.classId === cls.id).length;
        return \`<button class="class-chip \${cls.id === activeClassId ? 'active' : ''}" onclick="switchClass('\${cls.id}')">\${cls.name} (\${count})</button>\`;
      }).join('');
    }

    function switchClass(classId) {
      activeClassId = classId;
      renderClassChips();
      renderQuestions();
      if (currentNavTab === 'flashcard') {
        initFlashcard();
      }
    }

    function handleSelectOption(qId, optIdx) {
      if (userAnswers[qId]?.isSubmitted) return;
      userAnswers[qId] = { selectedIndex: optIdx, isSubmitted: false };
      renderQuestions();
    }

    function handleSubmitAnswer(qId) {
      if (userAnswers[qId]?.selectedIndex === undefined) return;
      userAnswers[qId].isSubmitted = true;
      const q = ALL_QUESTIONS.find(item => item.id === qId);
      if (q && userAnswers[qId].selectedIndex === q.correctOptionIndex) {
        playChime(true);
      }
      renderQuestions();
    }

    function handleRetry(qId) {
      delete userAnswers[qId];
      renderQuestions();
    }

    function updateScoreDisplay(classQuestions) {
      let score = 0;
      let answeredCount = 0;
      classQuestions.forEach(q => {
        const ua = userAnswers[q.id];
        if (ua && ua.isSubmitted) {
          answeredCount++;
          if (ua.selectedIndex === q.correctOptionIndex) {
            score++;
          }
        }
      });
      document.getElementById('currentScore').innerText = score;
      document.getElementById('totalAnswered').innerText = answeredCount;
      const currentCls = ALL_CLASSES.find(c => c.id === activeClassId);
      document.getElementById('currentClassName').innerText = currentCls ? currentCls.name : '';
      document.getElementById('classQuestionCount').innerText = classQuestions.length;
    }

    function renderQuestions() {
      let list = ALL_QUESTIONS.filter(q => q.classId === activeClassId);
      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase().trim();
        list = list.filter(item => item.question.toLowerCase().includes(s) || (item.explanation && item.explanation.toLowerCase().includes(s)));
      }

      updateScoreDisplay(list);
      const container = document.getElementById('questionsContainer');

      if (list.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #78716c; background: #fff; border-radius: 12px;">Không tìm thấy câu hỏi phù hợp với từ khóa.</div>';
        return;
      }

      container.innerHTML = list.map((q, idx) => {
        const ua = userAnswers[q.id];
        const hasSubmitted = ua && ua.isSubmitted;
        const selectedIdx = ua?.selectedIndex;
        const isCorrect = hasSubmitted && selectedIdx === q.correctOptionIndex;

        return \`
          <div class="q-card">
            <div class="q-head">
              <div><span class="q-index">Câu \${idx + 1}:</span> \${q.question}</div>
              \${hasSubmitted ? (isCorrect ? '<span style="color:#059669;font-weight:bold;font-size:13px;white-space:nowrap;">✓ Đúng (+1đ)</span>' : '<span style="color:#e11d48;font-weight:bold;font-size:13px;white-space:nowrap;">✗ Chưa đúng (0đ)</span>') : ''}
            </div>
            <div class="options-grid">
              \${q.options.map((opt, optIdx) => {
                let cls = 'opt-btn';
                if (!hasSubmitted && selectedIdx === optIdx) cls += ' selected';
                if (hasSubmitted) {
                  if (optIdx === q.correctOptionIndex) cls += ' correct';
                  else if (selectedIdx === optIdx) cls += ' wrong';
                }
                const letter = String.fromCharCode(65 + optIdx);
                return \`<button type="button" class="\${cls}" onclick="handleSelectOption('\${q.id}', \${optIdx})"><strong>\${letter}.</strong> \${opt}</button>\`;
              }).join('')}
            </div>
            
            \${hasSubmitted ? \`
              <div class="explanation-box">
                <strong>💡 Trả lời chuẩn:</strong> \${q.answer || q.options[q.correctOptionIndex]}
                \${q.explanation ? \`<div style="margin-top:6px; line-height: 1.5;">\${q.explanation}</div>\` : ''}
                \${q.bibleVerse ? \`<div style="font-style:italic;margin-top:6px;color:#047857;">📖 Trích Kinh Thánh: \${q.bibleVerse}</div>\` : ''}
              </div>
            \` : ''}

            <div class="q-actions">
              <div style="font-size: 12px; color: #78716c;">\${q.lesson || ''}</div>
              <div>
                \${!hasSubmitted ? \`
                  <button class="btn-submit" onclick="handleSubmitAnswer('\${q.id}')" \${selectedIdx === undefined ? 'disabled' : ''}>Nộp Câu Này</button>
                \` : \`
                  <button class="btn-retry" onclick="handleRetry('\${q.id}')">Làm Lại Câu Này</button>
                \`}
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Flashcard Logic
    let flashcardIndex = 0;
    let isFlipped = false;
    let flashcardList = [];

    function initFlashcard() {
      flashcardList = ALL_QUESTIONS.filter(q => q.classId === activeClassId);
      flashcardIndex = 0;
      isFlipped = false;
      renderCurrentFlashcard();
    }

    function renderCurrentFlashcard() {
      if (flashcardList.length === 0) return;
      const q = flashcardList[flashcardIndex];
      document.getElementById('fcCurrentIndex').innerText = flashcardIndex + 1;
      document.getElementById('fcTotalCount').innerText = flashcardList.length;

      const box = document.getElementById('flashcardBox');
      const prompt = document.getElementById('fcPrompt');
      const body = document.getElementById('fcBody');
      const hint = document.getElementById('fcHint');

      if (isFlipped) {
        box.className = 'flashcard-box flipped';
        prompt.innerText = 'ĐÁP ÁN CHUẨN GIÁO LÝ:';
        body.innerText = q.answer || q.options[q.correctOptionIndex];
        hint.innerText = q.lesson ? q.lesson + ' · Chạm để xem lại câu hỏi' : 'Chạm để xem lại câu hỏi';
      } else {
        box.className = 'flashcard-box';
        prompt.innerText = 'CÂU HỎI SỐ ' + (flashcardIndex + 1) + ':';
        body.innerText = q.question;
        hint.innerText = 'Chạm vào thẻ để lật xem đáp án';
      }
    }

    function flipFlashcard() {
      isFlipped = !isFlipped;
      renderCurrentFlashcard();
    }

    function prevFlashcard() {
      if (flashcardIndex > 0) {
        flashcardIndex--;
        isFlipped = false;
        renderCurrentFlashcard();
      }
    }

    function nextFlashcard() {
      if (flashcardIndex < flashcardList.length - 1) {
        flashcardIndex++;
        isFlipped = false;
        renderCurrentFlashcard();
      }
    }

    function randomFlashcard() {
      if (flashcardList.length <= 1) return;
      let nextIdx = Math.floor(Math.random() * flashcardList.length);
      if (nextIdx === flashcardIndex) nextIdx = (nextIdx + 1) % flashcardList.length;
      flashcardIndex = nextIdx;
      isFlipped = false;
      renderCurrentFlashcard();
    }

    // Exam Logic
    let examQuestions = [];
    let examAnswers = {};
    let examInterval = null;
    let examSecondsLeft = 15 * 60;

    function startExam() {
      const classQuestions = ALL_QUESTIONS.filter(q => q.classId === activeClassId);
      const shuffled = [...classQuestions].sort(() => 0.5 - Math.random());
      examQuestions = shuffled.slice(0, Math.min(20, shuffled.length));
      examAnswers = {};
      examSecondsLeft = 15 * 60;

      document.getElementById('examIntro').style.display = 'none';
      document.getElementById('examResult').style.display = 'none';
      document.getElementById('examActive').style.display = 'block';

      if (examInterval) clearInterval(examInterval);
      examInterval = setInterval(updateExamTimer, 1000);
      renderExamQuestions();
    }

    function updateExamTimer() {
      examSecondsLeft--;
      if (examSecondsLeft <= 0) {
        clearInterval(examInterval);
        submitExam();
        return;
      }
      const mins = Math.floor(examSecondsLeft / 60);
      const secs = examSecondsLeft % 60;
      document.getElementById('examTimer').innerText = 
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    function renderExamQuestions() {
      const container = document.getElementById('examQuestionsContainer');
      container.innerHTML = examQuestions.map((q, idx) => {
        const selected = examAnswers[q.id];
        return \`
          <div class="q-card" style="margin-top: 14px;">
            <div class="q-head">
              <div><span class="q-index">Câu \${idx + 1}:</span> \${q.question}</div>
            </div>
            <div class="options-grid">
              \${q.options.map((opt, optIdx) => {
                const isSel = selected === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return \`<button type="button" class="opt-btn \${isSel ? 'selected' : ''}" onclick="selectExamOption('\${q.id}', \${optIdx})"><strong>\${letter}.</strong> \${opt}</button>\`;
              }).join('')}
            </div>
          </div>
        \`;
      }).join('');
    }

    function selectExamOption(qId, optIdx) {
      examAnswers[qId] = optIdx;
      renderExamQuestions();
    }

    function submitExam() {
      if (examInterval) clearInterval(examInterval);
      let correctCount = 0;
      examQuestions.forEach(q => {
        if (examAnswers[q.id] === q.correctOptionIndex) {
          correctCount++;
        }
      });
      const score = Math.round((correctCount / examQuestions.length) * 100) / 10;
      document.getElementById('examActive').style.display = 'none';
      document.getElementById('examResult').style.display = 'block';
      document.getElementById('examFinalScore').innerText = score.toFixed(1) + ' / 10 điểm';
      document.getElementById('examSummaryText').innerText = 
        \`Bạn đã trả lời đúng \${correctCount} trên tổng số \${examQuestions.length} câu hỏi.\`;
      playChime(score >= 5);
    }

    // Search event
    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderQuestions();
    });

    // Initial render
    renderClassChips();
    renderQuestions();
  </script>
</body>
</html>`;

const outPath = path.join(process.cwd(), 'public', 'Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html');
fs.writeFileSync(outPath, offlineHtml, 'utf-8');
console.log('Successfully written standalone app to:', outPath, 'Size:', fs.statSync(outPath).size);
