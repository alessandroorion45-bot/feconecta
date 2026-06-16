import { memo } from 'react';

interface VerseDisplayProps {
  verseText: string;
  verseRef: string;
}

const VerseDisplay = memo(({ verseText, verseRef }: VerseDisplayProps) => {
  if (!verseText) return null;

  return (
    <div className="pv-verse-display">
      <p className="pv-verse-text">
        "{verseText}"
      </p>
      <p className="pv-verse-ref">— {verseRef}</p>
    </div>
  );
});

VerseDisplay.displayName = 'VerseDisplay';

export default VerseDisplay;
