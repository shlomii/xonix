
import React, { useEffect, useState } from 'react';

interface LevelTransitionProps {
  isVisible: boolean;
  level: number;
  score: number;
  onComplete?: () => void;
}

const LevelTransition: React.FC<LevelTransitionProps> = ({ 
  isVisible, 
  level, 
  score, 
  onComplete 
}) => {
  const [animationPhase, setAnimationPhase] = useState<'fadeIn' | 'show' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => setAnimationPhase('show'), 300);
    const timer2 = setTimeout(() => setAnimationPhase('fadeOut'), 1200);
    const timer3 = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'fadeIn':
        return 'opacity-0 scale-95 translate-y-4';
      case 'show':
        return 'opacity-100 scale-100 translate-y-0';
      case 'fadeOut':
        return 'opacity-0 scale-105 translate-y-[-4px]';
      default:
        return 'opacity-0';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className={`text-center transition-all duration-300 ease-out ${getAnimationClasses()}`}>
        <div className="mb-6">
          <h2 className="text-6xl font-bold text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text mb-2">
            LEVEL {level}
          </h2>
          <div className="text-2xl text-green-400 font-semibold">
            Level Complete!
          </div>
        </div>
        
        <div className="space-y-3 text-white">
          <div className="text-xl">
            Score: <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span>
          </div>
          <div className="text-lg text-gray-300">
            Enemies: {level}
          </div>
        </div>
        
        {/* Particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 1000}ms`,
                animationDuration: `${1000 + Math.random() * 1000}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelTransition;
