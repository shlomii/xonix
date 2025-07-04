import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Position, Enemy } from '../types/game';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameRenderer } from '../utils/GameRenderer';
import { GameLogic } from '../utils/GameLogic';
import { HighScoreManager } from '../utils/HighScoreManager';
import HighScoreDialog from './HighScoreDialog';
import HighScoreTable from './HighScoreTable';
import LevelTransition from './LevelTransition';
import { audioManager } from '../utils/AudioManager';

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
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  
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
    isLevelTransition: false,
    surprises: []
  });

  const gameLogic = useRef<GameLogic>();
  const renderer = useRef<GameRenderer>();

  // Calculate optimal canvas size based on window dimensions
  const calculateCanvasSize = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Leave some padding for UI elements
    const availableWidth = Math.min(windowWidth - 100, 1400); // Max width cap
    const availableHeight = Math.min(windowHeight - 300, 1000); // Max height cap
    
    let canvasWidth, canvasHeight;
    
    // Calculate based on aspect ratio and available space
    if (availableWidth / availableHeight > ASPECT_RATIO) {
      canvasHeight = Math.max(400, availableHeight);
      canvasWidth = canvasHeight * ASPECT_RATIO;
    } else {
      canvasWidth = Math.max(600, availableWidth);
      canvasHeight = canvasWidth / ASPECT_RATIO;
    }
    
    // Ensure dimensions are multiples of grid size for clean alignment
    canvasWidth = Math.floor(canvasWidth / GRID_SIZE) * GRID_SIZE;
    canvasHeight = Math.floor(canvasHeight / GRID_SIZE) * GRID_SIZE;
    
    return { width: canvasWidth, height: canvasHeight };
  }, []);

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
      isLevelTransition: false,
      surprises: []
    }));

    // Simulate loading for smooth experience
    setTimeout(() => setIsLoading(false), 1000);
  }, [calculateCanvasSize]);

  // Handle window resize with debouncing
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const dimensions = calculateCanvasSize();
        if (dimensions.width !== canvasDimensions.width || dimensions.height !== canvasDimensions.height) {
          setCanvasDimensions(dimensions);
          
          if (gameLogic.current && renderer.current) {
            gameLogic.current = new GameLogic(GRID_SIZE, dimensions.width, dimensions.height);
            renderer.current = new GameRenderer(GRID_SIZE, dimensions.width, dimensions.height);
          }
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [calculateCanvasSize, canvasDimensions]);

  // Render game to canvas with high DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderer.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = canvasDimensions.width;
    const displayHeight = canvasDimensions.height;
    
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Update renderer dimensions
    renderer.current.updateDimensions(displayWidth, displayHeight);
    
    // Render the game
    renderer.current.render(ctx, gameState);
  }, [gameState, canvasDimensions]);

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

  // Create bouncing enemies for game over screen
  const createGameOverEnemies = useCallback(() => {
    const enemies: GameOverEnemy[] = [];
    
    // Game Over title area enemies
    for (let i = 0; i < 3; i++) {
      enemies.push({
        x: 200 + Math.random() * 200,
        y: 150 + Math.random() * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        bounds: { minX: 150, maxX: 450, minY: 120, maxY: 220 }
      });
    }
    
    // Score area enemies
    for (let i = 0; i < 2; i++) {
      enemies.push({
        x: 250 + Math.random() * 100,
        y: 250 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        bounds: { minX: 200, maxX: 400, minY: 240, maxY: 290 }
      });
    }
    
    // Button area enemies
    for (let i = 0; i < 4; i++) {
      enemies.push({
        x: 220 + Math.random() * 80,
        y: 320 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        bounds: { minX: 200, maxX: 320, minY: 310, maxY: 395 }
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
      } else if (showInstructions) {
        setShowInstructions(false);
      }
    } else if (e.key.toLowerCase() === 'h' && gameState.isAlive) {
      setShowHighScoreTable(true);
    } else if (e.key.toLowerCase() === 'i' && gameState.isAlive) {
      setShowInstructions(true);
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
  }, [showHighScoreTable, gameState.isAlive, showHighScoreEntry, showInstructions]);

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

    // High DPI support for game over canvas
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvasDimensions.width * devicePixelRatio;
    canvas.height = canvasDimensions.height * devicePixelRatio;
    canvas.style.width = `${canvasDimensions.width}px`;
    canvas.style.height = `${canvasDimensions.height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    
    // Convert game over enemies to regular enemy format for rendering
    const enemiesForRendering = gameOverEnemies.map(enemy => ({
      x: enemy.x - GRID_SIZE/2,
      y: enemy.y - GRID_SIZE/2
    }));
    
    renderer.current.drawEnemies(ctx, enemiesForRendering);
  }, [gameOverEnemies, gameState.isAlive, showHighScoreEntry, showHighScoreTable, canvasDimensions]);

  const resetGame = () => {
    audioManager.playButtonClick();
    
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
      isLevelTransition: false,
      surprises: []
    });
    
    setShowHighScoreEntry(false);
    setShowHighScoreTable(false);
    setGameOverEnemies([]);
  };

  const handleHighScoresClick = () => {
    audioManager.playButtonClick();
    setShowHighScoreTable(true);
  };

  const handleInstructionsClick = () => {
    audioManager.playButtonClick();
    setShowInstructions(true);
  };

  const toggleAudioControls = () => {
    audioManager.playButtonClick();
    setShowAudioControls(!showAudioControls);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-center">
          <div className="text-6xl font-bold text-white bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-8 animate-pulse">
            XONIX
          </div>
          <div className="flex space-x-2 justify-center mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-white/70">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 w-full max-w-none">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              XONIX
            </h1>
            <div className="text-sm text-white/60">
              v1.0 • Production Ready
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Instructions Button */}
            <button
              onClick={handleInstructionsClick}
              className="text-white hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Instructions (I)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Audio Controls */}
            <div className="relative">
              <button
                onClick={toggleAudioControls}
                className="text-white hover:text-yellow-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Audio Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-1a3 3 0 00-6 0v1z" />
                </svg>
              </button>
              
              {showAudioControls && (
                <div className="absolute right-0 top-12 bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-white/20 z-10 min-w-[220px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">Sound Effects</span>
                      <button
                        onClick={() => {
                          audioManager.setEnabled(!audioManager.getEnabled());
                          audioManager.playButtonClick();
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                          audioManager.getEnabled() 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {audioManager.getEnabled() ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Volume</span>
                        <span className="text-white/70 text-xs">{Math.round(audioManager.getVolume() * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={audioManager.getVolume()}
                        onChange={(e) => audioManager.setVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${audioManager.getVolume() * 100}%, #374151 ${audioManager.getVolume() * 100}%, #374151 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative mb-6 flex justify-center">
          <canvas
            ref={canvasRef}
            className="border-4 border-green-500 rounded-lg shadow-2xl bg-slate-900 transition-all duration-300 hover:shadow-green-500/20"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
              imageRendering: 'pixelated'
            }}
          />
          
          {!gameState.isAlive && !showHighScoreEntry && (
            <div 
              className="absolute inset-0 bg-black/85 flex items-center justify-center rounded-lg backdrop-blur-sm"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`
              }}
            >
              <canvas
                ref={gameOverCanvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`
                }}
              />
              <div className="text-center relative z-10 p-8">
                <div className="mb-6">
                  <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                    Game Over
                  </h2>
                  <div className="space-y-2">
                    <p className="text-2xl text-gray-300">Final Score: <span className="text-yellow-400 font-bold">{gameState.score.toLocaleString()}</span></p>
                    <p className="text-lg text-gray-400">Level Reached: <span className="text-blue-400 font-semibold">{gameState.level}</span></p>
                    <p className="text-base text-gray-500">Area Filled: <span className="text-green-400">{gameState.areaFilled.toFixed(1)}%</span></p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={resetGame}
                    className="block mx-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                  >
                    🎮 Play Again
                  </button>
                  <button
                    onClick={handleHighScoresClick}
                    className="block mx-auto px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
                  >
                    🏆 High Scores
                  </button>
                </div>
                
                <div className="text-center mt-6 text-sm text-gray-400 bg-black/30 rounded-lg p-3">
                  <p className="flex items-center justify-center space-x-2">
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">SPACE</kbd>
                    <span>Play Again</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-600/50 to-purple-700/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-purple-400/30 transition-all hover:scale-105">
            <div className="text-sm text-purple-200 font-medium">Score</div>
            <div className="text-2xl font-bold text-white">{gameState.score.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/50 to-blue-700/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-400/30 transition-all hover:scale-105">
            <div className="text-sm text-blue-200 font-medium">Area Filled</div>
            <div className="text-2xl font-bold text-white">{gameState.areaFilled.toFixed(1)}%</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/50 to-green-700/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-green-400/30 transition-all hover:scale-105">
            <div className="text-sm text-green-200 font-medium">Level</div>
            <div className="text-2xl font-bold text-white">{gameState.level}</div>
          </div>
          <div className="bg-gradient-to-br from-red-600/50 to-red-700/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-red-400/30 transition-all hover:scale-105">
            <div className="text-sm text-red-200 font-medium">Enemies</div>
            <div className="text-2xl font-bold text-white">{gameState.enemyCount}</div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
            <div className="flex items-center space-x-2 bg-black/30 rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">↑</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">↓</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">→</kbd>
              </div>
              <span>or</span>
              <div className="flex space-x-1">
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">W</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">A</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">S</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">D</kbd>
              </div>
              <span>Move</span>
            </div>
            <div className="flex items-center space-x-2 bg-black/30 rounded-lg px-3 py-2">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">H</kbd>
              <span>High Scores</span>
            </div>
            <div className="flex items-center space-x-2 bg-black/30 rounded-lg px-3 py-2">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">I</kbd>
              <span>Instructions</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 max-w-2xl mx-auto">
            <p className="mb-2">🎯 <strong>Objective:</strong> Fill areas by completing closed shapes while avoiding red enemies</p>
            <p>💎 <strong>Goal:</strong> Fill 80% of the area to advance to the next level!</p>
          </div>
        </div>
      </div>
      
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-4 border-blue-500 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                How to Play XONIX
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded"></div>
            </div>
            
            <div className="space-y-6 text-white">
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-xl font-semibold text-blue-400 mb-3">🎯 Objective</h3>
                <p className="text-gray-300">Fill 80% of the playing area to advance to the next level while avoiding the red enemies.</p>
              </div>
              
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                <h3 className="text-xl font-semibold text-green-400 mb-3">🎮 Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Movement:</strong> Arrow keys or WASD</p>
                    <p><strong>High Scores:</strong> Press H</p>
                    <p><strong>Instructions:</strong> Press I</p>
                  </div>
                  <div>
                    <p><strong>Restart:</strong> Spacebar (when game over)</p>
                    <p><strong>Close dialogs:</strong> Escape</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-xl font-semibold text-purple-400 mb-3">🎲 Gameplay</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong>Safe Zone:</strong> Purple filled areas are safe from enemies</li>
                  <li>• <strong>Trail:</strong> Pink trail shows your path in dangerous territory</li>
                  <li>• <strong>Complete Areas:</strong> Return to safe zone to fill enclosed areas</li>
                  <li>• <strong>Avoid Enemies:</strong> Red enemies will end your game if they touch you or your trail</li>
                  <li>• <strong>Bombs:</strong> Collect orange bombs to temporarily stick enemies</li>
                </ul>
              </div>
              
              <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/30">
                <h3 className="text-xl font-semibold text-yellow-400 mb-3">🏆 Scoring</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <p>• Exploring: +1 point per move</p>
                    <p>• Completing areas: Exponential bonus</p>
                    <p>• Collecting bombs: +50 points</p>
                  </div>
                  <div>
                    <p>• Sticking enemies: +100 points</p>
                    <p>• Level completion: Level × 1000</p>
                    <p>• Speed bonus: +500 (85%+ filled)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
              >
                Got it! Let's Play
              </button>
            </div>
          </div>
        </div>
      )}
      
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