import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface WordListPanelProps {
  placements: { word: string; found: boolean }[];
}

const WordListPanel = memo(({ placements }: WordListPanelProps) => {
  return (
    <div className="pv-word-panel">
      <h2 className="pv-panel-title">Encontre as Palavras</h2>
      <div className="pv-word-list">
        {placements.map((p) => (
          <motion.div
            key={p.word}
            layout
            className={`pv-word-item ${p.found ? 'pv-word-found' : ''}`}
            initial={false}
            animate={p.found ? { scale: [1.15, 1], y: [-6, 0] } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {p.found && (
              <motion.span
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pv-word-found-burst"
                aria-hidden
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
            )}
            <span className={p.found ? 'line-through opacity-60' : ''}>{p.word}</span>
            {p.found && (
              <Check className="h-3.5 w-3.5 pv-check-animate" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
});

WordListPanel.displayName = 'WordListPanel';

export default WordListPanel;
