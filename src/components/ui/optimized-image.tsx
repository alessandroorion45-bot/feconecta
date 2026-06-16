import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  blurPlaceholder?: boolean;
  priority?: boolean;
}

/**
 * Optimized image component with lazy loading, error handling, and blur placeholder
 */
export const OptimizedImage = ({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  blurPlaceholder = true,
  priority = false,
  className,
  ...props
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(priority ? src : "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      return;
    }

    // Use Intersection Observer for lazy loading
    if ("IntersectionObserver" in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: "100px 0px",
          threshold: 0.01,
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback for older browsers
      setImageSrc(src);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {blurPlaceholder && !isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
};

/**
 * Avatar-specific optimized image with proper sizing
 */
export const OptimizedAvatar = ({
  src,
  alt,
  size = "md",
  className,
}: {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) => {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate initials for fallback
  const initials = alt
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium",
          sizeClasses[size],
          className
        )}
      >
        <span className={size === "xs" ? "text-xs" : size === "sm" ? "text-xs" : "text-sm"}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-full overflow-hidden", sizeClasses[size], className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
        decoding="async"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export default OptimizedImage;
