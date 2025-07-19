import React, { useState, useEffect } from 'react';

interface BackgroundSlideshowProps {
  children: React.ReactNode;
}

const BackgroundSlideshow: React.FC<BackgroundSlideshowProps> = ({ children }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Array of background images
  const backgroundImages = [
    '/posters_background/poster1.jpg',
    '/posters_background/poster2.jpg'
  ];

  // Detect mobile device once on mount
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preload images for better performance
  useEffect(() => {
    const loadImages = async () => {
      const loadPromises = backgroundImages.map((src, index) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            setImagesLoaded(prev => {
              const newLoaded = [...prev];
              newLoaded[index] = true;
              return newLoaded;
            });
            resolve();
          };
          img.onerror = () => {
            // Still mark as "loaded" to prevent infinite loading
            setImagesLoaded(prev => {
              const newLoaded = [...prev];
              newLoaded[index] = true;
              return newLoaded;
            });
            resolve();
          };
          img.src = src;
        });
      });
      
      await Promise.all(loadPromises);
    };
    
    loadImages();
  }, [backgroundImages]);
  useEffect(() => {
    // Only start slideshow after images are loaded
    if (imagesLoaded.length < backgroundImages.length) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length, imagesLoaded.length]);

  // Mouse move handler for parallax effect
  useEffect(() => {
    if (isMobile) {
      return; // Skip parallax on mobile devices
    }

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse move with requestAnimationFrame
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        // Calculate mouse position as percentage from center
        const x = (clientX - innerWidth / 2) / innerWidth;
        const y = (clientY - innerHeight / 2) / innerHeight;
        
        setMousePosition({ x, y });
        rafId = 0;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  return (
    <div className="slideshow-container">
      {/* Background Images */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`slideshow-image ${
            index === currentImageIndex && imagesLoaded[index] ? 'active' : ''
          }`}
          style={{
            backgroundImage: `url(${image})`,
            transform: isMobile 
              ? 'none' 
              : `translate(${mousePosition.x * 20}px, ${mousePosition.y * 15}px) scale(1.1)`,
            willChange: isMobile ? 'auto' : 'transform',
          }}
        />
      ))}
      
      {/* Gradient Overlay */}
      <div className="slideshow-overlay" />
      
      {/* CRT Scan-lines */}
      <div className="crt-scanlines" />
      
      {/* Content */}
      <div className="slideshow-content">
        {children}
      </div>
    </div>
  );
};

export default BackgroundSlideshow;