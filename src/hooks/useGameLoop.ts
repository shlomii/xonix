
import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: () => void, fps: number) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const intervalTime = 1000 / fps;

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      
      if (deltaTime >= intervalTime) {
        callback();
        previousTimeRef.current = time;
      }
    } else {
      previousTimeRef.current = time;
    }
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
};
