
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
  private levelTransitionTimer: number | null = null;

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

    // Handle level transition state
    if (newState.isLevelTransition) {
      // Only set the timer once
      if (this.levelTransitionTimer === null) {
        this.levelTransitionTimer = window.setTimeout(() => {
          this.levelManager.completeLevelTransition(newState);
          this.levelTransitionTimer = null;
        }, 1500); // 1.5 second transition
      }
      return newState;
    }

    // Clear any existing timer if we're not in transition
    if (this.levelTransitionTimer !== null) {
      clearTimeout(this.levelTransitionTimer);
      this.levelTransitionTimer = null;
    }

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
