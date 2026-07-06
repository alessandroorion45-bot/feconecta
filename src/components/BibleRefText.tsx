import { useState } from "react";
import BibleReferenceModal from "@/components/BibleReferenceModal";

/**
 * Renderiza um texto tornando as referências bíblicas clicáveis
 * (ex: "João 3:16", "1 Coríntios 13:4-7", "Salmos 91").
 * Ao clicar, abre a Bíblia integrada no modal — sem sair da página.
 */

const REF_REGEX = /((?:[1-3]\s?)?[A-ZÂÊÔÁÉÍÓÚÀ][a-zâêôáéíóúàãõç]{2,}\s\d{1,3}(?::\d{1,3}(?:-\d{1,3})?)?)/g;

interface BibleRefTextProps {
  text: string;
  className?: string;
}

export const BibleRefText = ({ text, className }: BibleRefTextProps) => {
  const [openRef, setOpenRef] = useState<string | null>(null);

  const parts = text.split(REF_REGEX);

  return (
    <>
      <span className={className}>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setOpenRef(part);
              }}
              className="text-primary font-medium underline decoration-primary/40 underline-offset-2 hover:decoration-primary transition-colors"
              title={`Ler ${part} na Bíblia`}
            >
              📖 {part}
            </button>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>

      {openRef && (
        <BibleReferenceModal
          open={!!openRef}
          onOpenChange={(o) => !o && setOpenRef(null)}
          reference={openRef}
        />
      )}
    </>
  );
};

export default BibleRefText;
