
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
  const [animationPhase, setAnimationPhase] = useState<'explosion' | 'celebration' | 'levelUp' | 'fadeOut'>('explosion');
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    type: 'spark' | 'confetti' | 'star' | 'ring';
  }>>([]);

  // Create explosive particles
  const createExplosion = () => {
    const newParticles = [];
    const centerX = 50; // percentage
    const centerY = 50; // percentage
    
    // Main explosion burst
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const speed = 15 + Math.random() * 25;
      const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
      
      newParticles.push({
        id: Math.random(),
        x: centerX + Math.random() * 10 - 5,
        y: centerY + Math.random() * 10 - 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 6,
        life: 100,
        maxLife: 100,
        type: Math.random() > 0.7 ? 'star' : 'spark'
      });
    }
    
    // Secondary ring explosion
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 15;
      
      newParticles.push({
        id: Math.random(),
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#FBBF24',
        size: 2 + Math.random() * 4,
        life: 80,
        maxLife: 80,
        type: 'ring'
      });
    }
    
    setParticles(newParticles);
  };

  // Create confetti celebration
  const createConfetti = () => {
    const newParticles = [];
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#FBBF24'];
    
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        id: Math.random(),
        x: Math.random() * 100,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: 2 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        life: 120,
        maxLife: 120,
        type: 'confetti'
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Update particle physics
  useEffect(() => {
    if (!isVisible || particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx * 0.5,
          y: particle.y + particle.vy * 0.5,
          vx: particle.vx * 0.98, // air resistance
          vy: particle.vy + (particle.type === 'confetti' ? 0.2 : 0.1), // gravity
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0 && particle.y < 110)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [isVisible, particles.length]);

  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase('explosion');
      setParticles([]);
      return;
    }

    // Phase 1: Explosion (immediate)
    createExplosion();
    
    // Phase 2: Celebration text appears
    const timer1 = setTimeout(() => {
      setAnimationPhase('celebration');
      createConfetti();
    }, 400);
    
    // Phase 3: Level up announcement
    const timer2 = setTimeout(() => {
      setAnimationPhase('levelUp');
    }, 1200);
    
    // Phase 4: Fade out and complete
    const timer3 = setTimeout(() => {
      setAnimationPhase('fadeOut');
    }, 2200);
    
    const timer4 = setTimeout(() => {
      onComplete?.();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const getContainerClasses = () => {
    switch (animationPhase) {
      case 'explosion':
        return 'opacity-100 scale-110';
      case 'celebration':
      case 'levelUp':
        return 'opacity-100 scale-100';
      case 'fadeOut':
        return 'opacity-0 scale-95';
      default:
        return 'opacity-0';
    }
  };

  const getTextAnimation = (phase: string) => {
    if (animationPhase === 'explosion') return 'opacity-0 scale-50 rotate-12';
    if (animationPhase === 'celebration' && phase === 'celebration') return 'opacity-100 scale-100 rotate-0';
    if (animationPhase === 'levelUp' && phase === 'levelUp') return 'opacity-100 scale-100 rotate-0';
    if (animationPhase === 'fadeOut') return 'opacity-0 scale-110 rotate-[-3deg]';
    return 'opacity-0 scale-50';
  };

  const renderParticle = (particle: typeof particles[0]) => {
    const opacity = particle.life / particle.maxLife;
    
    switch (particle.type) {
      case 'star':
        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none transform"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity,
              transform: `rotate(${particle.life * 4}deg)`
            }}
          >
            <div 
              className="w-full h-full"
              style={{
                background: particle.color,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }}
            />
          </div>
        );
      
      case 'ring':
        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none rounded-full border-2"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderColor: particle.color,
              opacity,
              transform: `scale(${1 + (1 - opacity) * 2})`
            }}
          />
        );
      
      case 'confetti':
        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size / 2}px`,
              backgroundColor: particle.color,
              opacity,
              transform: `rotate(${particle.life * 6}deg)`
            }}
          />
        );
      
      default: // spark
        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
            }}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-hidden">
      {/* Particle System */}
      <div className="absolute inset-0">
        {particles.map(renderParticle)}
      </div>
      
      {/* Radial gradient background effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(16, 185, 129, 0.3) 0%, 
            rgba(59, 130, 246, 0.2) 30%, 
            rgba(139, 92, 246, 0.1) 60%, 
            transparent 100%)`
        }}
      />
      
      <div className={`text-center transition-all duration-500 ease-out ${getContainerClasses()}`}>
        {/* Level Complete Celebration */}
        <div className={`transition-all duration-700 ease-out ${getTextAnimation('celebration')}`}>
          <div className="mb-8">
            <h2 className="text-8xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text mb-4 animate-pulse">
              AMAZING!
            </h2>
            <div className="text-3xl text-green-400 font-bold animate-bounce">
              🎉 Level {level - 1} Complete! 🎉
            </div>
          </div>
          
          <div className="space-y-4 text-white">
            <div className="text-2xl">
              Score: <span className="text-yellow-400 font-black text-3xl">{score.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Level Up Announcement */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${getTextAnimation('levelUp')}`}>
          <div className="text-center">
            <div className="text-6xl font-black text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text mb-4">
              LEVEL {level}
            </div>
            <div className="text-2xl text-blue-400 font-bold mb-4">
              ⚡ POWER UP! ⚡
            </div>
            <div className="text-lg text-gray-300">
              {level} Enemies incoming...
            </div>
            <div className="text-base text-yellow-400 mt-2 animate-pulse">
              Get ready for the challenge!
            </div>
          </div>
        </div>
        
        {/* Screen flash effect */}
        {animationPhase === 'explosion' && (
          <div className="fixed inset-0 bg-white animate-ping opacity-20 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default LevelTransition;
