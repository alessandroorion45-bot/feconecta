import { memo } from 'react';
import { Lightbulb, Eye, Sparkles } from 'lucide-react';

interface GameToolsProps {
  onUseHint: () => boolean;
  onRevealLetter: () => boolean;
}

const GameTools = memo(({ onUseHint, onRevealLetter }: GameToolsProps) => {
  return (
    <div className="pv-tools">
      <button onClick={onUseHint} className="pv-tool-btn">
        <Lightbulb className="h-4 w-4" />
        <span>Dica</span>
        <Sparkles className="h-3 w-3 pv-tool-sparkle" />
      </button>

      <button onClick={onRevealLetter} className="pv-tool-btn">
        <Eye className="h-4 w-4" />
        <span>Revelar Letra</span>
        <Sparkles className="h-3 w-3 pv-tool-sparkle" />
      </button>
    </div>
  );
});

GameTools.displayName = 'GameTools';

export default GameTools;
