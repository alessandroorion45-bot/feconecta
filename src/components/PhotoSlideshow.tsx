import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  Pause,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
}

interface PhotoSlideshowProps {
  photos: Photo[];
  isOpen: boolean;
  onClose: () => void;
  startIndex?: number;
}

export const PhotoSlideshow = ({ 
  photos, 
  isOpen, 
  onClose, 
  startIndex = 0 
}: PhotoSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(0);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (!isOpen || !isPlaying || photos.length <= 1) return;

    const interval = setInterval(goToNext, 4000);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, photos.length, goToNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrevious, onClose]);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-none bg-black/95">
        <div className="relative w-full h-full flex flex-col">
          {/* Top controls */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-4">
              <span className="text-white text-sm">
                {currentIndex + 1} / {photos.length}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? 'Pausar' : 'Reproduzir'}
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main photo area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <img
                  src={currentPhoto.photo_url}
                  alt={currentPhoto.caption || "Foto"}
                  className="max-w-full max-h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={goToPrevious}
                  className="absolute left-4 z-10 h-12 w-12 rounded-full text-white bg-black/30 hover:bg-black/50"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={goToNext}
                  className="absolute right-4 z-10 h-12 w-12 rounded-full text-white bg-black/30 hover:bg-black/50"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>

          {/* Caption and thumbnail strip */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
            {currentPhoto.caption && (
              <p className="text-white text-center mb-4 max-w-2xl mx-auto">
                {currentPhoto.caption}
              </p>
            )}
            
            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                      index === currentIndex 
                        ? "border-white scale-110" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img
                      src={photo.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Progress dots */}
            {photos.length > 1 && photos.length <= 10 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "transition-all rounded-full",
                      index === currentIndex 
                        ? "w-6 h-2 bg-white" 
                        : "w-2 h-2 bg-white/50 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
