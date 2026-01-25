import { useState, useEffect, useCallback } from 'react';
import { CANVAS_CONFIG } from '../game/utils/constants';

interface ResponsiveSize {
  width: number;
  height: number;
  scale: number;
}

export function useResponsive(): ResponsiveSize {
  const calculateSize = useCallback(() => {
    const maxWidth = Math.min(window.innerWidth - 32, 600); // 16px padding on each side, max 600px
    const maxHeight = window.innerHeight - 120; // Leave room for header/footer

    const aspectRatio = CANVAS_CONFIG.width / CANVAS_CONFIG.height;

    let width = maxWidth;
    let height = width / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    const scale = width / CANVAS_CONFIG.width;

    return { width, height, scale };
  }, []);

  const [size, setSize] = useState(calculateSize);

  useEffect(() => {
    const handleResize = () => {
      setSize(calculateSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateSize]);

  return size;
}
