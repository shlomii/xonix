
import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private accelerationTimers: Map<number, number> = new Map();
  private readonly ACCELERATION_FACTOR = 1.5;
  private readonly DECELERATION_FACTOR = 0.98;
  private readonly ACCELERATION_DURATION = 1000; // milliseconds
  private readonly MIN_SPEED = 1;
  private readonly MAX_SPEED = 4;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  updateEnemies(gameState: GameState) {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    const currentTime = Date.now();

    gameState.enemies.forEach((enemy, index) => {
      // Apply deceleration for enemies that are in acceleration phase
      const accelerationStartTime = this.accelerationTimers.get(index);
      if (accelerationStartTime && currentTime - accelerationStartTime > this.ACCELERATION_DURATION) {
        // Gradually decelerate
        const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (currentSpeed > this.MIN_SPEED) {
          enemy.vx *= this.DECELERATION_FACTOR;
          enemy.vy *= this.DECELERATION_FACTOR;
        }
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Bounce off walls (canvas boundaries) with acceleration
      let wallBounce = false;
      if (enemy.x <= 0 || enemy.x >= this.canvasWidth - this.gridSize) {
        enemy.vx = -enemy.vx;
        enemy.x = Math.max(0, Math.min(this.canvasWidth - this.gridSize, enemy.x));
        wallBounce = true;
      }
      if (enemy.y <= 0 || enemy.y >= this.canvasHeight - this.gridSize) {
        enemy.vy = -enemy.vy;
        enemy.y = Math.max(0, Math.min(this.canvasHeight - this.gridSize, enemy.y));
        wallBounce = true;
      }

      // Apply acceleration for wall bounces
      if (wallBounce) {
        this.accelerateEnemy(enemy, index, currentTime);
      }

      // Bounce off filled areas (but NOT the border cells)
      const gridX = Math.floor(enemy.x / this.gridSize);
      const gridY = Math.floor(enemy.y / this.gridSize);
      
      // Check if it's a border cell
      const isBorderCell = gridX === 0 || gridX === gridWidth - 1 || gridY === 0 || gridY === gridHeight - 1;
      
      // Only bounce off filled cells that are NOT border cells
      if (!isBorderCell && gameState.filledCells.has(`${gridX},${gridY}`)) {
        enemy.vx = -enemy.vx;
        enemy.vy = -enemy.vy;
        
        // Apply acceleration and deceleration for filled area bounces
        this.accelerateEnemy(enemy, index, currentTime);
      }
    });
  }

  private accelerateEnemy(enemy: { vx: number; vy: number }, index: number, currentTime: number) {
    // Calculate current speed
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    // Don't accelerate if already at max speed
    if (currentSpeed >= this.MAX_SPEED) return;
    
    // Apply acceleration
    enemy.vx *= this.ACCELERATION_FACTOR;
    enemy.vy *= this.ACCELERATION_FACTOR;
    
    // Cap the speed to maximum
    const newSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (newSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / newSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
    
    // Set acceleration timer for this enemy
    this.accelerationTimers.set(index, currentTime);
  }
}
