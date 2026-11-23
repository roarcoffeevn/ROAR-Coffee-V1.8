import React, { useState } from 'react';
import { Coins, Gift, PackageOpen, RotateCcw, Sparkles } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { gameSound } from './RoarGamesSound';

interface MysteryBoxGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onPlayReal: (useExtraPoints: boolean) => Promise<{ reward?: GameRewardRecord } | null>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

export const MysteryBoxGame: React.FC<MysteryBoxGameProps> = ({
  lang,
  config,
  rewards,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  onPlayReal,
  onRequireLogin,
  onDemoResult,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [opening, setOpening] = useState(false);
  const [revealedReward, setRevealedReward] = useState<GameRewardRecord | null>(null);
  const [useExtraMode, setUseExtraMode] = useState(false);

  const costPts = config?.extra_play_cost_points || 40;
  const canFree = remainingFreeToday > 0;
  const pool = rewards.filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0));

  const handleOpenBox = async (idx: number) => {
    if (opening || selectedIdx !== null || pool.length === 0) return;

    if (!isSignedIn) {
      setSelectedIdx(idx);
      setOpening(true);
      gameSound.flip();
      window.setTimeout(() => {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setRevealedReward(picked);
        setOpening(false);
        gameSound.win();
        onDemoResult(picked);
      }, 650);
      return;
    }

    if (!canFree && !useExtraMode) return;

    setSelectedIdx(idx);
    setOpening(true);
    gameSound.flip();

    const res = await onPlayReal(!canFree && useExtraMode);
    if (res?.reward) {
      window.setTimeout(() => {
        setRevealedReward(res.reward!);
        setOpening(false);
        setUseExtraMode(false);
        gameSound.win();
      }, 600);
    } else {
      setSelectedIdx(null);
      setOpening(false);
    }
  };

  const resetBoxes = () => {
    setSelectedIdx(null);
    setRevealedReward(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[#202020]/75 dark:text-[#F1EFEA]/75">
          {isSignedIn
            ? canFree
              ? lang === 'en'
                ? `Pick 1 of 3 champagne chests (${remainingFreeToday} free left today)`
                : `Chọn 1 trong 3 hộp quà vàng champagne (còn ${remainingFreeToday} lượt miễn phí hôm nay)`
              : lang === 'en'
                ? `Daily free box opened. Unlock an extra chest for ${costPts} pts.`
                : `Đã hết lượt mở miễn phí hôm nay. Bạn có thể mở thêm bằng ${costPts} điểm.`
            : lang === 'en'
              ? 'Demo preview · Sign in to claim real Reserve Coffee gifts!'
              : 'Chế độ mở thử · Đăng nhập để rinh thật hộp Signature Reserve 490.000₫!'}
        </span>

        {selectedIdx !== null && !opening && (
          <button
            type="button"
            onClick={resetBoxes}
            className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Reset Chests' : 'Đặt Lại Hộp'}</span>
          </button>
        )}
      </div>

      {isSignedIn && !canFree && !useExtraMode && selectedIdx === null && (
        <div className="p-4 rounded-xl bg-[#C6A667]/15 border border-[#C6A667]/40 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#202020] dark:text-[#F8F5EF]">
            {lang === 'en'
              ? `Use ${costPts} ROAR Points to unlock another Mystery Chest right now.`
              : `Dùng ${costPts} điểm ROAR để mở khóa thêm 1 lượt chọn Hộp Quà Bí Ẩn ngay.`}
          </span>
          <button
            type="button"
            disabled={userPoints < costPts}
            onClick={() => setUseExtraMode(true)}
            className="px-4 py-2 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Coins className="w-4 h-4" />
            <span>{lang === 'en' ? `Unlock (-${costPts} pts)` : `Mở Khóa (-${costPts} điểm)`}</span>
          </button>
        </div>
      )}

      {/* 3 Interactive Mystery Chests */}
      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[0, 1, 2].map((idx) => {
          const isChosen = selectedIdx === idx;
          const isLockedOut = isSignedIn && !canFree && !useExtraMode && selectedIdx === null;
          return (
            <button
              key={idx}
              type="button"
              disabled={opening || (selectedIdx !== null && !isChosen) || isLockedOut}
              onClick={() => handleOpenBox(idx)}
              className={`group rounded-2xl p-6 border transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[196px] ${
                isChosen && revealedReward
                  ? 'bg-[#00552B] text-white border-[#C6A667] shadow-xl scale-[1.02]'
                  : isChosen && opening
                    ? 'bg-[#C6A667]/25 border-[#C6A667] scale-95'
                    : isLockedOut
                      ? 'bg-[#F8F5EF]/60 dark:bg-[#0E1512]/60 border-[#202020]/10 dark:border-white/10 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-b from-[#F8F5EF] to-[#EDE5D4] dark:from-[#1A2821] dark:to-[#111B16] border-[#C6A667]/50 hover:border-[#C6A667] hover:-translate-y-1 shadow-sm cursor-pointer'
              }`}
            >
              {isChosen && revealedReward ? (
                <>
                  <PackageOpen className="w-10 h-10 text-[#C6A667] mb-3" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A667]">
                    {lang === 'en' ? revealedReward.badge_en : revealedReward.badge_vi}
                  </span>
                  <span className="mt-1 font-serif text-base font-bold leading-snug">
                    {lang === 'en' ? revealedReward.label_en : revealedReward.label_vi}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[#00552B] text-[#C6A667] flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                    {opening && isChosen ? (
                      <Sparkles className="w-8 h-8 animate-spin" />
                    ) : (
                      <Gift className="w-8 h-8" />
                    )}
                  </div>
                  <span className="font-serif text-base font-bold text-[#111111] dark:text-[#F8F5EF]">
                    {lang === 'en' ? `Reserve Box #${idx + 1}` : `Hộp Bí Ẩn #${idx + 1}`}
                  </span>
                  <span className="mt-1 text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
                    {lang === 'en' ? 'Tap to unbox' : 'Chạm để mở hộp'}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {!isSignedIn && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onRequireLogin}
            className="px-5 py-2.5 rounded-xl border border-[#C6A667] text-[#8C6D32] dark:text-[#C6A667] text-xs font-bold inline-flex items-center gap-2 hover:bg-[#C6A667]/10 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>{lang === 'en' ? 'Sign In to Keep Real Rewards' : 'Đăng nhập để Nhận Thưởng Thật'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
