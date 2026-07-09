import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export interface LightboxItem {
  url: string;
  kind: "image" | "video";
  caption?: string | null;
  authorName?: string | null;
}

interface AdminMediaLightboxProps {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function AdminMediaLightbox({ items, index, onClose, onNavigate }: AdminMediaLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const open = index !== null;
  const item = index !== null ? items[index] : null;

  useEffect(() => {
    setZoomed(false);
  }, [index]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index !== null && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index !== null && index < items.length - 1) onNavigate(index + 1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, index, items.length, onNavigate, onClose]);

  if (!item || index === null) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95">
        <div className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {item.kind === "image" && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-16 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setZoomed((z) => !z)}
            >
              {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>
          )}

          {index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => onNavigate(index - 1)}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {index < items.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => onNavigate(index + 1)}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {item.kind === "image" ? (
            <img
              src={item.url}
              alt={item.caption || ""}
              onClick={() => setZoomed((z) => !z)}
              className={`max-h-[90vh] object-contain rounded-lg transition-transform duration-200 cursor-zoom-in ${
                zoomed ? "scale-[2] cursor-zoom-out" : "max-w-full"
              }`}
            />
          ) : (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
            />
          )}

          {(item.caption || item.authorName) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-sm">
              {item.authorName && <span className="font-semibold">{item.authorName}: </span>}
              {item.caption}
            </div>
          )}

          <div className="absolute top-2 left-2 z-20 text-white/70 text-xs bg-black/50 px-2 py-1 rounded">
            {index + 1} / {items.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
