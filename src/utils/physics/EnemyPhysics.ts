import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private accelerationTimers: Map<number, number> = new Map();
  private baseVelocities: Map<number, {vx: number, vy: number}> = new Map();
  private momentumFactors: Map<number, number> = new Map();
  private beeState: Map<number, {
    targetX: number;
    targetY: number;
    wanderAngle: number;
    seekIntensity: number;
    lastPlayerDistance: number;
  }> = new Map();
  
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
  
  // Bee behavior constants
  private readonly PLAYER_ATTRACTION_FORCE = 0.15;
  private readonly WANDER_FORCE = 0.08;
  private readonly SEPARATION_FORCE = 0.12;
  private readonly SEEK_RADIUS = 200;
  private readonly WANDER_RADIUS = 30;
  private readonly CURVE_SMOOTHING = 0.15;
  private readonly DIRECTION_CHANGE_RATE = 0.02;

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
      // Initialize bee state for new enemies
      if (!this.beeState.has(index)) {
        this.beeState.set(index, {
          targetX: enemy.x,
          targetY: enemy.y,
          wanderAngle: Math.random() * Math.PI * 2,
          seekIntensity: 0.5 + Math.random() * 0.5,
          lastPlayerDistance: 0
        });
      }

      // Initialize base velocity and momentum for new enemies
      if (!this.baseVelocities.has(index)) {
        this.baseVelocities.set(index, { vx: enemy.vx, vy: enemy.vy });
        this.momentumFactors.set(index, 1.0);
      }

      // Apply bee-like intelligent movement
      this.applyBeeMovement(enemy, index, gameState.player, gameState.enemies);

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

  private applyBeeMovement(
    enemy: { vx: number; vy: number; x: number; y: number }, 
    index: number, 
    player: { x: number; y: number },
    allEnemies: Array<{ x: number; y: number }>
  ) {
    const beeState = this.beeState.get(index)!;
    
    // Calculate forces
    const playerForce = this.calculatePlayerAttraction(enemy, player, beeState);
    const wanderForce = this.calculateWanderForce(enemy, beeState);
    const separationForce = this.calculateSeparationForce(enemy, allEnemies, index);
    
    // Combine forces with different weights based on situation
    const distanceToPlayer = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
    );
    
    // Adjust behavior based on distance to player
    let playerWeight = beeState.seekIntensity;
    let wanderWeight = 1.0 - beeState.seekIntensity * 0.7;
    let separationWeight = 0.8;
    
    // Increase player attraction when close
    if (distanceToPlayer < this.SEEK_RADIUS) {
      playerWeight *= 1.5;
      wanderWeight *= 0.5;
    }
    
    // Apply adaptive behavior - if getting closer to player, increase attraction
    if (distanceToPlayer < beeState.lastPlayerDistance) {
      playerWeight *= 1.2;
    }
    beeState.lastPlayerDistance = distanceToPlayer;
    
    // Apply forces with smooth curves
    const desiredVx = (playerForce.x * playerWeight + wanderForce.x * wanderWeight + separationForce.x * separationWeight);
    const desiredVy = (playerForce.y * playerWeight + wanderForce.y * wanderWeight + separationForce.y * separationWeight);
    
    // Smooth steering using interpolation for curved movement
    enemy.vx += (desiredVx - enemy.vx) * this.CURVE_SMOOTHING;
    enemy.vy += (desiredVy - enemy.vy) * this.CURVE_SMOOTHING;
    
    // Add organic variations to simulate bee-like buzzing
    const buzzVariation = Math.sin(Date.now() * 0.01 + index * 2) * 0.3;
    const buzzVariation2 = Math.cos(Date.now() * 0.007 + index * 1.5) * 0.2;
    
    enemy.vx += buzzVariation;
    enemy.vy += buzzVariation2;
    
    // Update wander angle for next frame
    beeState.wanderAngle += (Math.random() - 0.5) * this.DIRECTION_CHANGE_RATE;
  }

  private calculatePlayerAttraction(
    enemy: { x: number; y: number }, 
    player: { x: number; y: number },
    beeState: { seekIntensity: number }
  ): { x: number; y: number } {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: 0, y: 0 };
    
    // Normalize and apply attraction force
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    
    // Apply inverse square law for more realistic attraction (but capped)
    const attractionStrength = Math.min(this.PLAYER_ATTRACTION_FORCE / (distance * 0.01), this.PLAYER_ATTRACTION_FORCE * 3);
    
    return {
      x: normalizedX * attractionStrength * beeState.seekIntensity,
      y: normalizedY * attractionStrength * beeState.seekIntensity
    };
  }

  private calculateWanderForce(
    enemy: { x: number; y: number; vx: number; vy: number },
    beeState: { wanderAngle: number; targetX: number; targetY: number }
  ): { x: number; y: number } {
    // Create a circular wander target ahead of the enemy
    const wanderDistance = 50;
    const centerX = enemy.x + enemy.vx * wanderDistance;
    const centerY = enemy.y + enemy.vy * wanderDistance;
    
    const targetX = centerX + Math.cos(beeState.wanderAngle) * this.WANDER_RADIUS;
    const targetY = centerY + Math.sin(beeState.wanderAngle) * this.WANDER_RADIUS;
    
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: 0, y: 0 };
    
    return {
      x: (dx / distance) * this.WANDER_FORCE,
      y: (dy / distance) * this.WANDER_FORCE
    };
  }

  private calculateSeparationForce(
    enemy: { x: number; y: number },
    allEnemies: Array<{ x: number; y: number }>,
    currentIndex: number
  ): { x: number; y: number } {
    let separationX = 0;
    let separationY = 0;
    let neighborCount = 0;
    const separationRadius = 40;
    
    allEnemies.forEach((otherEnemy, index) => {
      if (index === currentIndex) return;
      
      const dx = enemy.x - otherEnemy.x;
      const dy = enemy.y - otherEnemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0 && distance < separationRadius) {
        // Add separation force (stronger when closer)
        const separationStrength = (separationRadius - distance) / separationRadius;
        separationX += (dx / distance) * separationStrength;
        separationY += (dy / distance) * separationStrength;
        neighborCount++;
      }
    });
    
    if (neighborCount > 0) {
      separationX = (separationX / neighborCount) * this.SEPARATION_FORCE;
      separationY = (separationY / neighborCount) * this.SEPARATION_FORCE;
    }
    
    return { x: separationX, y: separationY };
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
    enemy.vx *= this.FRICTION_FACTOR;
    enemy.vy *= this.FRICTION_FACTOR;
  }

  private handleWallCollisions(enemy: { vx: number; vy: number; x: number; y: number }, index: number, currentTime: number) {
    let wallBounce = false;
    
    if (enemy.x <= 0 || enemy.x >= this.canvasWidth - this.gridSize) {
      enemy.vx = -enemy.vx * this.WALL_BOUNCE_ENERGY_LOSS;
      enemy.x = Math.max(0, Math.min(this.canvasWidth - this.gridSize, enemy.x));
      wallBounce = true;
    }
    
    if (enemy.y <= 0 || enemy.y >= this.canvasHeight - this.gridSize) {
      enemy.vy = -enemy.vy * this.WALL_BOUNCE_ENERGY_LOSS;
      enemy.y = Math.max(0, Math.min(this.canvasHeight - this.gridSize, enemy.y));
      wallBounce = true;
    }

    if (wallBounce) {
      // Add slight randomness to wall bounces
      const randomFactor = 0.9 + Math.random() * 0.2;
      enemy.vx *= randomFactor;
      enemy.vy *= randomFactor * 0.95;
      
      this.accelerateEnemy(enemy, index, currentTime, 0.8);
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
    
    const isBorderCell = gridX === 0 || gridX === gridWidth - 1 || gridY === 0 || gridY === gridHeight - 1;
    
    if (!isBorderCell && gameState.filledCells.has(`${gridX},${gridY}`)) {
      enemy.vx = -enemy.vx * this.FILLED_BOUNCE_ENERGY_GAIN;
      enemy.vy = -enemy.vy * this.FILLED_BOUNCE_ENERGY_GAIN;
      
      const angleVariation = (Math.random() - 0.5) * 0.3;
      const cos = Math.cos(angleVariation);
      const sin = Math.sin(angleVariation);
      const newVx = enemy.vx * cos - enemy.vy * sin;
      const newVy = enemy.vx * sin + enemy.vy * cos;
      
      enemy.vx = newVx;
      enemy.vy = newVy;
      
      this.accelerateEnemy(enemy, index, currentTime, 1.2);
    }
  }

  private accelerateEnemy(enemy: { vx: number; vy: number }, index: number, currentTime: number, intensityFactor: number = 1.0) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    if (currentSpeed >= this.MAX_SPEED) return;
    
    const accelerationFactor = this.ACCELERATION_FACTOR * intensityFactor;
    enemy.vx *= accelerationFactor;
    enemy.vy *= accelerationFactor;
    
    const newSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (newSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / newSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
    
    this.accelerationTimers.set(index, currentTime);
    const currentMomentum = this.momentumFactors.get(index) || 1.0;
    this.momentumFactors.set(index, Math.min(currentMomentum * 1.1, 2.0));
  }

  private enforceSpeedLimits(enemy: { vx: number; vy: number }) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    if (currentSpeed < this.MIN_SPEED) {
      const speedRatio = this.MIN_SPEED / currentSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
    
    if (currentSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / currentSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
  }
}
