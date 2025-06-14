import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Position, Enemy } from '../types/game';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameRenderer } from '../utils/GameRenderer';
import { GameLogic } from '../utils/GameLogic';

const GRID_SIZE = 15; // Grid cell size in pixels
const ASPECT_RATIO = 4 / 3; // Width to height ratio

const XonixGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 900 });
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    enemies: [
      { x: 600, y: 300, vx: 2, vy: 1.5 },
      { x: 900, y: 450, vx: -1.5, vy: 2 },
      { x: 450, y: 600, vx: 1, vy: -2 },
      { x: 750, y: 675, vx: -2, vy: -1 }
    ],
    trail: [],
    filledCells: new Set(),
    score: 0,
    areaFilled: 0,
    isAlive: true,
    keys: new Set()
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
        { x: centerX - 200, y: centerY - 150, vx: 2, vy: 1.5 },
        { x: centerX + 100, y: centerY, vx: -1.5, vy: 2 },
        { x: centerX - 100, y: centerY + 100, vx: 1, vy: -2 },
        { x: centerX + 150, y: centerY + 150, vx: -2, vy: -1 }
      ],
      trail: [],
      filledCells: new Set(),
      score: 0,
      areaFilled: 0,
      isAlive: true
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
      return newState;
    });
  }, [gameState.isAlive]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      e.preventDefault();
      setGameState(prev => ({
        ...prev,
        keys: new Set([...prev.keys, key])
      }));
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setGameState(prev => {
      const newKeys = new Set(prev.keys);
      newKeys.delete(key);
      return { ...prev, keys: newKeys };
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useGameLoop(updateGame, 60);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderer.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = canvasDimensions.width;
    const displayHeight = canvasDimensions.height;
    
    // Set actual canvas size for high DPI
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    
    // Scale display size back to logical size
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Scale the drawing context to match device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Enable anti-aliasing for smoother rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderer.current.render(ctx, gameState);
  }, [gameState, canvasDimensions]);

  const resetGame = () => {
    const centerX = Math.floor(canvasDimensions.width / 2);
    const centerY = Math.floor(canvasDimensions.height / 2);
    
    setGameState({
      player: { x: 0, y: 0, vx: 0, vy: 0 },
      enemies: [
        { x: centerX - 200, y: centerY - 150, vx: 2, vy: 1.5 },
        { x: centerX + 100, y: centerY, vx: -1.5, vy: 2 },
        { x: centerX - 100, y: centerY + 100, vx: 1, vy: -2 },
        { x: centerX + 150, y: centerY + 150, vx: -2, vy: -1 }
      ],
      trail: [],
      filledCells: new Set(),
      score: 0,
      areaFilled: 0,
      isAlive: true,
      keys: new Set()
    });
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
          
          {!gameState.isAlive && (
            <div 
              className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`
              }}
            >
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Game Over</h2>
                <p className="text-xl text-gray-300 mb-6">Final Score: {gameState.score}</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 mb-4">
          <div className="bg-purple-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-400/30">
            <div className="text-sm text-purple-200">Score</div>
            <div className="text-2xl font-bold text-white">{gameState.score}</div>
          </div>
          <div className="bg-blue-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-400/30">
            <div className="text-sm text-blue-200">Area Filled</div>
            <div className="text-2xl font-bold text-white">{gameState.areaFilled.toFixed(1)}%</div>
          </div>
          <div className="bg-green-600/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-400/30">
            <div className="text-sm text-green-200">Status</div>
            <div className="text-2xl font-bold text-white">
              {gameState.isAlive ? 'Playing' : 'Game Over'}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          <p>Use Arrow Keys or WASD to move • Fill areas by completing closed shapes</p>
          <p>Avoid the red enemies • Fill 75% of the area to win!</p>
        </div>
      </div>
    </div>
  );
};

export default XonixGame;
