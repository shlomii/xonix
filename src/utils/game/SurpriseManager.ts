import { GameState, Surprise, Position } from '../../types/game';
import { audioManager } from '../AudioManager';

interface StuckEnemy {
  enemyIndex: number;
  bombId: string;
  stuckTime: number;
  maxStuckTime: number;
  originalVelocity: { vx: number; vy: number };
}

export class SurpriseManager {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private surpriseIdCounter: number = 0;
  private stuckEnemies: StuckEnemy[] = [];

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  // Spawn surprises at the start of each level
  spawnLevelSurprises(gameState: GameState) {
    const bombCount = Math.min(1 + Math.floor(gameState.level / 3), 3); // 1-3 bombs based on level
    
    for (let i = 0; i < bombCount; i++) {
      const position = this.findSafeSpawnPosition(gameState);
      if (position) {
        const bomb: Surprise = {
          id: `bomb_${this.surpriseIdCounter++}`,
          type: 'timeBomb',
          state: 'inactive',
          timer: 0,
          maxTimer: 600, // 10 seconds at 60fps
          x: position.x,
          y: position.y
        };
        gameState.surprises.push(bomb);
      }
    }
  }

  // Find a safe position to spawn surprises (not on trails, filled areas, or too close to player/enemies)
  private findSafeSpawnPosition(gameState: GameState): Position | null {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    const attempts = 50;

    for (let i = 0; i < attempts; i++) {
      // Stay away from borders and ensure reasonable spacing
      const gridX = 3 + Math.floor(Math.random() * (gridWidth - 6));
      const gridY = 3 + Math.floor(Math.random() * (gridHeight - 6));
      const x = gridX * this.gridSize;
      const y = gridY * this.gridSize;

      // Check if position is safe
      if (!gameState.filledCells.has(`${gridX},${gridY}`) &&
          !this.isNearTrail(x, y, gameState.trail) &&
          !this.isNearPlayer(x, y, gameState.player) &&
          !this.isNearEnemies(x, y, gameState.enemies) &&
          !this.isNearOtherSurprises(x, y, gameState.surprises)) {
        return { x, y };
      }
    }
    return null;
  }

  private isNearTrail(x: number, y: number, trail: Position[]): boolean {
    const minDistance = this.gridSize * 2;
    return trail.some(pos => 
      Math.abs(pos.x - x) < minDistance && Math.abs(pos.y - y) < minDistance
    );
  }

  private isNearPlayer(x: number, y: number, player: Position): boolean {
    const minDistance = this.gridSize * 3;
    return Math.abs(player.x - x) < minDistance && Math.abs(player.y - y) < minDistance;
  }

  private isNearEnemies(x: number, y: number, enemies: Position[]): boolean {
    const minDistance = this.gridSize * 3;
    return enemies.some(enemy => 
      Math.abs(enemy.x - x) < minDistance && Math.abs(enemy.y - y) < minDistance
    );
  }

  private isNearOtherSurprises(x: number, y: number, surprises: Surprise[]): boolean {
    const minDistance = this.gridSize * 4;
    return surprises.some(surprise => 
      Math.abs(surprise.x - x) < minDistance && Math.abs(surprise.y - y) < minDistance
    );
  }

  // Update all surprises each frame
  updateSurprises(gameState: GameState) {
    gameState.surprises.forEach(surprise => {
      if (surprise.type === 'timeBomb') {
        this.updateTimeBomb(surprise, gameState);
      }
    });

    // Update stuck enemies
    this.updateStuckEnemies(gameState);

    // Remove exploded surprises
    gameState.surprises = gameState.surprises.filter(surprise => surprise.state !== 'exploded');
  }

  private updateTimeBomb(bomb: Surprise, gameState: GameState) {
    switch (bomb.state) {
      case 'activated':
      case 'magnetic':
        bomb.timer++;
        if (bomb.timer >= bomb.maxTimer) {
          // Bomb expires - release all stuck enemies
          this.releaseBombEnemies(bomb.id, gameState);
          bomb.state = 'exploded';
        }
        break;
    }
  }

  private updateStuckEnemies(gameState: GameState) {
    for (let i = this.stuckEnemies.length - 1; i >= 0; i--) {
      const stuckEnemy = this.stuckEnemies[i];
      stuckEnemy.stuckTime++;

      // Check if enemy should be released
      if (stuckEnemy.stuckTime >= stuckEnemy.maxStuckTime) {
        this.releaseStuckEnemy(i, gameState);
      }
    }
  }

  private releaseStuckEnemy(stuckIndex: number, gameState: GameState) {
    const stuckEnemy = this.stuckEnemies[stuckIndex];
    const enemy = gameState.enemies[stuckEnemy.enemyIndex];
    
    if (enemy) {
      // Restore original velocity with some randomization
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.sqrt(stuckEnemy.originalVelocity.vx ** 2 + stuckEnemy.originalVelocity.vy ** 2);
      enemy.vx = Math.cos(angle) * speed;
      enemy.vy = Math.sin(angle) * speed;
    }
    
    this.stuckEnemies.splice(stuckIndex, 1);
  }

  private releaseBombEnemies(bombId: string, gameState: GameState) {
    for (let i = this.stuckEnemies.length - 1; i >= 0; i--) {
      if (this.stuckEnemies[i].bombId === bombId) {
        this.releaseStuckEnemy(i, gameState);
      }
    }
  }

