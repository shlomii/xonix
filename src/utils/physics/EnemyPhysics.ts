
import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private accelerationTimers: Map<number, number> = new Map();
  private baseVelocities: Map<number, {vx: number, vy: number}> = new Map();

  // Simplified physics constants
  private readonly BASE_SPEED = 2.0;
  private readonly MAX_SPEED = 4.5;
  private readonly MIN_SPEED = 1.0;
  private readonly PLAYER_ATTRACTION_STRENGTH = 0.8;
  private readonly EXPLORATION_FORCE = 0.3;
  private readonly WALL_BOUNCE_DAMPING = 0.8;
  private readonly FILLED_BOUNCE_BOOST = 1.1;
  private readonly FRICTION = 0.99;
  private readonly ACCELERATION_BOOST = 1.5;
  private readonly SEEK_DISTANCE_THRESHOLD = 200;

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

      // Calculate player attraction
      this.applyPlayerAttraction(enemy, gameState.player);

      // Add exploration behavior when far from player
      this.applyExplorationBehavior(enemy, gameState.player, index);

      // Apply gentle friction
      enemy.vx *= this.FRICTION;
      enemy.vy *= this.FRICTION;

      // Update position
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Handle collisions
      this.handleWallCollisions(enemy, index, currentTime);
      this.handleFilledAreaCollisions(enemy, index, currentTime, gameState, gridWidth, gridHeight);

      // Enforce speed limits
      this.enforceSpeedLimits(enemy, index);
    });
  }

  private applyPlayerAttraction(
    enemy: { vx: number; vy: number; x: number; y: number },
    player: { x: number; y: number }
  ) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Normalize direction
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Strong attraction force that's always active
      const attractionForce = this.PLAYER_ATTRACTION_STRENGTH;
      
      // Apply attraction
      enemy.vx += normalizedX * attractionForce;
      enemy.vy += normalizedY * attractionForce;
    }
  }

  private applyExplorationBehavior(
    enemy: { vx: number; vy: number; x: number; y: number },
    player: { x: number; y: number },
    index: number
  ) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

    // When far from player, add exploration behavior
    if (distanceToPlayer > this.SEEK_DISTANCE_THRESHOLD) {
      const baseVel = this.baseVelocities.get(index);
      if (baseVel) {
        // Add some of the base velocity back for exploration
        enemy.vx += baseVel.vx * this.EXPLORATION_FORCE;
        enemy.vy += baseVel.vy * this.EXPLORATION_FORCE;
      }

      // Add random exploration force
      const time = Date.now() * 0.001;
      const explorationX = Math.sin(time + index * 2.3) * 0.5;
      const explorationY = Math.cos(time * 1.1 + index * 1.9) * 0.5;
      
      enemy.vx += explorationX;
      enemy.vy += explorationY;
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
      enemy.vx = Math.abs(enemy.vx) * this.WALL_BOUNCE_DAMPING;
      bounced = true;
    } else if (enemy.x >= this.canvasWidth - this.gridSize) {
      enemy.x = this.canvasWidth - this.gridSize;
      enemy.vx = -Math.abs(enemy.vx) * this.WALL_BOUNCE_DAMPING;
      bounced = true;
    }

    // Vertical walls
    if (enemy.y <= 0) {
      enemy.y = 0;
      enemy.vy = Math.abs(enemy.vy) * this.WALL_BOUNCE_DAMPING;
      bounced = true;
    } else if (enemy.y >= this.canvasHeight - this.gridSize) {
      enemy.y = this.canvasHeight - this.gridSize;
      enemy.vy = -Math.abs(enemy.vy) * this.WALL_BOUNCE_DAMPING;
      bounced = true;
    }

    if (bounced) {
      // Update base velocity when bouncing
      this.baseVelocities.set(index, {
        vx: enemy.vx,
        vy: enemy.vy
      });
      
      // Small acceleration boost after bouncing
      this.accelerateEnemy(enemy, index, currentTime);
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
    
    // Don't bounce off border cells, only filled interior cells
    const isBorderCell = gridX === 0 || gridX === gridWidth - 1 || gridY === 0 || gridY === gridHeight - 1;
    
    if (!isBorderCell && gameState.filledCells.has(`${gridX},${gridY}`)) {
      // Bounce with energy boost
      enemy.vx = -enemy.vx * this.FILLED_BOUNCE_BOOST;
      enemy.vy = -enemy.vy * this.FILLED_BOUNCE_BOOST;
      
      // Add slight angle variation to prevent getting stuck
      const angleVariation = (Math.random() - 0.5) * 0.4;
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
    
    // Ensure minimum speed
    if (currentSpeed < this.MIN_SPEED) {
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
