import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  sizes = '100vw'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  // Generate WebP and AVIF versions
  const getOptimizedSrc = (originalSrc: string, format: 'webp' | 'avif' | 'original') => {
    if (format === 'original') return originalSrc;
    const extension = format === 'webp' ? '.webp' : '.avif';
    return originalSrc.replace(/\.(jpg|jpeg|png)$/i, extension);
  };

  // Generate responsive sizes
  const generateSrcSet = (src: string, format: 'webp' | 'avif' | 'original') => {
    const optimizedSrc = getOptimizedSrc(src, format);
    const baseName = optimizedSrc.replace(/\.(webp|avif|jpg|jpeg|png)$/i, '');
    
    return [
      `${baseName}-400w.${format === 'original' ? 'jpg' : format} 400w`,
      `${baseName}-800w.${format === 'original' ? 'jpg' : format} 800w`,
      `${baseName}-1200w.${format === 'original' ? 'jpg' : format} 1200w`,
      `${baseName}-1600w.${format === 'original' ? 'jpg' : format} 1600w`,
      `${baseName}-2000w.${format === 'original' ? 'jpg' : format} 2000w`
    ].join(', ');
  };

  useEffect(() => {
    // Preload critical images
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  }, [src, priority]);

  return (
    <picture className={className}>
      {/* AVIF format for modern browsers */}
      <source
        srcSet={generateSrcSet(src, 'avif')}
        sizes={sizes}
        type="image/avif"
      />
      
      {/* WebP format for broader support */}
      <source
        srcSet={generateSrcSet(src, 'webp')}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback JPEG */}
      <img
        src={src}
        srcSet={generateSrcSet(src, 'original')}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: '1200px 800px'
        }}
      />
    </picture>
  );
};

export default OptimizedImage;