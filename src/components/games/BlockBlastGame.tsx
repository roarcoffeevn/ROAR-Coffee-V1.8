import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Coins, Flame, Gift, RotateCcw, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { gameSound } from './RoarGamesSound';

type BlockColor = 'cyan' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'pink';

interface PieceDef {
  id: string;
  cells: number[][];
  color: BlockColor;
}

interface TrayPiece extends PieceDef {
  uid: number;
}

interface BlockBlastGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onPlayReal: (useExtraPoints: boolean, score: number) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

const GRID_SIZE = 8;
const BEST_SCORE_STORAGE_KEY = 'roar_block_blast_best';

const COLOR_STYLES: Record<
  BlockColor,
  { face: string; bevel: string; glow: string }
> = {
  cyan: {
    face: 'bg-gradient-to-br from-[#38BDF8] via-[#06B6D4] to-[#0284C7]',
    bevel: 'border-t-[#BAE6FD] border-l-[#7DD3FC] border-b-[#0E7490] border-r-[#0369A1]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  },
  blue: {
    face: 'bg-gradient-to-br from-[#60A5FA] via-[#2563EB] to-[#1D4ED8]',
    bevel: 'border-t-[#BFDBFE] border-l-[#93C5FD] border-b-[#1E3A8A] border-r-[#1E40AF]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
  },
  green: {
    face: 'bg-gradient-to-br from-[#4ADE80] via-[#22C55E] to-[#16A34A]',
    bevel: 'border-t-[#BBF7D0] border-l-[#86EFAC] border-b-[#15803D] border-r-[#166534]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  },
  yellow: {
    face: 'bg-gradient-to-br from-[#FDE047] via-[#FACC15] to-[#EAB308]',
    bevel: 'border-t-[#FEF9C3] border-l-[#FEF08A] border-b-[#A16207] border-r-[#CA8A04]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
  },
  orange: {
    face: 'bg-gradient-to-br from-[#FB923C] via-[#F97316] to-[#EA580C]',
    bevel: 'border-t-[#FED7AA] border-l-[#FDBA74] border-b-[#9A3412] border-r-[#C2410C]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  },
  red: {
    face: 'bg-gradient-to-br from-[#F87171] via-[#EF4444] to-[#DC2626]',
    bevel: 'border-t-[#FECACA] border-l-[#FCA5A5] border-b-[#991B1B] border-r-[#B91C1C]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
  },
  purple: {
    face: 'bg-gradient-to-br from-[#C084FC] via-[#A855F7] to-[#7E22CE]',
    bevel: 'border-t-[#E9D5FF] border-l-[#D8B4FE] border-b-[#581C87] border-r-[#6B21A8]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
  },
  pink: {
    face: 'bg-gradient-to-br from-[#F472B6] via-[#EC4899] to-[#DB2777]',
    bevel: 'border-t-[#FBCFE8] border-l-[#F9A8D4] border-b-[#9D174D] border-r-[#BE185D]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  },
};

const BLOCK_COLORS: BlockColor[] = ['cyan', 'blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];

const SHAPE_TEMPLATES: Array<{ id: string; cells: number[][] }> = [
  { id: 'dot', cells: [[1]] },
  { id: 'h2', cells: [[1, 1]] },
  { id: 'v2', cells: [[1], [1]] },
  { id: 'h3', cells: [[1, 1, 1]] },
  { id: 'v3', cells: [[1], [1], [1]] },
  { id: 'h4', cells: [[1, 1, 1, 1]] },
  { id: 'v4', cells: [[1], [1], [1], [1]] },
  { id: 'h5', cells: [[1, 1, 1, 1, 1]] },
  { id: 'v5', cells: [[1], [1], [1], [1], [1]] },
  { id: 'sq2', cells: [[1, 1], [1, 1]] },
  { id: 'sq3', cells: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { id: 'rect23', cells: [[1, 1, 1], [1, 1, 1]] },
  { id: 'rect32', cells: [[1, 1], [1, 1], [1, 1]] },
  { id: 'sl1', cells: [[1, 0], [1, 1]] },
  { id: 'sl2', cells: [[0, 1], [1, 1]] },
  { id: 'sl3', cells: [[1, 1], [1, 0]] },
  { id: 'sl4', cells: [[1, 1], [0, 1]] },
  { id: 'bl1', cells: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { id: 'bl2', cells: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { id: 'bl3', cells: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { id: 'bl4', cells: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
  { id: 't1', cells: [[1, 1, 1], [0, 1, 0]] },
  { id: 't2', cells: [[0, 1, 0], [1, 1, 1]] },
  { id: 's1', cells: [[0, 1, 1], [1, 1, 0]] },
  { id: 'z1', cells: [[1, 1, 0], [0, 1, 1]] },
];

function createEmptyGrid(): (BlockColor | null)[][] {
  return Array.from({ length: GRID_SIZE }, () => Array<BlockColor | null>(GRID_SIZE).fill(null));
}

function cloneGrid(grid: (BlockColor | null)[][]): (BlockColor | null)[][] {
  return grid.map((row) => [...row]);
}

function canPlacePiece(grid: (BlockColor | null)[][], cells: number[][], row: number, col: number): boolean {
  const h = cells.length;
  const w = cells[0].length;
  if (row < 0 || col < 0 || row + h > GRID_SIZE || col + w > GRID_SIZE) return false;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (cells[r][c] && grid[row + r][col + c] !== null) return false;
    }
  }
  return true;
}

function canPieceFitAnywhere(grid: (BlockColor | null)[][], cells: number[][]): boolean {
  const h = cells.length;
  const w = cells[0].length;
  for (let r = 0; r <= GRID_SIZE - h; r++) {
    for (let c = 0; c <= GRID_SIZE - w; c++) {
      if (canPlacePiece(grid, cells, r, c)) return true;
    }
  }
  return false;
}

function pickDistinctColors(count: number): BlockColor[] {
  const pool = [...BLOCK_COLORS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function dealTray(grid: (BlockColor | null)[][], uidCounter: React.MutableRefObject<number>): (TrayPiece | null)[] {
  const colors = pickDistinctColors(3);
  const makeRandomPiece = (color: BlockColor): TrayPiece => {
    const tpl = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
    uidCounter.current += 1;
    return { ...tpl, color, uid: uidCounter.current };
  };

  const hand: TrayPiece[] = [
    makeRandomPiece(colors[0]),
    makeRandomPiece(colors[1]),
    makeRandomPiece(colors[2]),
  ];
  if (hand.some((p) => canPieceFitAnywhere(grid, p.cells))) {
    return hand;
  }
  const fitting = SHAPE_TEMPLATES.filter((t) => canPieceFitAnywhere(grid, t.cells));
  if (fitting.length > 0) {
    const chosen = fitting[Math.floor(Math.random() * fitting.length)];
    uidCounter.current += 1;
    hand[1] = { ...chosen, color: colors[1], uid: uidCounter.current };
  }
  return hand;
}

function findLinesToClear(grid: (BlockColor | null)[][]) {
  const fullRows: number[] = [];
  const fullCols: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every((cell) => cell !== null)) fullRows.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let colFull = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        colFull = false;
        break;
      }
    }
    if (colFull) fullCols.push(c);
  }
  return { fullRows, fullCols };
}

export const BlockBlastGame: React.FC<BlockBlastGameProps> = ({
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
  const targetScore = config?.min_score_to_win || 300;
  const costPts = config?.extra_play_cost_points || 20;

  const pieceSeqRef = useRef(1);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const [grid, setGrid] = useState<(BlockColor | null)[][]>(() => createEmptyGrid());
  const [tray, setTray] = useState<(TrayPiece | null)[]>(() => dealTray(createEmptyGrid(), pieceSeqRef));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(window.localStorage.getItem(BEST_SCORE_STORAGE_KEY) || 0);
    } catch {
      return 0;
    }
  });
  const [combo, setCombo] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [clearingSet, setClearingSet] = useState<Set<string>>(() => new Set());
  const [comboBanner, setComboBanner] = useState<{ text: string; key: number } | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);

  const [dragState, setDragState] = useState<{
    slotIndex: number;
    piece: TrayPiece;
    pointerId: number;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    isTouch: boolean;
    activeDrag: boolean;
    cellSize: number;
  } | null>(null);

  const [hoverPlacement, setHoverPlacement] = useState<{
    row: number;
    col: number;
    valid: boolean;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const updateBestScore = useCallback((nextScore: number) => {
    setBestScore((prev) => {
      const updated = Math.max(prev, nextScore);
      if (updated > prev) {
        try {
          window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(updated));
        } catch {
          // ignore storage errors
        }
      }
      return updated;
    });
  }, []);

  const resetGame = useCallback(() => {
    if (clearTimerRef.current) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    const freshGrid = createEmptyGrid();
    setGrid(freshGrid);
    setTray(dealTray(freshGrid, pieceSeqRef));
    setScore(0);
    setCombo(0);
    setPhase('playing');
    setSelectedSlot(null);
    setClearingSet(new Set());
    setComboBanner(null);
    setClaimed(false);
    setDragState(null);
    setHoverPlacement(null);
  }, []);

  const commitPlacePiece = useCallback(
    (slotIndex: number, targetRow: number, targetCol: number) => {
      if (phase !== 'playing') return false;
      const piece = tray[slotIndex];
      if (!piece || !canPlacePiece(grid, piece.cells, targetRow, targetCol)) return false;

      const nextGrid = cloneGrid(grid);
      let placedCellCount = 0;
      for (let r = 0; r < piece.cells.length; r++) {
        for (let c = 0; c < piece.cells[0].length; c++) {
          if (piece.cells[r][c]) {
            nextGrid[targetRow + r][targetCol + c] = piece.color;
            placedCellCount += 1;
          }
        }
      }

      const { fullRows, fullCols } = findLinesToClear(nextGrid);
      const lineCount = fullRows.length + fullCols.length;
      const nextCombo = lineCount > 0 ? combo + 1 : 0;
      const basePts = placedCellCount * 5;
      const clearPts =
        lineCount > 0
          ? Math.round(lineCount * 40 * (1 + (nextCombo - 1) * 0.5) + (lineCount >= 2 ? (lineCount - 1) * 30 : 0))
          : 0;
      const nextScore = score + basePts + clearPts;

      setScore(nextScore);
      setCombo(nextCombo);
      updateBestScore(nextScore);
      setSelectedSlot(null);
      setHoverPlacement(null);

      let nextTray = tray.map((item, idx) => (idx === slotIndex ? null : item));
      const allPlaced = nextTray.every((item) => item === null);

      if (lineCount > 0) {
        gameSound.clearLine(nextCombo);
        const toFlash = new Set<string>();
        for (const r of fullRows) {
          for (let c = 0; c < GRID_SIZE; c++) toFlash.add(`${r}-${c}`);
        }
        for (const c of fullCols) {
          for (let r = 0; r < GRID_SIZE; r++) toFlash.add(`${r}-${c}`);
        }
        setGrid(nextGrid);
        setClearingSet(toFlash);

        const bannerLabel =
          nextCombo > 1
            ? `COMBO x${nextCombo}! +${basePts + clearPts}`
            : lineCount >= 2
              ? `${lineCount}x LINE CLEAR! +${basePts + clearPts}`
              : `+${basePts + clearPts}`;
        setComboBanner({ text: bannerLabel, key: Date.now() });
        if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = window.setTimeout(() => setComboBanner(null), 1100);

        const clearedGrid = cloneGrid(nextGrid);
        for (const r of fullRows) {
          for (let c = 0; c < GRID_SIZE; c++) clearedGrid[r][c] = null;
        }
        for (const c of fullCols) {
          for (let r = 0; r < GRID_SIZE; r++) clearedGrid[r][c] = null;
        }
        if (allPlaced) {
          nextTray = dealTray(clearedGrid, pieceSeqRef);
        }
        setTray(nextTray);

        if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = window.setTimeout(() => {
          setGrid(clearedGrid);
          setClearingSet(new Set());
          const canContinue = nextTray.some((p) => p !== null && canPieceFitAnywhere(clearedGrid, p.cells));
          if (!canContinue) {
            gameSound.gameOver();
            setPhase('ended');
          }
        }, 210);
      } else {
        gameSound.placeBlock();
        setGrid(nextGrid);
        if (allPlaced) {
          nextTray = dealTray(nextGrid, pieceSeqRef);
        }
        setTray(nextTray);
        const canContinue = nextTray.some((p) => p !== null && canPieceFitAnywhere(nextGrid, p.cells));
        if (!canContinue) {
          gameSound.gameOver();
          setPhase('ended');
        }
      }

      if (score < targetScore && nextScore >= targetScore) {
        gameSound.win();
      }
      return true;
    },
    [combo, grid, phase, score, targetScore, tray, updateBestScore]
  );

  const computeGridTargetFromPointer = useCallback(
    (clientX: number, clientY: number, isTouch: boolean, piece: TrayPiece) => {
      const boardEl = boardRef.current;
      if (!boardEl) return null;
      const rect = boardEl.getBoundingClientRect();
      const cellSize = rect.width / GRID_SIZE;
      const liftY = isTouch ? 56 : 0;
      const centerX = clientX;
      const centerY = clientY - liftY;
      const pieceW = piece.cells[0].length * cellSize;
      const pieceH = piece.cells.length * cellSize;
      const topLeftX = centerX - pieceW / 2;
      const topLeftY = centerY - pieceH / 2;

      const col = Math.round((topLeftX - rect.left) / cellSize);
      const row = Math.round((topLeftY - rect.top) / cellSize);
      const nearBoard =
        centerX >= rect.left - cellSize &&
        centerX <= rect.right + cellSize &&
        centerY >= rect.top - cellSize &&
        centerY <= rect.bottom + cellSize;

      if (!nearBoard) return null;
      return {
        row,
        col,
        valid: canPlacePiece(grid, piece.cells, row, col),
      };
    },
    [grid]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      const activeDrag = dragState.activeDrag || dist > 6;
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              activeDrag,
            }
          : null
      );
      if (activeDrag) {
        const target = computeGridTargetFromPointer(e.clientX, e.clientY, dragState.isTouch, dragState.piece);
        setHoverPlacement(target);
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      if (dragState.activeDrag) {
        const target = computeGridTargetFromPointer(e.clientX, e.clientY, dragState.isTouch, dragState.piece);
        if (target?.valid) {
          commitPlacePiece(dragState.slotIndex, target.row, target.col);
        } else {
          setHoverPlacement(null);
        }
      } else {
        setSelectedSlot((prev) => (prev === dragState.slotIndex ? null : dragState.slotIndex));
        setHoverPlacement(null);
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [commitPlacePiece, computeGridTargetFromPointer, dragState]);

  const handleBoardCellTap = (r: number, c: number) => {
    if (phase !== 'playing' || selectedSlot === null) return;
    const piece = tray[selectedSlot];
    if (!piece) return;
    const h = piece.cells.length;
    const w = piece.cells[0].length;
    const centerR = r - Math.floor(h / 2);
    const centerC = c - Math.floor(w / 2);
    const candidates: Array<[number, number]> = [
      [centerR, centerC],
      [r, c],
      [centerR, Math.max(0, Math.min(GRID_SIZE - w, centerC))],
      [Math.max(0, Math.min(GRID_SIZE - h, centerR)), Math.max(0, Math.min(GRID_SIZE - w, centerC))],
    ];
    for (const [cr, cc] of candidates) {
      if (canPlacePiece(grid, piece.cells, cr, cc)) {
        commitPlacePiece(selectedSlot, cr, cc);
        return;
      }
    }
  };

  const activeDraggedPiece = dragState?.activeDrag ? dragState.piece : null;
  const previewMeta = useMemo(() => {
    const ghostKeys = new Set<string>();
    const clearHighlightKeys = new Set<string>();
    if (!activeDraggedPiece || !hoverPlacement) {
      return { ghostKeys, clearHighlightKeys, valid: false, color: null as BlockColor | null };
    }
    const { row, col, valid } = hoverPlacement;
    for (let pr = 0; pr < activeDraggedPiece.cells.length; pr++) {
      for (let pc = 0; pc < activeDraggedPiece.cells[0].length; pc++) {
        if (!activeDraggedPiece.cells[pr][pc]) continue;
        const gr = row + pr;
        const gc = col + pc;
        if (gr >= 0 && gr < GRID_SIZE && gc >= 0 && gc < GRID_SIZE) {
          ghostKeys.add(`${gr}-${gc}`);
        }
      }
    }
    if (valid) {
      const sim = cloneGrid(grid);
      for (let pr = 0; pr < activeDraggedPiece.cells.length; pr++) {
        for (let pc = 0; pc < activeDraggedPiece.cells[0].length; pc++) {
          if (activeDraggedPiece.cells[pr][pc]) {
            sim[row + pr][col + pc] = activeDraggedPiece.color;
          }
        }
      }
      const { fullRows, fullCols } = findLinesToClear(sim);
      for (const fr of fullRows) {
        for (let cc = 0; cc < GRID_SIZE; cc++) clearHighlightKeys.add(`${fr}-${cc}`);
      }
      for (const fc of fullCols) {
        for (let rr = 0; rr < GRID_SIZE; rr++) clearHighlightKeys.add(`${rr}-${fc}`);
      }
    }
    return { ghostKeys, clearHighlightKeys, valid, color: activeDraggedPiece.color };
  }, [activeDraggedPiece, grid, hoverPlacement]);

  const handleClaim = async (useExtraPoints = false) => {
    if (claimed || claiming || score < targetScore) return;
    if (!isSignedIn) {
      const pool = rewards.filter((r) => r.active);
      if (pool.length > 0) {
        onDemoResult(pool[Math.floor(Math.random() * pool.length)]);
        setClaimed(true);
      }
      return;
    }
    setClaiming(true);
    try {
      const res = await onPlayReal(useExtraPoints, score);
      if (res?.won) {
        gameSound.win();
        setClaimed(true);
      }
    } finally {
      setClaiming(false);
    }
  };

  const canFree = remainingFreeToday > 0;
  const reachedGoal = score >= targetScore;
  const progressPct = Math.min(100, Math.round((score / Math.max(1, targetScore)) * 100));

  return (
    <div className="space-y-2.5 sm:space-y-3.5 w-full min-w-0 select-none">
      {/* Compact Score & Controls HUD */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-bold tabular-nums">
          <div className="flex items-center gap-1">
            <span className="text-[#202020]/65 dark:text-[#F1EFEA]/65">{lang === 'en' ? 'Score' : 'Điểm'}:</span>
            <span className={`text-sm sm:text-base font-extrabold ${reachedGoal ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#111111] dark:text-white'}`}>
              {score}
            </span>
            <span className="text-[10px] text-[#202020]/50 dark:text-[#F1EFEA]/50">/ {targetScore}</span>
          </div>

          <div className="flex items-center gap-1 text-[#8C6D32] dark:text-[#C6A667]">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span>{bestScore}</span>
          </div>

          {combo > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
              <Flame className="w-3 h-3" />
              x{combo}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              gameSound.muted = !muted;
              setMuted(gameSound.muted);
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 rounded-lg border border-[#202020]/15 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={resetGame}
            aria-label={lang === 'en' ? 'Restart' : 'Chơi lại'}
            title={lang === 'en' ? 'Restart' : 'Chơi lại'}
            className="px-2.5 h-8 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'en' ? 'Restart' : 'Chơi lại'}</span>
          </button>
        </div>
      </div>

      {/* Slim Goal Progress + Instant Claim Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-[#202020]/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              reachedGoal ? 'bg-gradient-to-r from-[#22C55E] via-[#FACC15] to-[#06B6D4]' : 'bg-[#00552B] dark:bg-[#C6A667]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {reachedGoal && !claimed && phase === 'playing' && (
          !isSignedIn ? (
            <button
              type="button"
              onClick={() => handleClaim(false)}
              className="px-2.5 py-1 rounded-lg bg-[#C6A667] text-[#111111] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'en' ? 'Preview Prize' : 'Nhận Thử Quà'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={claiming || (!canFree && userPoints < costPts)}
              onClick={() => handleClaim(!canFree)}
              className="px-2.5 py-1 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
            >
              <Gift className="w-3 h-3 text-[#C6A667]" />
              <span>
                {claiming
                  ? '...'
                  : canFree
                    ? lang === 'en'
                      ? 'Claim Reward!'
                      : 'Nhận Quà Ngay!'
                    : lang === 'en'
                      ? `Claim (-${costPts} pts)`
                      : `Nhận Quà (-${costPts}đ)`}
              </span>
            </button>
          )
        )}
      </div>

      {/* Classic Block Blast 8x8 Navy Board */}
      <div className="relative w-full max-w-[min(84vw,298px)] sm:max-w-[348px] aspect-square mx-auto">
        <div
          ref={boardRef}
          className="w-full h-full rounded-2xl bg-[#161F36] border-[3px] border-[#2C3A61] p-1.5 sm:p-2 shadow-xl grid grid-cols-8 grid-rows-8 gap-1 touch-none"
        >
          {grid.map((rowArr, r) =>
            rowArr.map((cellColor, c) => {
              const key = `${r}-${c}`;
              const isClearing = clearingSet.has(key);
              const isGhost = previewMeta.ghostKeys.has(key);
              const isClearPreview = previewMeta.clearHighlightKeys.has(key);

              const activeStyle = cellColor ? COLOR_STYLES[cellColor] : null;
              const ghostStyle = previewMeta.color ? COLOR_STYLES[previewMeta.color] : null;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleBoardCellTap(r, c)}
                  aria-label={`Row ${r + 1} Column ${c + 1}`}
                  className={`relative rounded-[5px] sm:rounded-[6px] transition-all duration-100 overflow-hidden ${
                    selectedSlot !== null && !cellColor ? 'cursor-pointer hover:ring-1 hover:ring-[#38BDF8]/80' : 'cursor-default'
                  } ${
                    isClearing
                      ? 'bg-white scale-90 opacity-35'
                      : activeStyle
                        ? `${activeStyle.face} border-2 ${activeStyle.bevel} ${activeStyle.glow}`
                        : isGhost
                          ? previewMeta.valid && ghostStyle
                            ? `${ghostStyle.face} border-2 ${ghostStyle.bevel} opacity-55`
                            : 'bg-red-500/40 ring-1 ring-red-400/80'
                          : 'bg-[#0E1526] border border-[#232F4E]'
                  } ${isClearPreview ? 'ring-2 ring-white brightness-125 animate-pulse' : ''}`}
                >
                  {(activeStyle || (isGhost && previewMeta.valid)) && !isClearing && (
                    <span className="absolute inset-[18%] rounded-[2px] bg-white/15 pointer-events-none" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Floating Combo / Score Burst */}
        {comboBanner && (
          <div
            key={comboBanner.key}
            className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-gradient-to-r from-[#FACC15] to-[#F97316] text-[#111111] text-xs font-extrabold tracking-wide shadow-lg animate-bounce whitespace-nowrap"
          >
            {comboBanner.text}
          </div>
        )}

        {/* Game Over Overlay */}
        {phase === 'ended' && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-[#0B1020]/82 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center text-white">
            <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#FACC15] mb-1">
              {reachedGoal
                ? lang === 'en'
                  ? 'PUZZLE GOAL CLEARED!'
                  : 'VƯỢT MỐC NHẬN THƯỞNG!'
                : lang === 'en'
                  ? 'NO MORE MOVES · GAME OVER'
                  : 'HẾT NƯỚC ĐI · KẾT THÚC'}
            </div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums mb-1">{score} pts</div>
            <p className="text-[11px] sm:text-xs text-white/80 max-w-[240px] mb-3">
              {reachedGoal
                ? claimed
                  ? lang === 'en'
                    ? 'Reward claimed! Play another round to beat your high score.'
                    : 'Đã ghi nhận quà! Chơi ván mới để phá kỷ lục ngay.'
                  : lang === 'en'
                    ? `You reached ${targetScore}+ pts! Claim your ROAR gift now.`
                    : `Đạt ${targetScore}+ điểm! Nhận quà ROAR thật ngay nhé.`
                : lang === 'en'
                  ? `Need ${targetScore} pts to unlock a reward. Try again!`
                  : `Cần ${targetScore}+ điểm để mở khóa quà. Thử lại nhé!`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {reachedGoal && !claimed && (
                !isSignedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleClaim(false)}
                      className="px-3.5 py-2 rounded-xl bg-[#FACC15] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Preview Prize' : 'Xem Thử Quà'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                    >
                      {lang === 'en' ? 'Sign In' : 'Đăng nhập'}
                    </button>
                  </>
                ) : canFree ? (
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => handleClaim(false)}
                    className="px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{claiming ? '...' : lang === 'en' ? 'Claim Reward' : 'Nhận Quà Ngay'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={claiming || userPoints < costPts}
                    onClick={() => handleClaim(true)}
                    className="px-4 py-2 rounded-xl bg-[#FACC15] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>{lang === 'en' ? `Claim (-${costPts} pts)` : `Nhận Quà (-${costPts}đ)`}</span>
                  </button>
                )
              )}
              <button
                type="button"
                onClick={resetGame}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Play Again' : 'Chơi Lại'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3-Piece Polyomino Dock */}
      <div className="w-full max-w-[348px] mx-auto grid grid-cols-3 gap-2">
        {tray.map((piece, idx) => {
          const isBeingDragged = dragState?.activeDrag && dragState.slotIndex === idx;
          const isSelected = selectedSlot === idx;
          const fits = piece ? canPieceFitAnywhere(grid, piece.cells) : false;

          return (
            <div
              key={idx}
              onPointerDown={(e) => {
                if (!piece || phase !== 'playing') return;
                e.preventDefault();
                const boardWidth = boardRef.current?.getBoundingClientRect().width || 298;
                setDragState({
                  slotIndex: idx,
                  piece,
                  pointerId: e.pointerId,
                  clientX: e.clientX,
                  clientY: e.clientY,
                  startX: e.clientX,
                  startY: e.clientY,
                  isTouch: e.pointerType === 'touch',
                  activeDrag: false,
                  cellSize: boardWidth / GRID_SIZE,
                });
              }}
              className={`h-[76px] sm:h-[88px] rounded-xl border flex items-center justify-center p-2 transition-all touch-none select-none ${
                !piece
                  ? 'bg-[#161F36]/40 border-dashed border-[#2C3A61]/45'
                  : isSelected
                    ? 'bg-[#1C2847] border-2 border-[#38BDF8] shadow-md cursor-grab'
                    : fits
                      ? 'bg-[#161F36] border-[#2C3A61] hover:border-[#38BDF8]/70 cursor-grab active:cursor-grabbing'
                      : 'bg-[#161F36]/55 border-[#2C3A61]/40 opacity-45'
              }`}
            >
              {piece && !isBeingDragged && (
                <div
                  className="grid gap-[2px] pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${piece.cells[0].length}, minmax(0, 1fr))`,
                  }}
                >
                  {piece.cells.map((rowArr, r) =>
                    rowArr.map((filled, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`relative w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] rounded-[3px] ${
                          filled
                            ? `${COLOR_STYLES[piece.color].face} border ${COLOR_STYLES[piece.color].bevel} ${COLOR_STYLES[piece.color].glow}`
                            : 'bg-transparent'
                        }`}
                      >
                        {filled && <span className="absolute inset-[20%] rounded-[1px] bg-white/15" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle instruction line */}
      <p className="text-center text-[10px] sm:text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 leading-tight">
        {selectedSlot !== null
          ? lang === 'en'
            ? 'Tap any square on the 8×8 board to place the selected block.'
            : 'Chạm vào ô bất kỳ trên bảng 8×8 để đặt khối đã chọn.'
          : lang === 'en'
            ? 'Drag & drop blocks onto the 8×8 grid (or tap piece then tap board).'
            : 'Kéo thả khối vào bảng 8×8 (hoặc chạm chọn khối rồi chạm ô để đặt).'}
      </p>

      {/* Floating Dragged Polyomino Overlay */}
      {dragState?.activeDrag && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragState.clientX,
            top: dragState.clientY - (dragState.isTouch ? 56 : 0),
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="grid gap-[3px] drop-shadow-2xl"
            style={{
              gridTemplateColumns: `repeat(${dragState.piece.cells[0].length}, ${Math.max(24, dragState.cellSize - 4)}px)`,
            }}
          >
            {dragState.piece.cells.map((rowArr, r) =>
              rowArr.map((filled, c) => {
                const sz = Math.max(24, dragState.cellSize - 4);
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{ width: sz, height: sz }}
                    className={`relative rounded-[5px] ${
                      filled
                        ? `${COLOR_STYLES[dragState.piece.color].face} border-2 ${COLOR_STYLES[dragState.piece.color].bevel} ${COLOR_STYLES[dragState.piece.color].glow}`
                        : 'bg-transparent'
                    }`}
                  >
                    {filled && <span className="absolute inset-[18%] rounded-[2px] bg-white/15" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
