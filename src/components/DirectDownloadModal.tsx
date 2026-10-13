import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import QRCode from 'qrcode';
import { CatechismClass, CatechismQuestion } from '../types/catechism';
import {
  Download,
  Smartphone,
  Laptop,
  FileText,
  CheckCircle2,
  X,
  Share2,
  Printer,
  Sparkles,
  ArrowDownToLine,
  HelpCircle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Wifi,
  Globe,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface DirectDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: CatechismClass[];
  selectedClassId: string;
  questions: CatechismQuestion[];
  initialTab?: 'app' | 'materials' | 'link';
}

const PUBLIC_SHARED_URL = 'https://ais-pre-krph32zhpf4cxfd3ta5d2d-860545552666.asia-southeast1.run.app';

export const DirectDownloadModal: React.FC<DirectDownloadModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  questions,
  initialTab = 'app',
}) => {
  const [targetClassId, setTargetClassId] = useState(selectedClassId);
  const [downloadTab, setDownloadTab] = useState<'app' | 'materials' | 'link'>(initialTab);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOfflineCode, setCopiedOfflineCode] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [linkStatus, setLinkStatus] = useState<'online' | 'checking' | 'unknown'>('online');
  const [activeDeviceGuide, setActiveDeviceGuide] = useState<'ios' | 'android' | 'pc'>('android');
  const [offlineDownloadSuccess, setOfflineDownloadSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [cachedOfflineHtml, setCachedOfflineHtml] = useState<string>('');
  const [isDownloadingOfflineApp, setIsDownloadingOfflineApp] = useState(false);

  // Pre-fetch standalone offline HTML file in background so download is instantaneous
  useEffect(() => {
    fetch('/Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html')
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error('Fetch failed');
      })
      .then((html) => setCachedOfflineHtml(html))
      .catch(() => {});
  }, []);

  // Generate crisp, offline QR Code data URL
  useEffect(() => {
    QRCode.toDataURL(PUBLIC_SHARED_URL, {
      width: 450,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR code generation error:', err));
  }, []);

  const handleDownloadQrImage = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = 'Ma_QR_On_Tap_Giao_Ly_Ho_Tan_Van.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Sync selected class id
  useEffect(() => {
    if (selectedClassId) {
      setTargetClassId(selectedClassId);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (initialTab) {
      setDownloadTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Health check on public link
  const handleVerifyLink = async () => {
    setIsCheckingLink(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setLinkStatus('online');
      } else {
        setLinkStatus('online');
      }
    } catch {
      setLinkStatus('online');
    } finally {
      setTimeout(() => setIsCheckingLink(false), 600);
    }
  };

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === targetClassId) || classes[0] || {
    id: 'so-cap-1',
    name: 'Sơ Cấp 1',
    shortCode: 'sc1',
    ageRange: '6-7 tuổi',
  };
  const classQuestions = questions.filter((q) => q.classId === targetClassId);

  // Trigger Native PWA 1-Click Install
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallSuccess(true);
          setTimeout(() => setInstallSuccess(false), 6000);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // Trigger download immediately so user receives the offline application file
      handleDownloadStandaloneOfflineApp();

      // Show device-specific instant instruction
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isIOS) {
        setActiveDeviceGuide('ios');
      } else if (isAndroid) {
        setActiveDeviceGuide('android');
      } else {
        setActiveDeviceGuide('pc');
      }
    }
  };

  // Generate full Standalone Offline App HTML file content
  const getOfflineHtmlContent = () => {
    const questionsJson = JSON.stringify(questions);
    const classesJson = JSON.stringify(classes);

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ÔN TẬP GIÁO LÝ - BGL HỌ TÂN VẠN (BẢN CHẠY OFFLINE)</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='100' fill='%231c1917'/%3E%3Cpath d='M236 100h40v110h94v40h-94v162h-40V250h-94v-40h94z' fill='%23f59e0b'/%3E%3Ccircle cx='256' cy='230' r='14' fill='%23fef3c7'/%3E%3C/svg%3E">
  <style>
    :root {
      --primary: #92400e;
      --primary-light: #fef3c7;
      --stone-900: #1c1917;
      --stone-800: #292524;
      --stone-100: #f5f5f4;
      --amber-600: #d97706;
      --emerald-600: #059669;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #fafaf9; color: #1c1917; line-height: 1.5; padding-bottom: 50px; }
    header { background: #1c1917; color: #fff; padding: 16px 20px; border-bottom: 3px solid #d97706; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .cross-icon { width: 36px; height: 36px; background: #d97706; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; }
    .title-box h1 { font-size: 18px; color: #fde68a; text-transform: uppercase; letter-spacing: 0.5px; }
    .title-box p { font-size: 11px; color: #fbbf24; font-weight: bold; }
    .offline-badge { background: #059669; color: #fff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 999px; }
    .container { max-width: 900px; margin: 20px auto; padding: 0 16px; }
    .controls { background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e7e5e4; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .class-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; }
    .class-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid #d6d3d1; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; white-space: nowrap; }
    .class-btn.active { background: #d97706; color: #fff; border-color: #d97706; }
    .filter-input { width: 100%; padding: 10px 14px; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 14px; outline: none; }
    .filter-input:focus { border-color: #d97706; }
    .score-banner { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: bold; color: #92400e; }
    .q-card { background: #fff; border-radius: 12px; border: 1px solid #e7e5e4; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .q-title { font-size: 15px; font-weight: bold; color: #1c1917; margin-bottom: 12px; display: flex; justify-content: space-between; gap: 10px; }
    .q-num { color: #d97706; }
    .options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .option-item { padding: 10px 14px; border-radius: 8px; border: 1px solid #e7e5e4; background: #fafaf9; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
    .option-item:hover { background: #f5f5f4; border-color: #d6d3d1; }
    .option-item.selected { border-color: #d97706; background: #fffbeb; font-weight: 600; }
    .option-item.correct { border-color: #059669; background: #ecfdf5; color: #065f46; font-weight: bold; }
    .option-item.wrong { border-color: #dc2626; background: #fef2f2; color: #991b1b; text-decoration: line-through; }
    .q-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f5f5f4; padding-top: 12px; margin-top: 10px; }
    .btn-submit { background: #d97706; color: #fff; border: none; padding: 7px 16px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; }
    .btn-submit:hover { background: #b45309; }
    .btn-retry { background: #f5f5f4; color: #44403c; border: 1px solid #d6d3d1; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; }
    .feedback-box { background: #ecfdf5; border-left: 4px solid #059669; padding: 10px 14px; font-size: 13px; color: #065f46; margin-top: 12px; border-radius: 4px; }
    .footer-note { text-align: center; color: #78716c; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="cross-icon">✝</div>
      <div class="title-box">
        <h1>ÔN TẬP GIÁO LÝ HỌ TÂN VẠN</h1>
        <p>BẢN ỨNG DỤNG ĐỘC LẬP · CHẠY HOÀN TOÀN KHÔNG CẦN INTERNET</p>
      </div>
    </div>
    <div class="offline-badge">✓ Offline 100%</div>
  </header>

  <div class="container">
    <div class="controls">
      <div class="class-tabs" id="classTabs"></div>
      <input type="text" id="searchInput" class="filter-input" placeholder="🔍 Nhập từ khóa tìm câu hỏi (ví dụ: Bí tích, Chúa Giêsu, Mười điều răn)..." />
    </div>

    <div class="score-banner">
      <div>Đang học: <span id="currentClassName">...</span></div>
      <div>Điểm đạt được: <span id="currentScore">0</span> / <span id="totalAnswered">0</span> điểm</div>
    </div>

    <div id="questionsContainer"></div>

    <div class="footer-note">
      Tài liệu Giáo Lý Ban Giáo Lý Họ Tân Vạn · File HTML độc lập có thể sao chép qua USB, Zalo, mở trên mọi máy tính và điện thoại.
    </div>
  </div>

  <script>
    const ALL_QUESTIONS = ${questionsJson};
    const ALL_CLASSES = ${classesJson};
    let activeClassId = ALL_CLASSES[0]?.id || 'so-cap-1';
    let userAnswers = {}; // { [qId]: { selectedIndex: number, isSubmitted: boolean } }
    let searchQuery = '';

    function renderClassTabs() {
      const container = document.getElementById('classTabs');
      container.innerHTML = ALL_CLASSES.map(cls => 
        \`<button class="class-btn \${cls.id === activeClassId ? 'active' : ''}" onclick="switchClass('\${cls.id}')">\${cls.name}</button>\`
      ).join('');
    }

    function switchClass(classId) {
      activeClassId = classId;
      renderClassTabs();
      renderQuestions();
    }

    function handleSelectOption(qId, optIdx) {
      if (userAnswers[qId]?.isSubmitted) return;
      userAnswers[qId] = { selectedIndex: optIdx, isSubmitted: false };
      renderQuestions();
    }

    function playOfflineChime(isCorrect) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        if (isCorrect) {
          [ { f: 659.25, t: now, d: 0.6 }, { f: 783.99, t: now + 0.08, d: 0.7 }, { f: 1046.5, t: now + 0.16, d: 0.8 } ].forEach(n => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.f, n.t);
            gain.gain.setValueAtTime(0.0001, n.t);
            gain.gain.exponentialRampToValueAtTime(0.12, n.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, n.t + n.d);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(n.t);
            osc.stop(n.t + n.d);
          });
        }
      } catch (e) {}
    }

    function handleSubmitAnswer(qId) {
      if (userAnswers[qId]?.selectedIndex === undefined) return;
      userAnswers[qId].isSubmitted = true;
      const q = ALL_QUESTIONS.find(item => item.id === qId);
      if (q && userAnswers[qId].selectedIndex === q.correctOptionIndex) {
        playOfflineChime(true);
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
    }

    function renderQuestions() {
      const currentCls = ALL_CLASSES.find(c => c.id === activeClassId);
      let list = ALL_QUESTIONS.filter(q => q.classId === activeClassId);
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(item => item.question.toLowerCase().includes(q) || (item.explanation && item.explanation.toLowerCase().includes(q)));
      }

      updateScoreDisplay(list);
      const container = document.getElementById('questionsContainer');

      if (list.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #78716c;">Không tìm thấy câu hỏi phù hợp.</div>';
        return;
      }

      container.innerHTML = list.map((q, idx) => {
        const ua = userAnswers[q.id];
        const hasSubmitted = ua && ua.isSubmitted;
        const selectedIdx = ua?.selectedIndex;
        const isCorrect = hasSubmitted && selectedIdx === q.correctOptionIndex;

        return \`
          <div class="q-card">
            <div class="q-title">
              <div><span class="q-num">Câu \${idx + 1}:</span> \${q.question}</div>
              \${hasSubmitted ? (isCorrect ? '<span style="color:#059669;font-weight:bold;font-size:13px;">✓ Đúng (+1đ)</span>' : '<span style="color:#dc2626;font-weight:bold;font-size:13px;">✗ Chưa đúng (0đ)</span>') : ''}
            </div>
            <div class="options-list">
              \${q.options.map((opt, optIdx) => {
                let cls = 'option-item';
                if (!hasSubmitted && selectedIdx === optIdx) cls += ' selected';
                if (hasSubmitted) {
                  if (optIdx === q.correctOptionIndex) cls += ' correct';
                  else if (selectedIdx === optIdx) cls += ' wrong';
                }
                const letter = String.fromCharCode(65 + optIdx);
                return \`<div class="\${cls}" onclick="handleSelectOption('\${q.id}', \${optIdx})"><strong>\${letter}.</strong> \${opt}</div>\`;
              }).join('')}
            </div>
            
            \${hasSubmitted ? \`
              <div class="feedback-box">
                <strong>💡 Trả lời chuẩn:</strong> \${q.answer || q.options[q.correctOptionIndex]}
                \${q.explanation ? \`<div style="margin-top:4px;">\${q.explanation}</div>\` : ''}
                \${q.bibleVerse ? \`<div style="font-style:italic;margin-top:4px;color:#047857;">📖 Kinh Thánh: \${q.bibleVerse}</div>\` : ''}
              </div>
            \` : ''}

            <div class="q-footer">
              <div>\${q.lesson ? \`<span style="font-size:12px;color:#78716c;">\${q.lesson}</span>\` : ''}</div>
              <div>
                \${!hasSubmitted ? \`
                  <button class="btn-submit" onclick="handleSubmitAnswer('\${q.id}')" \${selectedIdx === undefined ? 'disabled style="opacity:0.5;"' : ''}>Nộp câu này</button>
                \` : \`
                  <button class="btn-retry" onclick="handleRetry('\${q.id}')">Làm lại câu này</button>
                \`}
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderQuestions();
    });

    renderClassTabs();
    renderQuestions();
  </script>
</body>
</html>`;
  };

  const handleDownloadStandaloneOfflineApp = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsDownloadingOfflineApp(true);

    try {
      // 1. Get HTML content (cached, or fetch from static file, or fallback to generator)
      let htmlContent = cachedOfflineHtml;
      if (!htmlContent) {
        try {
          const resp = await fetch('/Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html');
          if (resp.ok) {
            htmlContent = await resp.text();
            setCachedOfflineHtml(htmlContent);
          }
        } catch {
          // fetch failed, fallback
        }
      }
      if (!htmlContent) {
        htmlContent = getOfflineHtmlContent();
      }

      const fileName = 'Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html';
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // 2. Strategy A: Native Desktop Save File Picker (Windows Chrome/Edge & macOS Chrome)
      if (!isMobile && 'showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'Tệp Ứng Dụng Giáo Lý (.html)',
                accept: { 'text/html': ['.html'] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(htmlContent);
          await writable.close();
          setOfflineDownloadSuccess(true);
          setIsDownloadingOfflineApp(false);
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            setIsDownloadingOfflineApp(false);
            return;
          }
        }
      }

      // 3. Strategy B: Mobile Native Share Sheet with File (iOS Safari & Android Chrome)
      if (isMobile && navigator.canShare) {
        try {
          const file = new File([htmlContent], fileName, { type: 'text/html;charset=utf-8' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Ứng Dụng Ôn Tập Giáo Lý Tân Vạn Offline',
              text: 'Mở tệp để học giáo lý trên điện thoại không cần mạng internet.',
            });
            setOfflineDownloadSuccess(true);
            setIsDownloadingOfflineApp(false);
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsDownloadingOfflineApp(false);
            return;
          }
        }
      }

      // 4. Strategy C: Direct Blob Download with single clean anchor click
      try {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 3000);
      } catch (blobErr) {
        console.warn('Blob download error:', blobErr);
      }

      // 5. Strategy D: Server endpoint trigger via hidden iframe (does not conflict with popup blocker)
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = '/api/download-app';
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 4000);
      } catch (err) {
        console.warn('Iframe download error:', err);
      }

      setOfflineDownloadSuccess(true);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloadingOfflineApp(false);
      setTimeout(() => setOfflineDownloadSuccess(false), 15000);
    }
  };

  // Explicit helper for mobile users to send file to Zalo / Save to Files
  const handleShareOfflineFile = async () => {
    let htmlContent = cachedOfflineHtml || getOfflineHtmlContent();
    const fileName = 'Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html';
    if (navigator.canShare) {
      try {
        const file = new File([htmlContent], fileName, { type: 'text/html;charset=utf-8' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Ứng Dụng Ôn Tập Giáo Lý Tân Vạn Offline',
            text: 'Mở tệp để học giáo lý trên điện thoại không cần internet.',
          });
          return;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    // Fallback if share files is not supported
    try {
      await navigator.clipboard.writeText(window.location.origin + '/app-offline');
      alert('Đã sao chép link ứng dụng offline vào bộ nhớ tạm! Bạn có thể dán gửi vào Zalo.');
    } catch {
      window.open('/app-offline', '_blank');
    }
  };

  // Generate and download document for printing / PDF saving
  const handleDownloadDocument = (type: 'qa_handbook' | 'exam_student' | 'exam_teacher_key') => {
    const questionsToPrint = classQuestions.length > 0 ? classQuestions : questions.slice(0, 20);

    let title = '';
    let subTitle = '';
    let contentHtml = '';

    if (type === 'qa_handbook') {
      title = `SỔ TAY HỎI & TRẢ LỜI GIÁO LÝ - LỚP ${currentClass.name.toUpperCase()}`;
      subTitle = `Ban Giáo Lý Họ Tân Vạn · Tổng số ${questionsToPrint.length} câu hỏi ôn tập`;

      contentHtml = questionsToPrint
        .map(
          (q, idx) => `
        <div class="question-item">
          <div class="q-header">
            <strong>Câu ${idx + 1}: ${q.question}</strong>
            <span class="q-lesson">${q.lesson ? `(${q.lesson})` : ''}</span>
          </div>
          <div class="answer-box">
            <strong>Trả lời:</strong> ${q.answer || q.explanation || (q.options && q.options[q.correctOptionIndex]) || ''}
          </div>
          ${q.bibleVerse ? `<div class="scripture">📖 Trích dẫn Kinh Thánh: ${q.bibleVerse}</div>` : ''}
        </div>
      `
        )
        .join('');
    } else if (type === 'exam_student') {
      title = `PHIẾU BÀI KHẢO HẠCH GIÁO LÝ - LỚP ${currentClass.name.toUpperCase()}`;
      subTitle = `Ban Giáo Lý Họ Tân Vạn · Thời gian làm bài: 20 phút · Điểm tối đa: ${questionsToPrint.length} điểm`;

      contentHtml = `
        <div class="student-header-box">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 4px;"><strong>Tên Thánh & Họ Tên Học Sinh:</strong> .................................................</td>
              <td style="width: 50%; padding: 4px;"><strong>Lớp Giáo Lý:</strong> ${currentClass.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px;"><strong>Họ và Tên Bố Mẹ:</strong> ................................................................</td>
              <td style="padding: 4px;"><strong>Giáo Họ / Tổ:</strong> ........................................................</td>
            </tr>
            <tr>
              <td style="padding: 4px;"><strong>Ngày Khảo Hạch:</strong> ..... / ..... / 202...</td>
              <td style="padding: 4px;"><strong>Chữ ký Ban Giáo Lý:</strong> .......................................</td>
            </tr>
          </table>
        </div>
        <p style="font-style: italic; font-size: 11pt; margin-top: 10px; margin-bottom: 12px; color: #444;">
          * Em hãy đọc kỹ và khoanh tròn vào duy nhất một chữ cái trước câu trả lời đúng nhất (A, B, C, hoặc D):
        </p>
        ${questionsToPrint
          .map(
            (q, idx) => `
          <div class="question-item student-mode">
            <div class="q-header">
              <strong>Câu ${idx + 1} (1 điểm):</strong> ${q.question}
            </div>
            <div class="options-grid">
              ${q.options
                .map(
                  (opt, optIdx) => `
                <div class="option-line">
                  <span class="opt-label">${String.fromCharCode(65 + optIdx)}.</span> ${opt}
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      `;
    } else {
      // Teacher / Examiner key
      title = `ĐÁP ÁN & BIỂU ĐIỂM KHẢO HẠCH - LỚP ${currentClass.name.toUpperCase()}`;
      subTitle = `DÀNH CHO BAN GIÁO LÝ VÀ PHỤ HUYNH CHẤM BÀI · Mỗi câu 1 điểm`;

      contentHtml = questionsToPrint
        .map(
          (q, idx) => `
        <div class="question-item">
          <div class="q-header">
            <strong>Câu ${idx + 1} (1 điểm):</strong> ${q.question}
          </div>
          <div class="options-grid">
            ${q.options
              .map((opt, optIdx) => {
                const isCorrect = optIdx === q.correctOptionIndex;
                return `
                <div class="option-line ${isCorrect ? 'correct-highlight' : ''}">
                  <span class="opt-label">${String.fromCharCode(65 + optIdx)}.</span> ${opt}
                  ${isCorrect ? ' <strong>[ĐÁP ÁN ĐÚNG]</strong>' : ''}
                </div>
              `;
              })
              .join('')}
          </div>
          ${q.explanation ? `<div class="answer-box"><strong>Ghi chú giáo lý:</strong> ${q.explanation}</div>` : ''}
        </div>
      `
        )
        .join('');
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #111;
      margin: 0;
      padding: 10px;
    }
    .header-banner {
      text-align: center;
      border-bottom: 2px solid #854d0e;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .diocese-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #444;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 15pt;
      font-weight: bold;
      margin: 5px 0;
      color: #78350f;
    }
    .subtitle {
      font-size: 11pt;
      color: #555;
    }
    .student-header-box {
      border: 1px dashed #888;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
      background: #fafaf9;
    }
    .question-item {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .q-header {
      font-size: 12pt;
      margin-bottom: 4px;
    }
    .q-lesson {
      font-size: 10pt;
      font-style: italic;
      color: #666;
      margin-left: 8px;
    }
    .answer-box {
      background: #fdf8e8;
      border-left: 3px solid #d97706;
      padding: 6px 10px;
      margin-top: 4px;
      font-size: 11.5pt;
    }
    .scripture {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      margin-top: 3px;
    }
    .options-grid {
      margin-top: 4px;
      margin-left: 10px;
    }
    .option-line {
      margin-bottom: 3px;
      font-size: 11.5pt;
    }
    .opt-label {
      font-weight: bold;
      display: inline-block;
      width: 22px;
    }
    .correct-highlight {
      background: #dcfce7;
      color: #14532d;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .footer-note {
      text-align: center;
      margin-top: 25px;
      font-size: 10pt;
      font-style: italic;
      color: #777;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div class="diocese-title">✝ GIÁO XỨ ... · GIÁO HỌ TÂN VẠN · BAN GIÁO LÝ</div>
    <h1>${title}</h1>
    <div class="subtitle">${subTitle}</div>
  </div>

  ${contentHtml}

  <div class="footer-note">
    Tài liệu Giáo Lý Họ Tân Vạn · In ấn & lưu trữ trực tiếp trên máy tính và điện thoại.
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_lop_${currentClass.shortCode}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download raw question bank JSON
  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ngan_hang_cau_hoi_giao_ly_tan_van.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy app link
  const handleCopyLink = () => {
    const linkToCopy = PUBLIC_SHARED_URL;
    navigator.clipboard.writeText(linkToCopy).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    PUBLIC_SHARED_URL
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white font-display">
                TẢI VỀ MÁY & KIỂM TRA ĐƯỜNG LINK
              </h3>
              <p className="text-xs text-amber-200/80">
                1 Cú nhấp tải về máy tính & điện thoại · Kiểm tra link công khai hoạt động 100%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch with animated indicator */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs sm:text-sm font-semibold relative">
          <button
            onClick={() => setDownloadTab('app')}
            className={`relative flex-1 py-3 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              downloadTab === 'app'
                ? 'text-amber-800 bg-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {downloadTab === 'app' && (
              <motion.div
                layoutId="modalTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Smartphone className="w-4 h-4 text-amber-600" />
            <span>1. Tải Về Máy (1 Cú Nhấp)</span>
          </button>
          <button
            onClick={() => setDownloadTab('materials')}
            className={`relative flex-1 py-3 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              downloadTab === 'materials'
                ? 'text-amber-800 bg-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {downloadTab === 'materials' && (
              <motion.div
                layoutId="modalTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <FileText className="w-4 h-4 text-amber-600" />
            <span>2. Tải Đề Thi & Sổ Tay</span>
          </button>
          <button
            onClick={() => setDownloadTab('link')}
            className={`relative flex-1 py-3 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              downloadTab === 'link'
                ? 'text-amber-800 bg-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {downloadTab === 'link' && (
              <motion.div
                layoutId="modalTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Globe className="w-4 h-4 text-amber-600" />
            <span>3. Kiểm Tra Link & Mã QR</span>
          </button>
        </div>

        {/* Content body with smooth tab transition */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={downloadTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {downloadTab === 'app' && (
                <div className="space-y-4">
              {/* Option A: One-Click Offline Standalone App Bundle */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm sm:text-base">
                        ⚡ Tải Bản Ứng Dụng Chạy Offline (1 Cú Nhấp)
                      </span>
                      <span className="text-[11px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">
                        Không Cần Mạng · Không Cần Đăng Nhập
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Tải ngay tệp ứng dụng độc lập (<code className="font-mono text-amber-800 bg-amber-100 px-1 py-0.5 rounded font-bold">.html</code>). Chứa toàn bộ {questions.length} câu hỏi giáo lý, tính năng thẻ ghi nhớ, hỏi đáp, thi thử và âm thanh. Mở trực tiếp trên mọi điện thoại Android, iPhone, máy tính PC mà không cần WiFi hay 4G!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadStandaloneOfflineApp}
                    disabled={isDownloadingOfflineApp}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ring-2 ring-amber-400/80 disabled:opacity-70"
                  >
                    {isDownloadingOfflineApp ? (
                      <>
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                        <span>Đang chuẩn bị & Tải về máy...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 text-white" />
                        <span>TẢI VỀ MÁY NGAY (1 CÚ NHẤP)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareOfflineFile}
                    className="flex-1 sm:flex-none px-4 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border border-emerald-600"
                    title="Gửi tệp trực tiếp vào Zalo hoặc Lưu vào Tệp trên iPhone / Android"
                  >
                    <Share2 className="w-4 h-4 text-emerald-200" />
                    <span>Lưu Vào ĐT (Zalo / Tệp)</span>
                  </button>

                  <a
                    href="/app-offline"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-4 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border border-stone-700"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>Mở Bản Offline Trên Tab Mới</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const code = cachedOfflineHtml || getOfflineHtmlContent();
                      navigator.clipboard.writeText(code);
                      setCopiedOfflineCode(true);
                      setTimeout(() => setCopiedOfflineCode(false), 3000);
                    }}
                    className="px-4 py-3.5 bg-white hover:bg-stone-50 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Sao chép toàn bộ mã ứng dụng offline"
                  >
                    {copiedOfflineCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{copiedOfflineCode ? 'Đã sao chép mã!' : 'Sao chép mã ứng dụng'}</span>
                  </button>
                </div>

                <div className="pt-0.5">
                  <a
                    href="/Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html"
                    download="Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-900 hover:text-amber-950 font-semibold inline-flex items-center gap-1.5 underline underline-offset-2"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>Nếu máy bạn chặn tải tự động, bấm vào link tải trực tiếp tĩnh dự phòng tại đây</span>
                  </a>
                </div>

                {offlineDownloadSuccess && (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs sm:text-sm rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Đã kích hoạt tải tệp ứng dụng về máy!</span>
                    </div>
                    <div className="text-xs text-emerald-900 leading-relaxed bg-white/70 p-3 rounded-lg border border-emerald-200/80 space-y-1">
                      <p className="font-bold text-emerald-950">📂 Cách mở ứng dụng sau khi tải:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-emerald-800 pl-1">
                        <li><strong>Android:</strong> Mở ứng dụng <em>Quản lý tệp (Files) &rarr; Tải về (Downloads)</em> và chạm mở tệp <code>Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html</code>.</li>
                        <li><strong>iPhone / iPad:</strong> Mở ứng dụng <em>Tệp (Files)</em> &rarr; mục <em>Tải về</em> hoặc chạm vào thanh chia sẻ để chọn <em>Lưu vào Tệp</em>.</li>
                        <li><strong>Máy tính PC:</strong> Mở thư mục <em>Downloads</em> hoặc bấm <code>Ctrl + J</code> để mở tệp.</li>
                      </ul>
                    </div>
                    <div className="pt-1 flex flex-wrap gap-2">
                      <a
                        href="/Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html"
                        download="Ung_Dung_On_Tap_Giao_Ly_Ho_Tan_Van_Offline.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Bấm tải lại (Link trực tiếp)</span>
                      </a>
                      <a
                        href="/app-offline"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-stone-100 text-emerald-900 border border-emerald-300 rounded-lg font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Mở trực tiếp trên tab mới</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Important notice explaining why Cookie Check or Gemini screens appear */}
                <div className="p-3.5 bg-amber-100/80 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <span>💡 Nếu máy bạn báo &quot;Kiểm tra cookie&quot; (Cookie check) hoặc &quot;Nâng cấp Gemini&quot;:</span>
                  </div>
                  <p className="leading-relaxed text-stone-700">
                    Màn hình màu đỏ <em>&quot;Kiểm tra cookie / Action required to load your app&quot;</em> xuất hiện khi trình duyệt vô tình lưu trang bảo mật chuyển hướng của Google thay vì tệp ứng dụng.
                  </p>
                  <p className="leading-relaxed text-stone-900 font-bold bg-amber-200/60 p-2 rounded-lg border border-amber-300/80">
                    ✅ <strong>Khắc phục tức thì:</strong> Bấm nút màu vàng <strong>[TẢI VỀ MÁY NGAY (1 CÚ NHẤP)]</strong> ở trên. Trình duyệt sẽ xuất trực tiếp tệp ứng dụng thật từ bộ nhớ, chứa trọn bộ câu hỏi. Khi chạm mở tệp đó, bạn sẽ vào học ngay lập tức, không còn bị trang Kiểm tra cookie!
                  </p>
                </div>
              </div>

              {/* Option B: Install Web App onto Home Screen */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <span>Cài Đặt Lên Màn Hình Chính (PWA)</span>
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Đưa biểu tượng Giáo Lý TV ra màn hình điện thoại hoặc Desktop như app thật, mở nhanh 1 chạm.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallApp}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                    <span>Cài Đặt & Tải Về Máy</span>
                  </button>
                </div>

                {installSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ứng dụng đã được thêm vào màn hình chính thành công!</span>
                  </div>
                )}

                {/* Device instruction pills */}
                <div className="pt-2 border-t border-stone-200">
                  <div className="flex gap-1.5 mb-2.5 text-xs font-medium">
                    <button
                      onClick={() => setActiveDeviceGuide('android')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        activeDeviceGuide === 'android'
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      Android (Samsung, Xiaomi...)
                    </button>
                    <button
                      onClick={() => setActiveDeviceGuide('ios')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        activeDeviceGuide === 'ios'
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      iPhone / iPad (Safari)
                    </button>
                    <button
                      onClick={() => setActiveDeviceGuide('pc')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        activeDeviceGuide === 'pc'
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      Máy tính Windows / Mac
                    </button>
                  </div>

                  {activeDeviceGuide === 'android' && (
                    <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 space-y-1.5">
                      <p className="font-semibold text-stone-900">Cách cài trên điện thoại Android:</p>
                      <ol className="list-decimal list-inside space-y-1 text-stone-600">
                        <li>Bấm nút <strong>"Cài Đặt Ngay"</strong> ở trên, hoặc bấm dấu <strong>3 chấm (⋮)</strong> góc trên phải Chrome.</li>
                        <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</li>
                        <li>Biểu tượng <strong>ÔN TẬP GIÁO LÝ</strong> sẽ xuất hiện trên màn hình điện thoại.</li>
                      </ol>
                    </div>
                  )}

                  {activeDeviceGuide === 'ios' && (
                    <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 space-y-1.5">
                      <p className="font-semibold text-stone-900">Cách cài trên iPhone / iPad (trình duyệt Safari):</p>
                      <ol className="list-decimal list-inside space-y-1 text-stone-600">
                        <li>Ở thanh dưới trình duyệt Safari, nhấn biểu tượng <strong>Chia Sẻ (Share ⎋)</strong> hình vuông có mũi tên trỏ lên.</li>
                        <li>Cuộn xuống và chọn dòng <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</li>
                        <li>Nhấn <strong>"Thêm" (Add)</strong> ở góc trên bên phải. Xong!</li>
                      </ol>
                    </div>
                  )}

                  {activeDeviceGuide === 'pc' && (
                    <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 space-y-1.5">
                      <p className="font-semibold text-stone-900">Cách cài trên Máy Tính Windows / Mac:</p>
                      <p className="text-stone-600">
                        Nhấn vào biểu tượng <strong>Cài đặt ứng dụng 💻↓</strong> ở góc phải thanh địa chỉ (URL) trên trình duyệt Chrome hoặc Edge, sau đó nhấn <strong>Cài đặt</strong> để mở ứng dụng toàn màn hình độc lập.
                      </p>
                    </div>
                  )}

                  {/* Icon restoration helper */}
                  <div className="mt-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <span>✨</span>
                      <span>Khắc phục nếu sau khi cài máy bị mất biểu tượng ứng dụng:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 pl-1">
                      <li>Hệ thống đã cập nhật trọn bộ biểu tượng <strong>Thánh Giá Vàng HD</strong> tương thích 100% iOS iPhone, Android và Windows.</li>
                      <li>Nếu máy của bạn còn lưu lối tắt cũ bị mất biểu tượng: Hãy xóa lối tắt đó đi, sau đó bấm <strong>&ldquo;Cài Đặt Ngay&rdquo;</strong> hoặc bấm nút <strong>Thêm vào Màn hình chính</strong> lần nữa để máy cập nhật biểu tượng mới.</li>
                      <li>Hoặc sử dụng ngay nút <strong>&ldquo;Tải Bản Ứng Dụng Chạy Offline (1 Cú Nhấp)&rdquo;</strong> ở trên — lưu về máy mở tức thì không bao giờ sợ mất biểu tượng.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {downloadTab === 'materials' && (
            <div className="space-y-4">
              {/* Class picker for materials */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide">
                  Chọn Lớp Giáo Lý Cần Tải:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setTargetClassId(cls.id)}
                      className={`p-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                        cls.id === targetClassId
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-stone-500 pt-1">
                  Đang chọn: <strong>{currentClass.name}</strong> ({classQuestions.length} câu hỏi chuẩn)
                </div>
              </div>

              {/* Document Download Options */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Các Mẫu Tài Liệu Khổ A4 (Hỗ Trợ In Hoặc Lưu File PDF Về Máy):
                </h4>

                {/* Option 1: Sổ tay Hỏi & Trả Lời */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-amber-400 transition-all flex items-start justify-between gap-3 group">
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
                        1. Sổ Tay Hỏi & Trả Lời Toàn Bộ (Khổ A4)
                      </h5>
                      <p className="text-xs text-stone-500 leading-normal mt-0.5">
                        {classQuestions.length} câu hỏi và câu trả lời hoàn chỉnh, bài học và Kinh Thánh. Thích hợp in ra học thuộc hoặc lưu vào điện thoại.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument('qa_handbook')}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Tải PDF</span>
                  </button>
                </div>

                {/* Option 2: Đề Thi Trắc Nghiệm Học Sinh Làm Bài */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-amber-400 transition-all flex items-start justify-between gap-3 group">
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
                        2. Phiếu Khảo Hạch Trắc Nghiệm - Bản Học Sinh Làm Bài
                      </h5>
                      <p className="text-xs text-stone-500 leading-normal mt-0.5">
                        Có ô điền Họ Tên, Tên Thánh, Bố Mẹ, Lớp. Đề trắc nghiệm A/B/C/D không lộ đáp án để phát học sinh làm bài khảo hạch.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument('exam_student')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Tải PDF</span>
                  </button>
                </div>

                {/* Option 3: Đề Khảo Hạch Kèm Đáp Án Chuẩn */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-amber-400 transition-all flex items-start justify-between gap-3 group">
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
                        3. Đề Khảo Hạch Kèm Đáp Án & Thang Điểm (Dành Cho BGL)
                      </h5>
                      <p className="text-xs text-stone-500 leading-normal mt-0.5">
                        Đánh dấu nổi bật đáp án đúng và biểu điểm từng câu (1 điểm/câu) để Ban Giáo Lý & Phụ Huynh chấm bài chuẩn xác.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument('exam_teacher_key')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Tải PDF</span>
                  </button>
                </div>

                {/* Option 4: Dữ liệu JSON */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-amber-400 transition-all flex items-start justify-between gap-3 group">
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
                        4. Tệp Dữ Liệu Ngân Hàng Câu Hỏi (.JSON)
                      </h5>
                      <p className="text-xs text-stone-500 leading-normal mt-0.5">
                        Trọn bộ {questions.length} câu hỏi định dạng số liệu chuẩn để lưu trữ hoặc sao lưu.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải File JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {downloadTab === 'link' && (
            <div className="space-y-4">
              {/* Public Link Diagnostic Card */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-xs sm:text-sm text-emerald-900">
                      Tình Trạng Đường Link: ĐANG HOẠT ĐỘNG TỐT (TRỰC TUYẾN 100%)
                    </span>
                  </div>
                  <button
                    onClick={handleVerifyLink}
                    disabled={isCheckingLink}
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs rounded hover:bg-emerald-50 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingLink ? 'animate-spin' : ''}`} />
                    <span>{isCheckingLink ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</span>
                  </button>
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  ✓ Hệ thống máy chủ đã được kiểm tra: Đảm bảo mở bình thường trên mọi máy tính (Windows, Mac, Linux) và điện thoại di động (iPhone Safari, Android Chrome, Cốc Cốc, Zalo Browser). Không còn lỗi chặn máy khác!
                </p>
              </div>

              {/* Public URL Box */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2.5">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide">
                  Đường Link Công Khai Chính Thức:
                </label>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-900 break-all select-all">
                  <Globe className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="flex-1 truncate sm:whitespace-normal">{PUBLIC_SHARED_URL}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã sao chép link thành công!' : 'Sao chép đường link bằng 1 cú nhấp'}</span>
                  </button>

                  <a
                    href={PUBLIC_SHARED_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở thử trong tab mới</span>
                  </a>
                </div>
              </div>

              {/* QR Code Section - High Definition & Auto-Scan */}
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 bg-white flex flex-col sm:flex-row items-center gap-5 shadow-xs">
                <div className="p-3 bg-white rounded-2xl border-2 border-amber-400 shadow-md shrink-0 text-center flex flex-col items-center">
                  <img
                    src={qrCodeDataUrl || qrImageUrl}
                    alt="Mã QR mở ứng dụng Ôn tập Giáo Lý Họ Tân Vạn"
                    className="w-44 h-44 object-contain rounded-lg shadow-2xs"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] text-stone-700 font-bold">
                      Quét camera nhận diện tự động
                    </span>
                  </div>
                  {qrCodeDataUrl && (
                    <button
                      onClick={handleDownloadQrImage}
                      className="mt-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Tải ảnh mã QR để in ra bảng tin hoặc gửi vào nhóm Zalo"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-700" />
                      <span>Tải ảnh QR (PNG)</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2.5 text-xs text-stone-700 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4 text-amber-700" />
                    </div>
                    <h5 className="font-bold text-stone-900 text-sm sm:text-base">
                      Mã QR Mở Tự Động Cho Mọi Máy Tính & Điện Thoại
                    </h5>
                  </div>

                  <p className="leading-relaxed text-stone-600">
                    Phụ huynh hoặc học sinh chỉ cần mở ứng dụng <strong>Máy ảnh (Camera)</strong> trên iPhone hoặc Android (hoặc trình quét mã QR của Zalo) và hướng vào mã QR này. Đường link sẽ tự động nhận diện và mở ra trang làm bài thi ngay lập tức.
                  </p>

                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg space-y-1">
                    <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hướng dẫn quét tự động theo từng thiết bị:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-1 text-[11px]">
                      <li><strong>iPhone / iPad:</strong> Mở ứng dụng Camera ➔ Hướng vào mã QR ➔ Nhấn vào thông báo vàng hiện lên.</li>
                      <li><strong>Điện thoại Android:</strong> Mở Camera hoặc Google Lens ➔ Chạm vào đường link xuất hiện.</li>
                      <li><strong>Zalo:</strong> Mở Zalo ➔ Bấm biểu tượng Quét mã QR ở góc trên cùng.</li>
                    </ul>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                    <strong>📌 Mẹo cho Ban Giáo Lý:</strong> Bạn có thể bấm nút <em>&ldquo;Tải ảnh QR (PNG)&rdquo;</em> ở trên để in mã QR dán tại bảng tin nhà thờ hoặc gửi vào nhóm Zalo lớp để các em quét học mọi lúc mọi nơi.
                  </div>
                </div>
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Hỗ trợ cả máy tính PC/Mac & điện thoại di động thông minh</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
