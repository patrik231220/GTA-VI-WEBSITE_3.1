import React, { useState, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';

interface BackgroundSlideshowProps {
  children: React.ReactNode;
}

const BackgroundSlideshow: React.FC<BackgroundSlideshowProps> = ({ children }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Array of background images
  const backgroundImages = [
    '/posters_background/poster1-optimized.jpg',
    '/posters_background/poster2-optimized.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Mouse move handler for parallax effect
  useEffect(() => {
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
      return; // Skip parallax on mobile devices
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate mouse position as percentage from center
      const x = (clientX - innerWidth / 2) / innerWidth;
      const y = (clientY - innerHeight / 2) / innerHeight;
      
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check if device is mobile for rendering
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  return (
    <div className="slideshow-container">
      {/* Background Images */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`slideshow-image ${
            index === currentImageIndex ? 'active' : ''
          }`}
          style={{
            transform: isMobile 
              ? 'none' 
              : `translate(${mousePosition.x * 20}px, ${mousePosition.y * 15}px) scale(1.1)`,
          }}
        >
          <OptimizedImage
            src={image}
            alt={`GTA VI Background ${index + 1}`}
            priority={index === 0}
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
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