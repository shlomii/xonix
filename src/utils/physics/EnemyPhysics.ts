import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private accelerationTimers: Map<number, number> = new Map();
  private baseVelocities: Map<number, {vx: number, vy: number}> = new Map();

  // Enhanced physics constants for smoother and faster gameplay
  private readonly BASE_SPEED = 1.2;
  private readonly MAX_SPEED = 5.5;
  private readonly MIN_SPEED = 0.3;
  private readonly PLAYER_ATTRACTION_STRENGTH = 0.08;
  private readonly EXPLORATION_FORCE = 0.08;
  private readonly WALL_BOUNCE_DAMPING = 0.96;
  private readonly FILLED_BOUNCE_BOOST = 3.2;
  private readonly ENEMY_COLLISION_BOOST = 2.5;
  private readonly FRICTION = 0.985;
  private readonly ACCELERATION_BOOST = 1.8;
  private readonly SEEK_DISTANCE_THRESHOLD = 150;
  private readonly ACCELERATION_DECAY_TIME = 2000;
  private readonly ENEMY_COLLISION_RADIUS = 20;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  updateEnemies(gameState: GameState, getMagneticForce?: (x: number, y: number, gameState: GameState) => {fx: number, fy: number}) {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    const currentTime = Date.now();

    gameState.enemies.forEach((enemy, index) => {
      // Initialize base velocity for new enemies
      if (!this.baseVelocities.has(index)) {
        const angle = Math.random() * Math.PI * 2;
        const levelSpeedMultiplier = 1 + (gameState.level - 1) * 0.2;
        this.baseVelocities.set(index, {
          vx: Math.cos(angle) * this.BASE_SPEED * levelSpeedMultiplier,
          vy: Math.sin(angle) * this.BASE_SPEED * levelSpeedMultiplier
        });
      }

      // Apply magnetic forces from bombs if available - ENHANCED PRIORITY
      let isMagneticallyAttracted = false;
      if (getMagneticForce) {
        const magneticForce = getMagneticForce(enemy.x, enemy.y, gameState);
        if (Math.abs(magneticForce.fx) > 0.01 || Math.abs(magneticForce.fy) > 0.01) {
          // VERY strong magnetic attraction completely overrides normal movement
          enemy.vx = magneticForce.fx * 3; // Multiply by 3 for even stronger attraction
          enemy.vy = magneticForce.fy * 3;
          this.accelerationTimers.set(index, currentTime);
          isMagneticallyAttracted = true;
          
          // Higher speed cap when being magnetically attracted
          const magneticSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
          if (magneticSpeed > this.MAX_SPEED * 2) { // Increased from 1.5 to 2
            const speedRatio = (this.MAX_SPEED * 2) / magneticSpeed;
            enemy.vx *= speedRatio;
            enemy.vy *= speedRatio;
          }
        }
      }

      // Only apply other behaviors if NOT magnetically attracted
      if (!isMagneticallyAttracted) {
        // Apply smoother deceleration
        this.applySmoothDeceleration(enemy, index, currentTime);

        // Check for enemy-to-enemy collisions
        this.checkEnemyCollisions(enemy, index, gameState.enemies, currentTime);

        // Apply subtle player attraction only when far away and moving slowly
        this.applyConditionalPlayerAttraction(enemy, gameState.player, index);
        this.applyMinimalExploration(enemy, index, currentTime);
      }

      // Enhanced collision detection with filled areas
      const collisionResult = this.checkFilledAreaCollision(enemy, gameState, gridWidth, gridHeight);
      
      if (collisionResult.willCollide) {
        // Bounce immediately before moving
        this.bounceFromFilledArea(enemy, index, currentTime, collisionResult.normal);
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

  private applySmoothDeceleration(enemy: { vx: number; vy: number }, index: number, currentTime: number) {
    enemy.vx *= this.FRICTION;
    enemy.vy *= this.FRICTION;

    const lastAcceleration = this.accelerationTimers.get(index);
    if (lastAcceleration) {
      const timeSinceAcceleration = currentTime - lastAcceleration;
      if (timeSinceAcceleration > this.ACCELERATION_DECAY_TIME) {
        const baseVel = this.baseVelocities.get(index);
        if (baseVel) {
          const decayFactor = 0.988;
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
      if (i === index) continue;

      const otherEnemy = enemies[i];
      const dx = enemy.x - otherEnemy.x;
      const dy = enemy.y - otherEnemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.ENEMY_COLLISION_RADIUS && distance > 0) {
        const normalX = dx / distance;
        const normalY = dy / distance;

        const relativeVx = enemy.vx - otherEnemy.vx;
        const relativeVy = enemy.vy - otherEnemy.vy;

        const relativeSpeed = relativeVx * normalX + relativeVy * normalY;
        if (relativeSpeed > 0) continue;

        const bounceStrength = this.ENEMY_COLLISION_BOOST;
        enemy.vx += normalX * bounceStrength;
        enemy.vy += normalY * bounceStrength;
        otherEnemy.vx -= normalX * bounceStrength;
        otherEnemy.vy -= normalY * bounceStrength;

        this.accelerationTimers.set(index, currentTime);
        this.accelerationTimers.set(i, currentTime);
        break;
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

    if (distance > this.SEEK_DISTANCE_THRESHOLD && currentSpeed < this.BASE_SPEED * 1.5) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

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
    const enemyRadius = this.gridSize * 0.4;
    const nextX = enemy.x + enemy.vx;
    const nextY = enemy.y + enemy.vy;
    
    const checkPoints = [
      { x: nextX, y: nextY },
      { x: nextX - enemyRadius, y: nextY },
      { x: nextX + enemyRadius, y: nextY },
      { x: nextX, y: nextY - enemyRadius },
      { x: nextX, y: nextY + enemyRadius },
    ];

    for (const point of checkPoints) {
      const gridX = Math.floor(point.x / this.gridSize);
      const gridY = Math.floor(point.y / this.gridSize);
      
      if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight) {
        continue;
      }
      
      if (gameState.filledCells.has(`${gridX},${gridY}`)) {
        const cellCenterX = gridX * this.gridSize + this.gridSize / 2;
        const cellCenterY = gridY * this.gridSize + this.gridSize / 2;
        
        const dx = enemy.x - cellCenterX;
        const dy = enemy.y - cellCenterY;
        
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
    const dotProduct = enemy.vx * normal.x + enemy.vy * normal.y;
    const reflectedVx = enemy.vx - 2 * dotProduct * normal.x;
    const reflectedVy = enemy.vy - 2 * dotProduct * normal.y;
    
    enemy.vx = reflectedVx * this.FILLED_BOUNCE_BOOST;
    enemy.vy = reflectedVy * this.FILLED_BOUNCE_BOOST;
    
    const angleVariation = (Math.random() - 0.5) * 0.3;
    const cos = Math.cos(angleVariation);
    const sin = Math.sin(angleVariation);
    const newVx = enemy.vx * cos - enemy.vy * sin;
    const newVy = enemy.vx * sin + enemy.vy * cos;
    
    enemy.vx = newVx;
    enemy.vy = newVy;
    
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
    
    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight && 
        gameState.filledCells.has(`${gridX},${gridY}`)) {
      
      let minDistance = Infinity;
      let bestX = enemy.x;
      let bestY = enemy.y;
      
      for (let radius = 1; radius <= 3; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
            
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
        if (minDistance < Infinity) break;
      }
      
      enemy.x = bestX;
      enemy.y = bestY;
      
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

    if (enemy.x <= 0) {
      enemy.x = 0;
      enemy.vx = Math.abs(enemy.vx) * this.WALL_BOUNCE_DAMPING * this.FILLED_BOUNCE_BOOST;
      bounced = true;
    } else if (enemy.x >= this.canvasWidth - this.gridSize) {
      enemy.x = this.canvasWidth - this.gridSize;
      enemy.vx = -Math.abs(enemy.vx) * this.WALL_BOUNCE_DAMPING * this.FILLED_BOUNCE_BOOST;
      bounced = true;
    }

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
      this.baseVelocities.set(index, {
        vx: enemy.vx,
        vy: enemy.vy
      });
      
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
    
    if (currentSpeed < this.MIN_SPEED && currentSpeed > 0.05) {
      const baseVel = this.baseVelocities.get(index);
      if (baseVel) {
        const factor = this.MIN_SPEED / Math.max(currentSpeed, 0.1);
        enemy.vx = baseVel.vx * factor;
        enemy.vy = baseVel.vy * factor;
      } else {
        const angle = Math.random() * Math.PI * 2;
        enemy.vx = Math.cos(angle) * this.MIN_SPEED;
        enemy.vy = Math.sin(angle) * this.MIN_SPEED;
      }
    }
    
    if (currentSpeed > this.MAX_SPEED) {
      const speedRatio = this.MAX_SPEED / currentSpeed;
      enemy.vx *= speedRatio;
      enemy.vy *= speedRatio;
    }
  }
}
