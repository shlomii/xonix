import { GameState } from '../types/game';
import { PlayerPhysics } from './physics/PlayerPhysics';
import { EnemyPhysics } from './physics/EnemyPhysics';
import { TrailManager } from './game/TrailManager';
import { CollisionDetector } from './game/CollisionDetector';
import { LevelManager } from './game/LevelManager';
import { SurpriseManager } from './game/SurpriseManager';
import { LivesManager } from './game/LivesManager';
import { audioManager } from './AudioManager';

export class GameLogic {
  private playerPhysics: PlayerPhysics;
  private enemyPhysics: EnemyPhysics;
  private trailManager: TrailManager;
  private collisionDetector: CollisionDetector;
  private levelManager: LevelManager;
  private surpriseManager: SurpriseManager;
  private livesManager: LivesManager;
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
    this.surpriseManager = new SurpriseManager(gridSize, canvasWidth, canvasHeight);
    this.livesManager = new LivesManager();
  }

  updateGame(gameState: GameState): GameState {
    const newState = { ...gameState };

    // Handle level transition state with frame-based counter
    if (newState.isLevelTransition) {
      this.transitionFrameCounter++;
      
      if (this.transitionFrameCounter >= this.TRANSITION_DURATION_FRAMES) {
        this.levelManager.completeLevelTransition(newState);
        this.transitionFrameCounter = 0;
        
        // Spawn surprises for the new level
        this.surpriseManager.spawnLevelSurprises(newState);
      }
      return newState;
    }

    // Reset transition counter when not in transition
    this.transitionFrameCounter = 0;

    // Always ensure border is initialized - this handles both first run and restarts
    if (newState.filledCells.size === 0) {
      this.trailManager.initializeBorder(newState);
      // Initialize lives for new game
      this.livesManager.initializeLives(newState);
      // Also spawn initial surprises
      this.surpriseManager.spawnLevelSurprises(newState);
    }

    // Check for extra lives based on score
    this.livesManager.checkForExtraLife(newState);

    // Update surprises
    this.surpriseManager.updateSurprises(newState);
    
    // Check for player collecting surprises
    this.surpriseManager.checkPlayerCollection(newState);
    
    // Check for enemy-bomb collisions
    this.surpriseManager.checkEnemyBombCollisions(newState);

    // Update player movement with physics
    this.playerPhysics.updatePlayerMovement(newState);
    
    // Update enemies with magnetic forces from bombs
    this.enemyPhysics.updateEnemies(newState, (x, y, state) => 
      this.surpriseManager.getMagneticForce(x, y, state)
    );
    
    // Check collisions and handle life loss
    const wasAlive = newState.isAlive;
    this.collisionDetector.checkCollisions(newState);
    
    if (wasAlive && !newState.isAlive) {
      // Player died - check if they have lives remaining
      const continueGame = this.livesManager.handlePlayerDeath(newState);
      
      if (!continueGame) {
        // Game over - no lives left
        this.surpriseManager.clearAllSurprises(newState);
      }
      // If continueGame is true, player was revived and game continues
    }
    
    // Update trail and check for area completion
    this.trailManager.updateTrail(newState);
    
    // Check for level completion and play transition sound
    if (this.levelManager.checkLevelCompletion(newState)) {
      audioManager.playLevelTransition();
      this.levelManager.advanceLevel(newState);
    }
    
    return newState;
  }
}