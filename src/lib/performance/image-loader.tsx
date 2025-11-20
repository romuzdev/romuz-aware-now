/**
 * Performance: Optimized Image Component
 * 
 * Features:
 * - Lazy loading
 * - Blur placeholder
 * - Error fallback
 * - WebP support
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  blurDataURL,
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(blurDataURL || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      className={cn(
        'transition-opacity duration-300',
        isLoading && 'opacity-0',
        !isLoading && 'opacity-100',
        hasError && 'grayscale',
        className
      )}
      {...props}
    />
  );
}
