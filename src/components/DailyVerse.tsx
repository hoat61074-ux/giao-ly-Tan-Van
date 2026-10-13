import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Volume2, VolumeX, Copy, Check, Share2, Sparkles, Heart, Quote } from 'lucide-react';

export interface CatholicVerse {
  id: string;
  reference: string; // e.g. Ga 14, 6
  text: string;
  context: string; // e.g. Phúc Âm Chúa Giêsu Kitô theo Thánh Gioan
  category: 'faith' | 'love' | 'peace' | 'hope' | 'perseverance';
  categoryLabel: string;
  reflection: string; // Lời nguyện vắn / Suy niệm ngắn
}

export const CATHOLIC_VERSES: CatholicVerse[] = [
  {
    id: 'ga-14-6',
    reference: 'Ga 14, 6',
    text: 'Thầy là đường, là sự thật và là sự sống. Không ai đến được với Chúa Cha mà không qua Thầy.',
    context: 'Tin Mừng Chúa Giêsu Kitô theo Thánh Gioan',
    category: 'faith',
    categoryLabel: 'Đức Tin & Chân Lý',
    reflection: 'Lạy Chúa Giêsu, xin soi sáng bước chân con để con luôn bước đi trên con đường của Chúa và làm chứng cho Sự Thật.'
  },
  {
    id: 'ga-13-34',
    reference: 'Ga 13, 34',
    text: 'Thầy ban cho anh em một điều răn mới là anh em hãy yêu thương nhau; như Thầy đã yêu thương anh em, anh em cũng hãy yêu thương nhau.',
    context: 'Tin Mừng Chúa Giêsu Kitô theo Thánh Gioan',
    category: 'love',
    categoryLabel: 'Yêu Thương & Bác Ái',
    reflection: 'Lạy Chúa, xin ban cho con một trái tim biết bao dung, quảng đại và yêu mến bạn bè, cha mẹ và mọi người chung quanh.'
  },
  {
    id: 'mt-11-28',
    reference: 'Mt 11, 28',
    text: 'Tất cả những ai đang vất vả mang gánh nặng nề, hãy đến cùng tôi, tôi sẽ cho nghỉ ngơi bồi dưỡng.',
    context: 'Tin Mừng Chúa Giêsu Kitô theo Thánh Mát-thêu',
    category: 'peace',
    categoryLabel: 'Bình An & Nâng Đỡ',
    reflection: 'Trong những lúc học tập mệt mỏi hay gặp thử thách, con xin chạy đến nấp bóng bình an dưới cánh tay Chúa.'
  },
  {
    id: 'tv-119-105',
    reference: 'Tv 119, 105',
    text: 'Lời Chúa là ngọn đèn soi cho con bước, là ánh sáng chỉ đường con đi.',
    context: 'Sách Thánh Vịnh',
    category: 'faith',
    categoryLabel: 'Lời Chúa Soi Sáng',
    reflection: 'Mỗi bài học giáo lý hôm nay là một tia sáng nuôi dưỡng tâm hồn con lớn lên trong ân nghĩa Chúa.'
  },
  {
    id: 'tv-23-1',
    reference: 'Tv 23, 1-2',
    text: 'Chúa là mục tử chăn dắt tôi, tôi chẳng thiếu thốn gì. Trong đồng cỏ xanh tươi, Người cho tôi nằm nghỉ.',
    context: 'Thánh Vịnh Mục Tử',
    category: 'peace',
    categoryLabel: 'Phó Thác & Tin Cậy',
    reflection: 'Có Chúa ở cùng, chúng con không sợ hãi gian lao. Chúa dẫn dắt Ban Giáo Lý và từng học sinh chúng con qua mọi chặng đường.'
  },
  {
    id: 'pl-4-13',
    reference: 'Pl 4, 13',
    text: 'Với Đấng ban sức mạnh cho tôi, tôi có thể làm được mọi sự.',
    context: 'Thư Thánh Phaolô Tông Đồ gửi tín hữu Philípphê',
    category: 'hope',
    categoryLabel: 'Sức Mạnh & Hy Vọng',
    reflection: 'Xin Chúa ban thêm lòng can đảm và ơn Chúa Thánh Thần để con chăm chỉ học hỏi và đạt kết quả tốt đẹp.'
  },
  {
    id: 'mt-7-7',
    reference: 'Mt 7, 7',
    text: 'Anh em hãy xin thì sẽ được, hãy tìm thì sẽ thấy, hãy gõ cửa thì sẽ mở cho.',
    context: 'Tin Mừng Chúa Giêsu Kitô theo Thánh Mát-thêu',
    category: 'faith',
    categoryLabel: 'Cầu Nguyện & Kiên Trì',
    reflection: 'Lạy Chúa, con tha thiết cầu xin Chúa ban ơn khôn ngoan để con ngày càng hiểu biết và yêu mến Chúa nhiều hơn.'
  },
  {
    id: 'ga-3-16',
    reference: 'Ga 3, 16',
    text: 'Thiên Chúa yêu thế gian đến nỗi đã ban Con Một, để ai tin vào Con của Người thì khỏi phải chết, nhưng được sống muôn đời.',
    context: 'Tin Mừng Chúa Giêsu Kitô theo Thánh Gioan',
    category: 'love',
    categoryLabel: 'Tình Yêu Cứu Độ',
    reflection: 'Tình yêu vô biên của Chúa Cha là nền tảng cho niềm tin và sự sống của người Kitô hữu chúng con.'
  },
  {
    id: '1ts-5-16-18',
    reference: '1 Ts 5, 16-18',
    text: 'Hãy vui mừng luôn mãi, hãy cầu nguyện không ngừng, hãy tạ ơn Chúa trong mọi hoàn cảnh.',
    context: 'Thư thứ nhất của Thánh Phaolô gửi tín hữu Thêxalônica',
    category: 'perseverance',
    categoryLabel: 'Tâm Tình Tạ Ơn',
    reflection: 'Con tạ ơn Chúa vì gia đình, cha mẹ, quý dì, quý anh chị Giáo Lý Viên đã tận tình dạy dỗ và yêu thương con.'
  },
  {
    id: 'mt-5-14',
    reference: 'Mt 5, 14.16',
    text: 'Chính anh em là ánh sáng cho trần gian... Ánh sáng của anh em phải chiếu giãi trước mặt thiên hạ, để họ thấy những việc tốt đẹp anh em làm, mà tôn vinh Cha của anh em.',
    context: 'Bài Giảng Trên Núi - Thánh Mát-thêu',
    category: 'faith',
    categoryLabel: 'Làm Chứng Cho Chúa',
    reflection: 'Xin cho đời sống ngoan ngoãn, siêng năng lễ giáo của con trở nên ánh sáng tỏa lan tình thương của Chúa trong xóm đạo.'
  },
  {
    id: 'tv-37-5',
    reference: 'Tv 37, 5',
    text: 'Hãy phó thác đường đời cho Chúa, tin tưởng vào Người, Người sẽ ra tay.',
    context: 'Sách Thánh Vịnh',
    category: 'peace',
    categoryLabel: 'Phó Thác Cho Chúa',
    reflection: 'Trước mỗi kỳ thi hay công việc hàng ngày, con dâng trọn lên bàn tay Chúa gìn giữ và chúc phúc.'
  },
  {
    id: 'ga-14-27',
    reference: 'Ga 14, 27',
    text: 'Thầy để lại bình an cho anh em, Thầy ban cho anh em bình an của Thầy. Thầy ban cho anh em không theo kiểu thế gian ban tặng.',
    context: 'Tin Mừng Chúa Giêsu Kitô theo Thánh Gioan',
    category: 'peace',
    categoryLabel: 'Bình An Của Chúa Kitô',
    reflection: 'Nguyện xin bình an của Đấng Phục Sinh ngự trị trong tâm hồn mỗi học sinh, gia đình và cộng đoàn Giáo họ Tân Vạn.'
  }
];

