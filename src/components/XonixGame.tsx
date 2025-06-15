import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Position, Enemy } from '../types/game';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameRenderer } from '../utils/GameRenderer';
import { GameLogic } from '../utils/GameLogic';
import { HighScoreManager } from '../utils/HighScoreManager';
import HighScoreDialog from './HighScoreDialog';
import HighScoreTable from './HighScoreTable';
import LevelTransition from './LevelTransition';

const GRID_SIZE = 15; // Grid cell size in pixels
const ASPECT_RATIO = 4 / 3; // Width to height ratio

interface GameOverEnemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

const XonixGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameOverCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 900 });
  const [showHighScoreEntry, setShowHighScoreEntry] = useState(false);
  const [showHighScoreTable, setShowHighScoreTable] = useState(false);
  const [gameOverEnemies, setGameOverEnemies] = useState<GameOverEnemy[]>([]);
  const animationFrameRef = useRef<number>();
  
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    enemies: [
      { x: 600, y: 450, vx: 1, vy: 0.8 }
    ],
    trail: [],
    filledCells: new Set(),
    score: 0,
    areaFilled: 0,
    isAlive: true,
    keys: new Set(),
    level: 1,
    enemyCount: 1,
    isLevelTransition: false
  });

  const gameLogic = useRef<GameLogic>();
  const renderer = useRef<GameRenderer>();

  // Calculate optimal canvas size based on window dimensions
  const calculateCanvasSize = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Leave some padding for UI elements (200px for UI, controls, etc.)
    const availableWidth = windowWidth - 100;
    const availableHeight = windowHeight - 300; // More space for header and controls
    
    let canvasWidth, canvasHeight;
    
    // Calculate based on aspect ratio and available space
    if (availableWidth / availableHeight > ASPECT_RATIO) {
      // Height is the limiting factor
      canvasHeight = Math.max(400, Math.min(availableHeight, 900));
      canvasWidth = canvasHeight * ASPECT_RATIO;
    } else {
      // Width is the limiting factor
      canvasWidth = Math.max(600, Math.min(availableWidth, 1200));
      canvasHeight = canvasWidth / ASPECT_RATIO;
    }
    
    // Ensure dimensions are multiples of grid size for clean alignment
    canvasWidth = Math.floor(canvasWidth / GRID_SIZE) * GRID_SIZE;
    canvasHeight = Math.floor(canvasHeight / GRID_SIZE) * GRID_SIZE;
    
    return { width: canvasWidth, height: canvasHeight };
  }, []);

  // Create bouncing enemies for game over screen
  const createGameOverEnemies = useCallback(() => {
    const enemies: GameOverEnemy[] = [];
    
    // Game Over title area enemies (2-3 enemies)
    for (let i = 0; i < 3; i++) {
      enemies.push({
        x: 200 + Math.random() * 200,
        y: 150 + Math.random() * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        bounds: { minX: 150, maxX: 450, minY: 120, maxY: 220 }
      });
    }
    
    // Score area enemies (1-2 enemies)
    for (let i = 0; i < 2; i++) {
      enemies.push({
        x: 250 + Math.random() * 100,
        y: 250 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        bounds: { minX: 200, maxX: 400, minY: 240, maxY: 290 }
      });
    }
    
    // Play Again button enemies (1-2 enemies)
    for (let i = 0; i < 2; i++) {
      enemies.push({
        x: 220 + Math.random() * 80,
        y: 320 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        bounds: { minX: 200, maxX: 320, minY: 310, maxY: 350 }
      });
    }
    
    // High Scores button enemies (1-2 enemies)
    for (let i = 0; i < 2; i++) {
      enemies.push({
        x: 220 + Math.random() * 80,
        y: 360 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        bounds: { minX: 200, maxX: 320, minY: 355, maxY: 395 }
      });
    }
    
    return enemies;
  }, []);

  // Update game over enemies animation
  const updateGameOverEnemies = useCallback(() => {
    setGameOverEnemies(prev => prev.map(enemy => {
      let newX = enemy.x + enemy.vx;
      let newY = enemy.y + enemy.vy;
      let newVx = enemy.vx;
      let newVy = enemy.vy;
      
      // Bounce off boundaries
      if (newX <= enemy.bounds.minX || newX >= enemy.bounds.maxX) {
        newVx = -newVx;
        newX = Math.max(enemy.bounds.minX, Math.min(enemy.bounds.maxX, newX));
      }
      if (newY <= enemy.bounds.minY || newY >= enemy.bounds.maxY) {
        newVy = -newVy;
        newY = Math.max(enemy.bounds.minY, Math.min(enemy.bounds.maxY, newY));
      }
      
      return { ...enemy, x: newX, y: newY, vx: newVx, vy: newVy };
    }));
  }, []);

  // Animate game over enemies
  useEffect(() => {
    if (!gameState.isAlive && !showHighScoreEntry && !showHighScoreTable) {
      const animate = () => {
        updateGameOverEnemies();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [gameState.isAlive, showHighScoreEntry, showHighScoreTable, updateGameOverEnemies]);

  // Initialize game over enemies when game ends
  useEffect(() => {
    if (!gameState.isAlive && gameOverEnemies.length === 0) {
      setGameOverEnemies(createGameOverEnemies());
    }
  }, [gameState.isAlive, gameOverEnemies.length, createGameOverEnemies]);

  // Initialize and update game logic/renderer when dimensions change
  useEffect(() => {
    const dimensions = calculateCanvasSize();
    setCanvasDimensions(dimensions);
    
    gameLogic.current = new GameLogic(GRID_SIZE, dimensions.width, dimensions.height);
    renderer.current = new GameRenderer(GRID_SIZE, dimensions.width, dimensions.height);
    
    // Reset game state with new dimensions
    const centerX = Math.floor(dimensions.width / 2);
    const centerY = Math.floor(dimensions.height / 2);
    
    setGameState(prev => ({
      ...prev,
      player: { x: 0, y: 0, vx: 0, vy: 0 },
      enemies: [
        { x: centerX, y: centerY, vx: 1, vy: 0.8 }
      ],
      trail: [],
      filledCells: new Set(),
      score: 0,
      areaFilled: 0,
      isAlive: true,
      level: 1,
      enemyCount: 1,
      isLevelTransition: false
    }));
  }, [calculateCanvasSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const dimensions = calculateCanvasSize();
      if (dimensions.width !== canvasDimensions.width || dimensions.height !== canvasDimensions.height) {
        setCanvasDimensions(dimensions);
        
        if (gameLogic.current && renderer.current) {
          gameLogic.current = new GameLogic(GRID_SIZE, dimensions.width, dimensions.height);
          renderer.current = new GameRenderer(GRID_SIZE, dimensions.width, dimensions.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCanvasSize, canvasDimensions]);

  const updateGame = useCallback(() => {
    if (!gameState.isAlive || !gameLogic.current) return;

    setGameState(prev => {
      const newState = gameLogic.current!.updateGame(prev);
      
      // Check for game over and high score
      if (prev.isAlive && !newState.isAlive) {
        if (HighScoreManager.isHighScore(newState.score)) {
          setTimeout(() => setShowHighScoreEntry(true), 1000);
        }
      }
      
      return newState;
    });
  }, [gameState.isAlive]);

  const handleHighScoreSubmit = (name: string) => {
    HighScoreManager.addHighScore(name, gameState.score);
    setShowHighScoreEntry(false);
    setShowHighScoreTable(true);
  };

  const handleKeyDownGlobal = useCallback((e: KeyboardEvent) => {
    // Handle spacebar for restarting game
    if (e.key === ' ' && !gameState.isAlive && !showHighScoreEntry && !showHighScoreTable) {
      e.preventDefault();
      resetGame();
      return;
    }
    
    if (e.key === 'Escape') {
      if (showHighScoreTable) {
        setShowHighScoreTable(false);
      }
    } else if (e.key.toLowerCase() === 'h' && gameState.isAlive) {
      setShowHighScoreTable(true);
    }
    
    // Handle game keys
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      e.preventDefault();
      setGameState(prev => ({
        ...prev,
        keys: new Set([...prev.keys, key])
      }));
    }
  }, [showHighScoreTable, gameState.isAlive, showHighScoreEntry]);

  const handleKeyUpGlobal = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setGameState(prev => {
      const newKeys = new Set(prev.keys);
      newKeys.delete(key);
      return { ...prev, keys: newKeys };
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDownGlobal);
    window.addEventListener('keyup', handleKeyUpGlobal);
    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal);
      window.removeEventListener('keyup', handleKeyUpGlobal);
    };
  }, [handleKeyDownGlobal, handleKeyUpGlobal]);

  useGameLoop(updateGame, 60);

  // Render game over enemies
  useEffect(() => {
    const canvas = gameOverCanvasRef.current;
    if (!canvas || gameState.isAlive || showHighScoreEntry || showHighScoreTable || !renderer.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Convert game over enemies to regular enemy format for rendering
    const enemiesForRendering = gameOverEnemies.map(enemy => ({
      x: enemy.x - GRID_SIZE/2,
      y: enemy.y - GRID_SIZE/2
    }));
    
    renderer.current.drawEnemies(ctx, enemiesForRendering);
  }, [gameOverEnemies, gameState.isAlive, showHighScoreEntry, showHighScoreTable]);

  const resetGame = () => {
    const centerX = Math.floor(canvasDimensions.width / 2);
    const centerY = Math.floor(canvasDimensions.height / 2);
    
    setGameState({
      player: { x: 0, y: 0, vx: 0, vy: 0 },
      enemies: [
        { x: centerX, y: centerY, vx: 1, vy: 0.8 }
      ],
      trail: [],
      filledCells: new Set(),
      score: 0,
      areaFilled: 0,
      isAlive: true,
      keys: new Set(),
      level: 1,
      enemyCount: 1,
      isLevelTransition: false
    });
    
    setShowHighScoreEntry(false);
    setShowHighScoreTable(false);
    setGameOverEnemies([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 w-full max-w-none">
        <h1 className="text-4xl font-bold text-white text-center mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          XONIX
        </h1>
        
        <div className="relative mb-6 flex justify-center">
          <canvas
            ref={canvasRef}
            className="border-4 border-green-500 rounded-lg shadow-lg bg-slate-900"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`
            }}
          />
          
          {!gameState.isAlive && !showHighScoreEntry && (
            <div 
              className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`
              }}
            >
              <canvas
                ref={gameOverCanvasRef}
                className="absolute inset-0 pointer-events-none"
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                style={{
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`
                }}
              />
              <div className="text-center relative z-10">
                <h2 className="text-4xl font-bold text-white mb-4">Game Over</h2>
                <p className="text-xl text-gray-300 mb-2">Final Score: {gameState.score.toLocaleString()}</p>
                <p className="text-lg text-gray-400 mb-6">Level Reached: {gameState.level}</p>
                <div className="space-y-3">
                  <button
                    onClick={resetGame}
                    className="block mx-auto px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => setShowHighScoreTable(true)}
                    className="block mx-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105"
                  >
                    High Scores
                  </button>
                </div>
                <div className="text-center mt-4 text-sm text-gray-400">
                  Press SPACEBAR to play again
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 mb-4">
          <div className="bg-purple-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-400/30">
            <div className="text-sm text-purple-200">Score</div>
            <div className="text-2xl font-bold text-white">{gameState.score.toLocaleString()}</div>
          </div>
          <div className="bg-blue-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-400/30">
            <div className="text-sm text-blue-200">Area Filled</div>
            <div className="text-2xl font-bold text-white">{gameState.areaFilled.toFixed(1)}%</div>
          </div>
          <div className="bg-green-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-400/30">
            <div className="text-sm text-green-200">Level</div>
            <div className="text-2xl font-bold text-white">{gameState.level}</div>
          </div>
          <div className="bg-red-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/30">
            <div className="text-sm text-red-200">Enemies</div>
            <div className="text-2xl font-bold text-white">{gameState.enemyCount}</div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Use Arrow Keys or WASD to move • Fill areas by completing closed shapes</p>
          <p>Avoid the red enemies • Fill 80% of the area to advance! • Press H for High Scores</p>
        </div>
      </div>
      
      <LevelTransition
        isVisible={gameState.isLevelTransition}
        level={gameState.level}
        score={gameState.score}
        onComplete={() => {
          setGameState(prev => ({ ...prev, isLevelTransition: false }));
        }}
      />
      
      <HighScoreDialog
        isOpen={showHighScoreEntry}
        score={gameState.score}
        onSubmit={handleHighScoreSubmit}
      />
      
      {showHighScoreTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <HighScoreTable 
            scores={HighScoreManager.getHighScores()} 
            currentScore={gameState.score}
          />
        </div>
      )}
    </div>
  );
};

export default XonixGame;
