import { Theme } from "@/lib/themes";

interface ThemePreviewProps {
  theme: Theme;
  size?: "sm" | "md" | "lg";
}

export const ThemePreview = ({ theme, size = "md" }: ThemePreviewProps) => {
  const heights = {
    sm: "h-24",
    md: "h-32",
    lg: "h-48",
  };

  return (
    <div
      className={`${heights[size]} w-full rounded-lg overflow-hidden border-2 transition-all duration-300`}
      style={{
        background: `linear-gradient(135deg, ${theme.colors.gradient.join(", ")})`,
        borderColor: theme.colors.accent,
      }}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        {/* Header simulado */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div className="flex-1 space-y-1">
            <div
              className="h-2 rounded"
              style={{ backgroundColor: theme.colors.text, opacity: 0.3, width: "60%" }}
            />
            <div
              className="h-1.5 rounded"
              style={{ backgroundColor: theme.colors.text, opacity: 0.2, width: "40%" }}
            />
          </div>
        </div>

        {/* Card simulado */}
        <div
          className="rounded p-2 shadow-sm"
          style={{ backgroundColor: theme.colors.background, opacity: 0.95 }}
        >
          <div
            className="h-1.5 rounded mb-1"
            style={{ backgroundColor: theme.colors.text, opacity: 0.4, width: "80%" }}
          />
          <div
            className="h-1 rounded"
            style={{ backgroundColor: theme.colors.text, opacity: 0.3, width: "60%" }}
          />

          {/* Botão simulado */}
          <div
            className="h-4 rounded mt-2 flex items-center justify-center"
            style={{
              background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
            }}
          >
            <div className="h-1 w-6 rounded" style={{ backgroundColor: "white", opacity: 0.8 }} />
          </div>
        </div>
      </div>
    </div>
  );
};
