
import { GameState } from '../types/game';
import { PlayerPhysics } from './physics/PlayerPhysics';
import { EnemyPhysics } from './physics/EnemyPhysics';
import { TrailManager } from './game/TrailManager';
import { CollisionDetector } from './game/CollisionDetector';

export class GameLogic {
  private playerPhysics: PlayerPhysics;
  private enemyPhysics: EnemyPhysics;
  private trailManager: TrailManager;
  private collisionDetector: CollisionDetector;
  private gridSize: number;
  private initialized: boolean = false;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.playerPhysics = new PlayerPhysics(gridSize, canvasWidth, canvasHeight);
    this.enemyPhysics = new EnemyPhysics(gridSize, canvasWidth, canvasHeight);
    this.trailManager = new TrailManager(gridSize, canvasWidth, canvasHeight);
    this.collisionDetector = new CollisionDetector(gridSize);
  }

  updateGame(gameState: GameState): GameState {
    const newState = { ...gameState };

    // Initialize border on first update
    if (!this.initialized) {
      this.trailManager.initializeBorder(newState);
      this.initialized = true;
    }

    // Update player movement with physics
    this.playerPhysics.updatePlayerMovement(newState);
    
    // Update enemies
    this.enemyPhysics.updateEnemies(newState);
    
    // Check collisions
    this.collisionDetector.checkCollisions(newState);
    
    // Update trail and check for area completion
    this.trailManager.updateTrail(newState);
    
    return newState;
  }
}