  // Check if player collects any surprises
  checkPlayerCollection(gameState: GameState) {
    const playerCenterX = gameState.player.x + this.gridSize / 2;
    const playerCenterY = gameState.player.y + this.gridSize / 2;
    const collectionRadius = this.gridSize * 0.7;

    gameState.surprises.forEach(surprise => {
      if (surprise.state === 'inactive') {
        const surpriseCenterX = surprise.x + this.gridSize / 2;
        const surpriseCenterY = surprise.y + this.gridSize / 2;
        const distance = Math.sqrt(
          Math.pow(playerCenterX - surpriseCenterX, 2) + 
          Math.pow(playerCenterY - surpriseCenterY, 2)
        );

        if (distance < collectionRadius) {
          this.collectSurprise(surprise, gameState);
        }
      }
    });
  }

  private collectSurprise(surprise: Surprise, gameState: GameState) {
    if (surprise.type === 'timeBomb') {
      surprise.state = 'activated';
      surprise.timer = 0;
      // Transition to magnetic after a brief delay (200ms)
      setTimeout(() => {
        if (surprise.state === 'activated') {
          surprise.state = 'magnetic';
          audioManager.playBombMagnetic();
        }
      }, 200);
      
      audioManager.playBombCollect();
      gameState.score += 50; // Bonus for collecting
    }
  }

  // Check if enemies collide with magnetic bombs - UPDATED to stick enemies
  checkEnemyBombCollisions(gameState: GameState) {
    const magneticBombs = gameState.surprises.filter(s => s.state === 'magnetic');
    
    magneticBombs.forEach(bomb => {
      const bombCenterX = bomb.x + this.gridSize / 2;
      const bombCenterY = bomb.y + this.gridSize / 2;
      const collisionRadius = this.gridSize * 0.8; // Slightly larger for easier sticking

      gameState.enemies.forEach((enemy, enemyIndex) => {
        // Skip if enemy is already stuck
        if (this.stuckEnemies.find(se => se.enemyIndex === enemyIndex)) return;

        const enemyCenterX = enemy.x + this.gridSize / 2;
        const enemyCenterY = enemy.y + this.gridSize / 2;
        
        const distance = Math.sqrt(
          Math.pow(enemyCenterX - bombCenterX, 2) + 
          Math.pow(enemyCenterY - bombCenterY, 2)
        );

        if (distance < collisionRadius) {
          // Stick enemy to bomb
          this.stickEnemyToBomb(enemy, enemyIndex, bomb, gameState);
        }
      });
    });
  }

  private stickEnemyToBomb(enemy: { x: number; y: number; vx: number; vy: number }, enemyIndex: number, bomb: Surprise, gameState: GameState) {
    // Store original velocity
    const originalVelocity = { vx: enemy.vx, vy: enemy.vy };
    
    // Stop enemy movement
    enemy.vx = 0;
    enemy.vy = 0;
    
    // Position enemy close to bomb
    const bombCenterX = bomb.x + this.gridSize / 2;
    const bombCenterY = bomb.y + this.gridSize / 2;
    const stickDistance = this.gridSize * 0.7;
    
    // Find direction from bomb to enemy
    const dx = enemy.x + this.gridSize / 2 - bombCenterX;
    const dy = enemy.y + this.gridSize / 2 - bombCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalX = dx / distance;
      const normalY = dy / distance;
      
      enemy.x = bombCenterX + normalX * stickDistance - this.gridSize / 2;
      enemy.y = bombCenterY + normalY * stickDistance - this.gridSize / 2;
    }
    
    // Add to stuck enemies list
    this.stuckEnemies.push({
      enemyIndex,
      bombId: bomb.id,
      stuckTime: 0,
      maxStuckTime: 180, // 3 seconds at 60fps
      originalVelocity
    });
    
    // Award score for sticking enemy
    gameState.score += 100;
    
    console.log(`🧲 Enemy stuck to magnetic bomb for 3 seconds! Score: +100`);
  }

  // FIXED: Get magnetic force ONLY for magnetic bombs, but not for stuck enemies
  getMagneticForce(enemyX: number, enemyY: number, gameState: GameState): {fx: number, fy: number} {
    let totalFx = 0;
    let totalFy = 0;

    // Find enemy index to check if it's stuck
    const enemyIndex = gameState.enemies.findIndex(e => e.x === enemyX && e.y === enemyY);
    const isStuck = this.stuckEnemies.find(se => se.enemyIndex === enemyIndex);
    
    // Don't apply magnetic force to stuck enemies
    if (isStuck) return { fx: 0, fy: 0 };

    // ONLY attract to bombs in 'magnetic' state (not 'activated')
    const magneticBombs = gameState.surprises.filter(s => s.state === 'magnetic');
    
    magneticBombs.forEach(bomb => {
      const bombCenterX = bomb.x + this.gridSize / 2;
      const bombCenterY = bomb.y + this.gridSize / 2;
      const enemyCenterX = enemyX + this.gridSize / 2;
      const enemyCenterY = enemyY + this.gridSize / 2;
      
      const dx = bombCenterX - enemyCenterX;
      const dy = bombCenterY - enemyCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0 && distance < this.gridSize * 12) {
        const magneticStrength = 1.2;
        const force = magneticStrength / Math.max(distance * 0.005, 1);
        
        totalFx += (dx / distance) * force;
        totalFy += (dy / distance) * force;
      }
    });

    return { fx: totalFx, fy: totalFy };
  }

  // Clear all surprises (used when restarting game)
  clearAllSurprises(gameState: GameState) {
    gameState.surprises = [];
    this.surpriseIdCounter = 0;
    this.stuckEnemies = [];
  }
}
