
import { GameState, Surprise, Position } from '../../types/game';
import { audioManager } from '../AudioManager';

export class SurpriseManager {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private surpriseIdCounter: number = 0;

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
          maxTimer: 300, // 5 seconds at 60fps
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

    // Remove exploded surprises
    gameState.surprises = gameState.surprises.filter(surprise => surprise.state !== 'exploded');
  }

  private updateTimeBomb(bomb: Surprise, gameState: GameState) {
    switch (bomb.state) {
      case 'activated':
      case 'magnetic':
        bomb.timer++;
        if (bomb.timer >= bomb.maxTimer) {
          // Bomb expires without explosion
          bomb.state = 'exploded';
        }
        break;
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
      // Transition to magnetic after a brief delay
      setTimeout(() => {
        if (surprise.state === 'activated') {
          surprise.state = 'magnetic';
          audioManager.playBombMagnetic();
        }
      }, 500);
      
      audioManager.playBombCollect();
      gameState.score += 50; // Bonus for collecting
    }
  }

  // Check if enemies collide with magnetic bombs
  checkEnemyBombCollisions(gameState: GameState) {
    const magneticBombs = gameState.surprises.filter(s => s.state === 'magnetic');
    
    magneticBombs.forEach(bomb => {
      const bombCenterX = bomb.x + this.gridSize / 2;
      const bombCenterY = bomb.y + this.gridSize / 2;
      const explosionRadius = this.gridSize * 0.8;

      for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        const enemyCenterX = enemy.x + this.gridSize / 2;
        const enemyCenterY = enemy.y + this.gridSize / 2;
        
        const distance = Math.sqrt(
          Math.pow(enemyCenterX - bombCenterX, 2) + 
          Math.pow(enemyCenterY - bombCenterY, 2)
        );

        if (distance < explosionRadius) {
          // Enemy touches bomb - EXPLOSION!
          this.explodeBomb(bomb, gameState, i);
          break; // One enemy per bomb
        }
      }
    });
  }

  private explodeBomb(bomb: Surprise, gameState: GameState, enemyIndex: number) {
    // Remove the enemy
    gameState.enemies.splice(enemyIndex, 1);
    gameState.enemyCount = gameState.enemies.length;
    
    // Mark bomb as exploded
    bomb.state = 'exploded';
    
    // Award score
    gameState.score += 200 * gameState.level; // Higher score for higher levels
    
    // Play explosion sound
    audioManager.playBombExplosion();
    
    console.log(`💥 BOOM! Enemy eliminated by time-bomb! Score: +${200 * gameState.level}`);
  }

  // Get magnetic force for enemies (used by EnemyPhysics)
  getMagneticForce(enemyX: number, enemyY: number, gameState: GameState): {fx: number, fy: number} {
    let totalFx = 0;
    let totalFy = 0;

    const magneticBombs = gameState.surprises.filter(s => s.state === 'magnetic');
    
    magneticBombs.forEach(bomb => {
      const bombCenterX = bomb.x + this.gridSize / 2;
      const bombCenterY = bomb.y + this.gridSize / 2;
      const enemyCenterX = enemyX + this.gridSize / 2;
      const enemyCenterY = enemyY + this.gridSize / 2;
      
      const dx = bombCenterX - enemyCenterX;
      const dy = bombCenterY - enemyCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0 && distance < this.gridSize * 8) { // Magnetic range
        const magneticStrength = 0.3; // Strong attraction
        const force = magneticStrength * (1 / (distance * 0.01)); // Stronger when closer
        
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
  }
}
