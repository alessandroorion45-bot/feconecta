import { memo, useCallback } from 'react';
import { CellPosition } from '@/hooks/useWordSearchGame';

interface WordSearchGridProps {
  grid: string[][];
  selectedCells: CellPosition[];
  foundWords: string[];
  placements: { word: string; startRow: number; startCol: number; direction: [number, number]; found: boolean }[];
  revealedCells: Set<string>;
  isSelecting: boolean;
  isPaused: boolean;
  onCellPointerDown: (row: number, col: number) => void;
  onCellPointerEnter: (row: number, col: number) => void;
  onPointerUp: () => void;
}

const WordSearchGrid = memo(({
  grid,
  selectedCells,
  placements,
  revealedCells,
  isSelecting,
  isPaused,
  onCellPointerDown,
  onCellPointerEnter,
  onPointerUp,
}: WordSearchGridProps) => {
  const gridSize = grid.length;

  const foundCellSet = new Set<string>();
  placements.forEach(p => {
    if (p.found) {
      for (let i = 0; i < p.word.length; i++) {
        foundCellSet.add(`${p.startRow + p.direction[0] * i}-${p.startCol + p.direction[1] * i}`);
      }
    }
  });

  const selectedSet = new Set(selectedCells.map(c => `${c.row}-${c.col}`));

  const getCellClass = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    if (foundCellSet.has(key)) return 'pv-cell-found';
    if (selectedSet.has(key)) return 'pv-cell-selected';
    if (revealedCells.has(key)) return 'pv-cell-revealed';
    return 'pv-cell-default';
  }, [selectedSet, foundCellSet, revealedCells]);

  // Bigger cells - 30% increase
  const cellSize = gridSize <= 8 ? 'pv-cell-xl' : gridSize <= 10 ? 'pv-cell-lg' : gridSize <= 12 ? 'pv-cell-md' : 'pv-cell-sm';

  return (
    <div
      className={`pv-grid-wrapper ${isPaused ? 'pv-grid-paused' : ''}`}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="pv-grid"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {grid.map((row, rIdx) =>
          row.map((letter, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              className={`pv-cell ${cellSize} ${getCellClass(rIdx, cIdx)}`}
              disabled={isPaused}
              onPointerDown={(e) => {
                e.preventDefault();
                if (!isPaused) onCellPointerDown(rIdx, cIdx);
              }}
              onPointerEnter={() => {
                if (isSelecting && !isPaused) onCellPointerEnter(rIdx, cIdx);
              }}
              aria-label={`Letra ${letter} na linha ${rIdx + 1}, coluna ${cIdx + 1}`}
            >
              {letter}
            </button>
          ))
        )}
      </div>
    </div>
  );
});

WordSearchGrid.displayName = 'WordSearchGrid';

export default WordSearchGrid;
