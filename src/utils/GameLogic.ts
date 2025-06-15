
import { GameState } from '../types/game';
import { PlayerPhysics } from './physics/PlayerPhysics';
import { EnemyPhysics } from './physics/EnemyPhysics';
import { TrailManager } from './game/TrailManager';
import { CollisionDetector } from './game/CollisionDetector';
import { LevelManager } from './game/LevelManager';

export class GameLogic {
  private playerPhysics: PlayerPhysics;
  private enemyPhysics: EnemyPhysics;
  private trailManager: TrailManager;
  private collisionDetector: CollisionDetector;
  private levelManager: LevelManager;
  private gridSize: number;
  private transitionFrameCounter: number = 0;
  private readonly TRANSITION_DURATION_FRAMES = 90; // 1.5 seconds at 60fps

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.playerPhysics = new PlayerPhysics(gridSize, canvasWidth, canvasHeight);
    this.enemyPhysics = new EnemyPhysics(gridSize, canvasWidth, canvasHeight);
    this.trailManager = new TrailManager(gridSize, canvasWidth, canvasHeight);
    this.collisionDetector = new CollisionDetector(gridSize);
    this.levelManager = new LevelManager(gridSize, canvasWidth, canvasHeight);
  }

  updateGame(gameState: GameState): GameState {
    const newState = { ...gameState };

    // Handle level transition state with frame-based counter
    if (newState.isLevelTransition) {
      this.transitionFrameCounter++;
      
      if (this.transitionFrameCounter >= this.TRANSITION_DURATION_FRAMES) {
        this.levelManager.completeLevelTransition(newState);
        this.transitionFrameCounter = 0;
      }
      return newState;
    }

    // Reset transition counter when not in transition
    this.transitionFrameCounter = 0;

    // Always ensure border is initialized - this handles both first run and restarts
    if (newState.filledCells.size === 0) {
      this.trailManager.initializeBorder(newState);
    }

    // Update player movement with physics
    this.playerPhysics.updatePlayerMovement(newState);
    
    // Update enemies
    this.enemyPhysics.updateEnemies(newState);
    
    // Check collisions
    this.collisionDetector.checkCollisions(newState);
    
    // Update trail and check for area completion
    this.trailManager.updateTrail(newState);
    
    // Check for level completion
    if (this.levelManager.checkLevelCompletion(newState)) {
      this.levelManager.advanceLevel(newState);
    }
    
    return newState;
  }
}