export const DailyVerse: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize verse based on day of year so it stays consistent per day, but allows switching
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const initialIndex = dayOfYear % CATHOLIC_VERSES.length;
    setCurrentIndex(initialIndex);
  }, []);

  const verse = CATHOLIC_VERSES[currentIndex] || CATHOLIC_VERSES[0];

  const handleNextVerse = () => {
    setIsLoading(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % CATHOLIC_VERSES.length);
      setIsLoading(false);
    }, 200);
  };

  const handleCopy = () => {
    const content = `"${verse.text}"\n— ${verse.reference} (${verse.context})\n\nSuy niệm: ${verse.reflection}\n[Ôn Tập Giáo Lý - Ban Họ Tân Vạn]`;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const textToRead = `${verse.context}. ${verse.text}. Trích ${verse.reference}. Lời nguyện: ${verse.reflection}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9; // Solemn, gentle liturgical reading speed

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = () => {
    const shareText = `"${verse.text}" — ${verse.reference}\nÔn Tập Giáo Lý - Ban Họ Tân Vạn`;
    if (navigator.share) {
      navigator.share({
        title: `Lời Chúa Mỗi Ngày - ${verse.reference}`,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-850 to-amber-950 text-white p-6 sm:p-8 shadow-md border border-amber-900/40">
      {/* Subtle Liturgical Background Details */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full bg-amber-600/5 blur-2xl pointer-events-none" />
      
      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <span className="font-serif text-base font-bold">✝</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                LỜI CHÚA HÔM NAY · SOI SÁNG ĐỨC TIN
              </span>
              <span className="text-stone-400 text-xs hidden sm:inline">·</span>
              <span className="text-stone-300 text-xs hidden sm:inline font-medium">
                {verse.categoryLabel}
              </span>
            </div>
            <p className="text-stone-400 text-xs">
              Mỗi ngày một câu Kinh Thánh đồng hành cùng em học Giáo Lý Họ Tân Vạn
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleSpeak}
            className={`p-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/80'
            }`}
            title={isPlaying ? 'Dừng đọc' : 'Đọc to câu Kinh Thánh'}
          >
            {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isPlaying ? 'Dừng đọc' : 'Đọc Lời Chúa'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/80 text-xs transition-colors flex items-center gap-1.5"
            title="Sao chép câu Kinh Thánh"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/80 text-xs transition-colors flex items-center gap-1.5"
            title="Chia sẻ Lời Chúa"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          <button
            onClick={handleNextVerse}
            disabled={isLoading}
            className="p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs transition-colors flex items-center gap-1.5 active:scale-95"
            title="Xem câu Kinh Thánh khác"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Đổi câu khác</span>
          </button>
        </div>
      </div>

      {/* Main Verse Content */}
      <div className="relative z-10 pt-5 pb-4">
        <div className="flex gap-3 sm:gap-4 items-start">
          <Quote className="w-7 h-7 sm:w-9 sm:h-9 text-amber-500/40 shrink-0 mt-1 rotate-180" />
          <div className="space-y-3 flex-1">
            <blockquote className="font-serif text-lg sm:text-2xl text-stone-100 font-normal leading-relaxed italic">
              "{verse.text}"
            </blockquote>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
              <span className="font-bold text-amber-400 font-display tracking-wide text-base">
                — {verse.reference}
              </span>
              <span className="text-stone-400 text-xs">·</span>
              <span className="text-stone-300 text-xs italic">
                {verse.context}
              </span>
            </div>
          </div>
        </div>

        {/* Reflection Note / Lời Nguyện */}
        <div className="mt-5 p-3.5 sm:p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-start gap-3">
          <Heart className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            <span className="font-semibold text-amber-300 mr-1.5">Gợi ý suy niệm & cầu nguyện:</span>
            <span>{verse.reflection}</span>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="relative z-10 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Kho tàng Lời Chúa · Bản Dịch Phụng Vụ Công Giáo</span>
        </span>
        <span className="font-mono text-stone-400">
          Câu {currentIndex + 1} / {CATHOLIC_VERSES.length}
        </span>
      </div>
    </div>
  );
};
