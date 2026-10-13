import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppTab } from '../types/catechism';
import { BookOpen, GraduationCap, CheckCircle2, Award, UploadCloud, Share2, Check, ArrowDownToLine, Volume2, VolumeX, QrCode } from 'lucide-react';
import { isSoundEnabled, toggleSound, playCorrectChime } from '../services/soundEffects';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  totalQuestionsCount: number;
  onOpenDownload?: (tab?: 'app' | 'materials' | 'link') => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: 'classes', label: 'Chọn Lớp' },
  { id: 'qa', label: 'Hỏi & Trả Lời', icon: BookOpen },
  { id: 'practice', label: 'Ôn Tập', icon: GraduationCap },
  { id: 'exam', label: 'Thi Thử', icon: Award },
  { id: 'results', label: 'BGL Kiểm Tra', icon: CheckCircle2 },
  { id: 'materials', label: 'Tải Tài Liệu', icon: UploadCloud },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  totalQuestionsCount,
  onOpenDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
    if (next) {
      playCorrectChime();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText('https://ais-pre-krph32zhpf4cxfd3ta5d2d-860545552666.asia-southeast1.run.app');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onOpenDownload) {
      onOpenDownload('link');
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-amber-900/40 shadow-md">
      {/* Top sacred accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* Strictly adheres to 3-zone Top Bar Contract: Brand - 4-5 single line links - 1 Primary Action */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark with Cross icon */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onSelectTab('classes')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-sm ring-1 ring-amber-400/30">
              <span className="font-serif font-black text-lg select-none">✝</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-amber-200 font-brand uppercase leading-none whitespace-nowrap">
                ÔN TẬP GIÁO LÝ
              </span>
              <span className="text-[11px] text-amber-400/90 tracking-wider font-bold uppercase mt-0.5 whitespace-nowrap">
                BGL HỌ TÂN VẠN
              </span>
            </div>
          </div>

          {/* Zone 2: Concise single-line navigation links with animated active tab indicator */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer select-none ${
                    isActive
                      ? 'text-amber-200 font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopActiveTabIndicator"
                      className="absolute inset-0 bg-amber-950/80 border border-amber-500/50 rounded-md -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  {Icon && <Icon className="w-3.5 h-3.5 text-amber-400/90" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Share Link, Download & Primary Action button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onOpenDownload && (
              <button
                onClick={() => onOpenDownload('app')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs rounded-lg shadow-sm border border-amber-400/40 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 cursor-pointer ring-1 ring-amber-400/20"
                title="Tải ứng dụng và tài liệu về máy tính & điện thoại bằng 1 cú nhấp"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-white" />
                <span>Tải về máy <span className="hidden sm:inline font-normal opacity-90">(1 cú nhấp)</span></span>
              </button>
            )}

            <button
              onClick={handleToggleSound}
              className={`p-1.5 sm:px-2.5 sm:py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                soundOn
                  ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-amber-500/30'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border-stone-700'
              }`}
              title={soundOn ? 'Âm thanh: Đang Bật (chuông khen và nhạc hoàn thành)' : 'Âm thanh: Đang Tắt'}
            >
              {soundOn ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span className="hidden lg:inline">{soundOn ? 'Âm thanh' : 'Tắt tiếng'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs rounded-lg border border-amber-500/40 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              title="Mã QR quét tự động & kiểm tra đường link công khai mở trên mọi máy"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{copied ? 'Đã chép link' : 'Mã QR & Link'}</span>
            </button>

            <button
              onClick={() => onSelectTab('exam')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs sm:text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 active:scale-95"
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-900" />
              <span>Thi Thử Ngay</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row with Smooth Animated Indicator & QR Code Access */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-stone-800 text-xs overflow-x-auto gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative px-2.5 py-1 rounded whitespace-nowrap transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-amber-200 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTabIndicator"
                    className="absolute inset-0 bg-stone-800 border border-amber-500/40 rounded -z-10 shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={handleShare}
            className="px-2 py-1 rounded whitespace-nowrap text-stone-300 hover:text-amber-300 bg-stone-800/80 border border-stone-700 flex items-center gap-1 active:scale-95 cursor-pointer ml-1"
            title="Mở mã QR quét tự động"
          >
            <QrCode className="w-3 h-3 text-amber-400" />
            <span>Mã QR</span>
          </button>
          {onOpenDownload && (
            <button
              onClick={() => onOpenDownload('app')}
              className="px-2 py-1 rounded whitespace-nowrap text-amber-300 font-bold bg-amber-900/80 border border-amber-500/50 flex items-center gap-1 active:scale-95 cursor-pointer ml-0.5"
            >
              <ArrowDownToLine className="w-3 h-3 text-amber-300" />
              <span>Tải về</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
