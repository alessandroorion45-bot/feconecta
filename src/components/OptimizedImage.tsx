import { ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  blur?: boolean;
}

/**
 * Componente de imagem otimizado com:
 * - Lazy loading nativo
 * - Decodificação assíncrona
 * - Fallback em caso de erro
 * - Blur-up opcional
 */
export const OptimizedImage = ({
  src,
  alt,
  fallback,
  blur = true,
  className,
  ...props
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    setError(true);
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  if (error && fallback) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      className={cn(
        blur && !loaded && 'blur-sm',
        blur && loaded && 'transition-all duration-300',
        className
      )}
      {...props}
    />
  );
};
