import { memo } from 'react';
import { Check } from 'lucide-react';

interface WordListPanelProps {
  placements: { word: string; found: boolean }[];
}

const WordListPanel = memo(({ placements }: WordListPanelProps) => {
  return (
    <div className="pv-word-panel">
      <h2 className="pv-panel-title">Encontre as Palavras</h2>
      <div className="pv-word-list">
        {placements.map((p) => (
          <div
            key={p.word}
            className={`pv-word-item ${p.found ? 'pv-word-found' : ''}`}
          >
            <span className={p.found ? 'line-through opacity-60' : ''}>{p.word}</span>
            {p.found && (
              <Check className="h-3.5 w-3.5 pv-check-animate" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

WordListPanel.displayName = 'WordListPanel';

export default WordListPanel;
