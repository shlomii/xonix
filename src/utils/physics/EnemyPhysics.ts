import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private accelerationTimers: Map<number, number> = new Map();
  private baseVelocities: Map<number, {vx: number, vy: number}> = new Map();

  // Adjusted physics constants for slower, more controlled movement
  private readonly BASE_SPEED = 0.3;
  private readonly MAX_SPEED = 1.8;
  private readonly MIN_SPEED = 0.1;
  private readonly PLAYER_ATTRACTION_STRENGTH = 0.1; // Reduced for less constant pulling
  private readonly EXPLORATION_FORCE = 0.1; // Reduced exploration force
  private readonly WALL_BOUNCE_DAMPING = 0.9;
  private readonly FILLED_BOUNCE_BOOST = 1.8; // Reduced from 3.0
  private readonly ENEMY_COLLISION_BOOST = 1.6; // New: enemy collision acceleration
  private readonly FRICTION = 0.96; // Increased friction for better deceleration
  private readonly ACCELERATION_BOOST = 1.4; // Reduced from 1.3
  private readonly SEEK_DISTANCE_THRESHOLD = 150; // Reduced threshold
  private readonly ACCELERATION_DECAY_TIME = 2000; // 2 seconds to decay acceleration
  private readonly ENEMY_COLLISION_RADIUS = 20; // Collision detection radius between enemies

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
      // Initialize base velocity for new enemies
      if (!this.baseVelocities.has(index)) {
        const angle = Math.random() * Math.PI * 2;
        this.baseVelocities.set(index, {
          vx: Math.cos(angle) * this.BASE_SPEED,
          vy: Math.sin(angle) * this.BASE_SPEED
        });
      }

      // Apply deceleration from friction
      this.applyDeceleration(enemy, index, currentTime);

      // Check for enemy-to-enemy collisions
      this.checkEnemyCollisions(enemy, index, gameState.enemies, currentTime);

      // Apply subtle player attraction only when far away and moving slowly
      this.applyConditionalPlayerAttraction(enemy, gameState.player, index);

      // Add minimal exploration behavior when very slow
      this.applyMinimalExploration(enemy, index, currentTime);

      // Enhanced collision detection with filled areas
      const collisionResult = this.checkFilledAreaCollision(enemy, gameState, gridWidth, gridHeight);
      
      if (collisionResult.willCollide) {
        // Bounce immediately before moving
        this.bounceFromFilledArea(enemy, index, currentTime, collisionResult.normal);
        console.log(`Enemy ${index} bounced from filled area at (${Math.floor(enemy.x / this.gridSize)}, ${Math.floor(enemy.y / this.gridSize)})`);
      } else {
        // Update position only if safe
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
      }

      // Handle wall collisions
      this.handleWallCollisions(enemy, index, currentTime);

      // Safety check - separate from filled areas if somehow stuck
      this.separateFromFilledAreas(enemy, gameState, gridWidth, gridHeight);

      // Enforce speed limits
      this.enforceSpeedLimits(enemy, index);
    });
  }

  private applyDeceleration(enemy: { vx: number; vy: number }, index: number, currentTime: number) {
    // Apply basic friction
    enemy.vx *= this.FRICTION;
    enemy.vy *= this.FRICTION;

    // Apply acceleration decay if time has passed since last acceleration
    const lastAcceleration = this.accelerationTimers.get(index);
    if (lastAcceleration) {
      const timeSinceAcceleration = currentTime - lastAcceleration;
      if (timeSinceAcceleration > this.ACCELERATION_DECAY_TIME) {
        // Gradually return to base speed
        const baseVel = this.baseVelocities.get(index);
        if (baseVel) {
          const decayFactor = 0.98; // Gradual decay
          enemy.vx = enemy.vx * decayFactor + baseVel.vx * (1 - decayFactor);
          enemy.vy = enemy.vy * decayFactor + baseVel.vy * (1 - decayFactor);
        }
      }
    }
  }

  private checkEnemyCollisions(
    enemy: { vx: number; vy: number; x: number; y: number },
    index: number,
    enemies: Array<{ vx: number; vy: number; x: number; y: number }>,
    currentTime: number
  ) {
    for (let i = 0; i < enemies.length; i++) {
      if (i === index) continue; // Skip self

      const otherEnemy = enemies[i];
      const dx = enemy.x - otherEnemy.x;
      const dy = enemy.y - otherEnemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.ENEMY_COLLISION_RADIUS && distance > 0) {
        // Calculate collision normal
        const normalX = dx / distance;
        const normalY = dy / distance;

        // Calculate relative velocity
        const relativeVx = enemy.vx - otherEnemy.vx;
        const relativeVy = enemy.vy - otherEnemy.vy;

        // Check if enemies are moving towards each other
        const relativeSpeed = relativeVx * normalX + relativeVy * normalY;
        if (relativeSpeed > 0) continue; // Moving away from each other

        // Apply collision response - enemies bounce off each other
        const bounceStrength = this.ENEMY_COLLISION_BOOST;
        enemy.vx += normalX * bounceStrength;
        enemy.vy += normalY * bounceStrength;
        otherEnemy.vx -= normalX * bounceStrength;
        otherEnemy.vy -= normalY * bounceStrength;

        // Mark both enemies as recently accelerated
        this.accelerationTimers.set(index, currentTime);
        this.accelerationTimers.set(i, currentTime);

        console.log(`Enemies ${index} and ${i} collided and accelerated`);
        break; // Only handle one collision per frame
      }
    }
  }

  private applyConditionalPlayerAttraction(
    enemy: { vx: number; vy: number; x: number; y: number },
    player: { x: number; y: number },
    index: number
  ) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);

    // Only apply attraction when far from player AND moving slowly
    if (distance > this.SEEK_DISTANCE_THRESHOLD && currentSpeed < this.BASE_SPEED * 1.5) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Gentle attraction force
      const attractionForce = this.PLAYER_ATTRACTION_STRENGTH * 0.5;
      
      enemy.vx += normalizedX * attractionForce;
      enemy.vy += normalizedY * attractionForce;
    }
  }

  private applyMinimalExploration(
    enemy: { vx: number; vy: number; x: number; y: number },
    index: number,
    currentTime: number
  ) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);

    // Only add exploration when moving very slowly
    if (currentSpeed < this.MIN_SPEED * 2) {
      const time = currentTime * 0.001;
      const explorationX = Math.sin(time + index * 2.3) * this.EXPLORATION_FORCE;
      const explorationY = Math.cos(time * 1.1 + index * 1.9) * this.EXPLORATION_FORCE;
      
      enemy.vx += explorationX;
      enemy.vy += explorationY;
    }
  }

  private checkFilledAreaCollision(
    enemy: { vx: number; vy: number; x: number; y: number },
    gameState: GameState,
    gridWidth: number,
    gridHeight: number
  ): { willCollide: boolean; normal: { x: number; y: number } } {
    const enemyRadius = this.gridSize * 0.4; // Enemy effective radius
    const nextX = enemy.x + enemy.vx;
    const nextY = enemy.y + enemy.vy;
    
    // Check multiple points around the enemy's predicted position
    const checkPoints = [
      { x: nextX, y: nextY }, // Center
      { x: nextX - enemyRadius, y: nextY }, // Left
      { x: nextX + enemyRadius, y: nextY }, // Right  
      { x: nextX, y: nextY - enemyRadius }, // Top
      { x: nextX, y: nextY + enemyRadius }, // Bottom
    ];

    for (const point of checkPoints) {
      const gridX = Math.floor(point.x / this.gridSize);
      const gridY = Math.floor(point.y / this.gridSize);
      
      // Check bounds
      if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight) {
        continue;
      }
      
      // Check if this grid cell is filled (including borders and filled areas)
      if (gameState.filledCells.has(`${gridX},${gridY}`)) {
        // Calculate collision normal based on which side of the cell we're hitting
        const cellCenterX = gridX * this.gridSize + this.gridSize / 2;
        const cellCenterY = gridY * this.gridSize + this.gridSize / 2;
        
        const dx = enemy.x - cellCenterX;
        const dy = enemy.y - cellCenterY;
        
        // Normalize the collision normal
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normal = distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };
        
        return { willCollide: true, normal };
      }
    }

    return { willCollide: false, normal: { x: 0, y: 0 } };
  }

  private bounceFromFilledArea(
    enemy: { vx: number; vy: number; x: number; y: number },
    index: number,
    currentTime: number,
    normal: { x: number; y: number }
  ) {
    // Calculate reflection vector: v' = v - 2(v·n)n
    const dotProduct = enemy.vx * normal.x + enemy.vy * normal.y;
    const reflectedVx = enemy.vx - 2 * dotProduct * normal.x;
    const reflectedVy = enemy.vy - 2 * dotProduct * normal.y;
    
    // Apply bounce with acceleration boost
    enemy.vx = reflectedVx * this.FILLED_BOUNCE_BOOST;
    enemy.vy = reflectedVy * this.FILLED_BOUNCE_BOOST;
    
    // Add some randomness to prevent repetitive patterns
    const angleVariation = (Math.random() - 0.5) * 0.3;
    const cos = Math.cos(angleVariation);
    const sin = Math.sin(angleVariation);
    const newVx = enemy.vx * cos - enemy.vy * sin;
    const newVy = enemy.vx * sin + enemy.vy * cos;
    
    enemy.vx = newVx;
    enemy.vy = newVy;
    
    // Update base velocity
    this.baseVelocities.set(index, {
      vx: enemy.vx,
      vy: enemy.vy
    });
    
    this.accelerateEnemy(enemy, index, currentTime);
  }

  private separateFromFilledAreas(
    enemy: { vx: number; vy: number; x: number; y: number },
    gameState: GameState,
    gridWidth: number,
    gridHeight: number
  ) {
    const gridX = Math.floor(enemy.x / this.gridSize);
    const gridY = Math.floor(enemy.y / this.gridSize);
    
    // Check if enemy is currently in a filled area
    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight && 
        gameState.filledCells.has(`${gridX},${gridY}`)) {
      
      console.log(`Enemy stuck in filled area at (${gridX}, ${gridY}), separating...`);
      
      // Find nearest empty cell and push enemy there
      let minDistance = Infinity;
      let bestX = enemy.x;
      let bestY = enemy.y;
      
      // Check surrounding cells in expanding radius
      for (let radius = 1; radius <= 3; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; // Only check perimeter
            
            const checkX = gridX + dx;
            const checkY = gridY + dy;
            
            if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight) {
              if (!gameState.filledCells.has(`${checkX},${checkY}`)) {
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance < minDistance) {
                  minDistance = distance;
                  bestX = checkX * this.gridSize + this.gridSize / 2;
                  bestY = checkY * this.gridSize + this.gridSize / 2;
                }
              }
            }
          }
        }
        if (minDistance < Infinity) break; // Found a spot
      }
      
      // Move enemy to best position
      enemy.x = bestX;
      enemy.y = bestY;
      
      // Give enemy a strong push away from filled areas
      const pushAngle = Math.atan2(bestY - (gridY * this.gridSize + this.gridSize / 2), 
                                   bestX - (gridX * this.gridSize + this.gridSize / 2));
      enemy.vx = Math.cos(pushAngle) * this.BASE_SPEED * 2;
      enemy.vy = Math.sin(pushAngle) * this.BASE_SPEED * 2;
    }
  }

  private handleWallCollisions(
    enemy: { vx: number; vy: number; x: number; y: number },
    index: number,
    currentTime: number
  ) {
    let bounced = false;

    // Horizontal walls
    if (enemy.x <= 0) {
      enemy.x = 0;
      enemy.vx = Math.abs(enemy.vx) * this.WALL_BOUNCE_DAMPING * this.FILLED_BOUNCE_BOOST;
      bounced = true;
    } else if (enemy.x >= this.canvasWidth - this.gridSize) {
      enemy.x = this.canvasWidth - this.gridSize;
      enemy.vx = -Math.abs(enemy.vx) * this.WALL_BOUNCE_DAMPING * this.FILLED_BOUNCE_BOOST;
      bounced = true;
    }

    // Vertical walls
    if (enemy.y <= 0) {
      enemy.y = 0;
      enemy.vy = Math.abs(enemy.vy) * this.WALL_BOUNCE_DAMPING * this.FILLED_BOUNCE_BOOST;
      bounced = true;
    } else if (enemy.y >= this.canvasHeight - this.gridSize) {
      enemy.y = this.canvasHeight - this.gridSize;
      enemy.vy = -Math.abs(enemy.vy) * this.WALL_BOUNCE_DAMPING * this.FILLED_BOUNCE_BOOST;
      bounced = true;
    }

    if (bounced) {
      // Update base velocity when bouncing
      this.baseVelocities.set(index, {
        vx: enemy.vx,
        vy: enemy.vy
      });
      
      // Acceleration boost after bouncing with wall
      this.accelerateEnemy(enemy, index, currentTime);
    }
  }

  private accelerateEnemy(
    enemy: { vx: number; vy: number },
    index: number,
    currentTime: number
  ) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    if (currentSpeed < this.MAX_SPEED) {
      enemy.vx *= this.ACCELERATION_BOOST;
      enemy.vy *= this.ACCELERATION_BOOST;
      
      // Cap at max speed
      const newSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
      if (newSpeed > this.MAX_SPEED) {
        const speedRatio = this.MAX_SPEED / newSpeed;
        enemy.vx *= speedRatio;
        enemy.vy *= speedRatio;
      }
      
      this.accelerationTimers.set(index, currentTime);
    }
  }

  private enforceSpeedLimits(
    enemy: { vx: number; vy: number },
    index: number
  ) {
    const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    
    // Ensure minimum speed - but allow very slow movement
    if (currentSpeed < this.MIN_SPEED && currentSpeed > 0.05) {
      const baseVel = this.baseVelocities.get(index);
      if (baseVel) {
        // Restore some base velocity if too slow
        const factor = this.MIN_SPEED / Math.max(currentSpeed, 0.1);
        enemy.vx = baseVel.vx * factor;
        enemy.vy = baseVel.vy * factor;
      } else {
        // Fallback: give random direction at minimum speed
        const angle = Math.random() * Math.PI * 2;
        enemy.vx = Math.cos(angle) * this.MIN_SPEED;
        enemy.vy = Math.sin(angle) * this.MIN_SPEED;
      }
    }
    
    // Enforce maximum speed
    if (currentSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / currentSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
  }
}
