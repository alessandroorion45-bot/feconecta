import { Theme } from "@/lib/themes";

interface ThemePreviewProps {
  theme: Theme;
  size?: "sm" | "md" | "lg";
}

export const ThemePreview = ({ theme, size = "md" }: ThemePreviewProps) => {
  const heights = {
    sm: "h-28",
    md: "h-40",
    lg: "h-64",
  };

  const tokens = theme.designTokens;

  return (
    <div
      className={`${heights[size]} w-full rounded-xl overflow-hidden border-2 transition-all duration-300 relative`}
      style={{
        background: tokens.background,
        borderColor: tokens.border,
        boxShadow: `0 4px 20px ${tokens.shadow}`,
      }}
    >
      {/* Gradiente overlay sutil */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: tokens.gradientHeader,
        }}
      />

      <div className="relative z-10 p-3 h-full flex flex-col justify-between">
        {/* Header simulado com backdrop blur */}
        <div
          className="flex items-center gap-2 p-2 rounded-lg mb-2"
          style={{
            background: tokens.headerBackground,
            backdropFilter: `blur(${tokens.backdropBlur})`,
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <div
            className="w-8 h-8 rounded-full ring-2 transition-all"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              ringColor: tokens.borderHover,
              boxShadow: `0 0 10px ${tokens.glow}`,
            }}
          />
          <div className="flex-1 space-y-1">
            <div
              className="h-2 rounded-full"
              style={{
                background: tokens.textOnPrimary === '#ffffff' ? tokens.text : tokens.textOnPrimary,
                opacity: 0.8,
                width: "70%",
              }}
            />
            <div
              className="h-1.5 rounded-full"
              style={{
                background: tokens.textSecondary,
                opacity: 0.6,
                width: "50%",
              }}
            />
          </div>
        </div>

        {/* Card simulado com design tokens */}
        <div
          className="rounded-lg p-3 shadow-md transition-all hover:shadow-lg"
          style={{
            background: tokens.cardBackground,
            border: `1px solid ${tokens.border}`,
            boxShadow: `0 2px 8px ${tokens.shadow}`,
          }}
        >
          <div
            className="h-2 rounded-full mb-2"
            style={{
              background: tokens.text,
              opacity: 0.7,
              width: "90%",
            }}
          />
          <div
            className="h-1.5 rounded-full mb-3"
            style={{
              background: tokens.textSecondary,
              opacity: 0.5,
              width: "70%",
            }}
          />

          {/* Botões simulados */}
          <div className="flex gap-2 mt-2">
            <div
              className="h-6 rounded-md flex-1 flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: tokens.buttonPrimary,
                boxShadow: `0 0 10px ${tokens.glow}`,
              }}
            >
              <div
                className="h-1 w-8 rounded"
                style={{
                  backgroundColor: tokens.textOnPrimary,
                  opacity: 0.9,
                }}
              />
            </div>
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: tokens.buttonSecondary,
                border: `1px solid ${tokens.borderHover}`,
              }}
            >
              <div
                className="h-1 w-3 rounded"
                style={{
                  backgroundColor: tokens.textOnAccent,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        </div>

        {/* Indicador de glow (só em temas premium) */}
        {parseFloat(tokens.glowIntensity) > 0.5 && (
          <div
            className="absolute top-1 right-1 w-3 h-3 rounded-full animate-pulse"
            style={{
              background: tokens.glow,
              boxShadow: `0 0 10px ${tokens.glow}`,
            }}
          />
        )}
      </div>
    </div>
  );
};
