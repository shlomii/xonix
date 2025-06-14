
import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private accelerationTimers: Map<number, number> = new Map();
  private baseVelocities: Map<number, {vx: number, vy: number}> = new Map();
  private momentumFactors: Map<number, number> = new Map();
  
  // Enhanced physics constants
  private readonly ACCELERATION_FACTOR = 2.2;
  private readonly DECELERATION_FACTOR = 0.985;
  private readonly FRICTION_FACTOR = 0.995;
  private readonly ACCELERATION_DURATION = 1200; // milliseconds
  private readonly MIN_SPEED = 0.8;
  private readonly MAX_SPEED = 5.5;
  private readonly BASE_SPEED_VARIATION = 0.4; // Random speed variation
  private readonly MOMENTUM_DECAY = 0.98;
  private readonly WALL_BOUNCE_ENERGY_LOSS = 0.85;
  private readonly FILLED_BOUNCE_ENERGY_GAIN = 1.15;

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
      // Initialize base velocity and momentum for new enemies
      if (!this.baseVelocities.has(index)) {
        this.baseVelocities.set(index, { vx: enemy.vx, vy: enemy.vy });
        this.momentumFactors.set(index, 1.0);
      }

      // Apply physics-based movement variations
      this.applyPhysicsVariations(enemy, index);

      // Handle acceleration/deceleration cycles
      this.handleAccelerationCycle(enemy, index, currentTime);

      // Apply friction to simulate air resistance
      this.applyFriction(enemy);

      // Update position with current velocity
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Handle wall collisions with energy loss
      this.handleWallCollisions(enemy, index, currentTime);

      // Handle filled area collisions with energy gain
      this.handleFilledAreaCollisions(enemy, index, currentTime, gameState, gridWidth, gridHeight);

      // Ensure minimum speed is maintained
      this.enforceSpeedLimits(enemy);
    });
  }

  private applyPhysicsVariations(enemy: { vx: number; vy: number }, index: number) {
    // Add subtle random variations to simulate air currents and imperfections
    const timeVariation = Math.sin(Date.now() * 0.001 + index) * 0.05;
    const randomVariation = (Math.random() - 0.5) * this.BASE_SPEED_VARIATION * 0.1;
    
    enemy.vx += timeVariation + randomVariation;
    enemy.vy += timeVariation * 0.7 + randomVariation * 0.8;
  }

  private handleAccelerationCycle(enemy: { vx: number; vy: number }, index: number, currentTime: number) {
    const accelerationStartTime = this.accelerationTimers.get(index);
    
    if (accelerationStartTime) {
      const timeSinceAcceleration = currentTime - accelerationStartTime;
      
      if (timeSinceAcceleration < this.ACCELERATION_DURATION) {
        // Still in acceleration phase - apply momentum boost
        const momentum = this.momentumFactors.get(index) || 1.0;
        const accelerationProgress = timeSinceAcceleration / this.ACCELERATION_DURATION;
        const boostFactor = 1 + (momentum * 0.3 * (1 - accelerationProgress));
        
        enemy.vx *= boostFactor;
        enemy.vy *= boostFactor;
      } else {
        // Deceleration phase
        const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (currentSpeed > this.MIN_SPEED * 1.2) {
          // Gradual deceleration with momentum decay
          const decelerationFactor = this.DECELERATION_FACTOR + (Math.random() * 0.01 - 0.005);
          enemy.vx *= decelerationFactor;
          enemy.vy *= decelerationFactor;
          
          // Decay momentum
          const currentMomentum = this.momentumFactors.get(index) || 1.0;
          this.momentumFactors.set(index, currentMomentum * this.MOMENTUM_DECAY);
        } else {
          // Clear acceleration timer when speed is normalized
          this.accelerationTimers.delete(index);
        }
      }
    }
  }

  private applyFriction(enemy: { vx: number; vy: number }) {
    // Simulate air resistance
    enemy.vx *= this.FRICTION_FACTOR;
    enemy.vy *= this.FRICTION_FACTOR;
  }

  private handleWallCollisions(enemy: { vx: number; vy: number; x: number; y: number }, index: number, currentTime: number) {
    let wallBounce = false;
    
    if (enemy.x <= 0 || enemy.x >= this.canvasWidth - this.gridSize) {
      enemy.vx = -enemy.vx * this.WALL_BOUNCE_ENERGY_LOSS; // Energy loss on wall bounce
      enemy.x = Math.max(0, Math.min(this.canvasWidth - this.gridSize, enemy.x));
      wallBounce = true;
    }
    
    if (enemy.y <= 0 || enemy.y >= this.canvasHeight - this.gridSize) {
      enemy.vy = -enemy.vy * this.WALL_BOUNCE_ENERGY_LOSS; // Energy loss on wall bounce
      enemy.y = Math.max(0, Math.min(this.canvasHeight - this.gridSize, enemy.y));
      wallBounce = true;
    }

    if (wallBounce) {
      // Add slight randomness to wall bounces
      const randomFactor = 0.9 + Math.random() * 0.2;
      enemy.vx *= randomFactor;
      enemy.vy *= randomFactor * 0.95;
      
      this.accelerateEnemy(enemy, index, currentTime, 0.8); // Moderate acceleration for walls
    }
  }

  private handleFilledAreaCollisions(
    enemy: { vx: number; vy: number; x: number; y: number }, 
    index: number, 
    currentTime: number, 
    gameState: GameState,
    gridWidth: number,
    gridHeight: number
  ) {
    const gridX = Math.floor(enemy.x / this.gridSize);
    const gridY = Math.floor(enemy.y / this.gridSize);
    
    // Check if it's a border cell
    const isBorderCell = gridX === 0 || gridX === gridWidth - 1 || gridY === 0 || gridY === gridHeight - 1;
    
    // Only bounce off filled cells that are NOT border cells
    if (!isBorderCell && gameState.filledCells.has(`${gridX},${gridY}`)) {
      // More dynamic bounce with energy gain
      enemy.vx = -enemy.vx * this.FILLED_BOUNCE_ENERGY_GAIN;
      enemy.vy = -enemy.vy * this.FILLED_BOUNCE_ENERGY_GAIN;
      
      // Add angular variation to make bounces less predictable
      const angleVariation = (Math.random() - 0.5) * 0.3;
      const cos = Math.cos(angleVariation);
      const sin = Math.sin(angleVariation);
      const newVx = enemy.vx * cos - enemy.vy * sin;
      const newVy = enemy.vx * sin + enemy.vy * cos;
      
      enemy.vx = newVx;
      enemy.vy = newVy;
      
      this.accelerateEnemy(enemy, index, currentTime, 1.2); // Strong acceleration for filled areas
    }
  }

  private accelerateEnemy(enemy: { vx: number; vy: number }, index: number, currentTime: number, intensityFactor: number = 1.0) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    // Don't accelerate if already at max speed
    if (currentSpeed >= this.MAX_SPEED) return;
    
    // Apply acceleration with intensity factor
    const accelerationFactor = this.ACCELERATION_FACTOR * intensityFactor;
    enemy.vx *= accelerationFactor;
    enemy.vy *= accelerationFactor;
    
    // Cap the speed to maximum
    const newSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (newSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / newSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
    
    // Set acceleration timer and momentum for this enemy
    this.accelerationTimers.set(index, currentTime);
    const currentMomentum = this.momentumFactors.get(index) || 1.0;
    this.momentumFactors.set(index, Math.min(currentMomentum * 1.1, 2.0)); // Build momentum up to 2x
  }

  private enforceSpeedLimits(enemy: { vx: number; vy: number }) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    // Ensure minimum speed
    if (currentSpeed < this.MIN_SPEED) {
      const speedRatio = this.MIN_SPEED / currentSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
    
    // Ensure maximum speed (should already be handled in acceleration, but double-check)
    if (currentSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / currentSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
  }
}
