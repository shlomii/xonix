
import { GameState } from '../../types/game';

export class CollisionDetector {
  private gridSize: number;

  constructor(gridSize: number) {
    this.gridSize = gridSize;
  }

  checkCollisions(gameState: GameState) {
    const { player, enemies, trail } = gameState;
    
    // Check collision with enemies
    enemies.forEach(enemy => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.gridSize) {
        gameState.isAlive = false;
        return;
      }

      // Check if enemy hits trail
      trail.forEach(trailPos => {
        const tdx = trailPos.x - enemy.x;
        const tdy = trailPos.y - enemy.y;
        const tDistance = Math.sqrt(tdx * tdx + tdy * tdy);
        
        if (tDistance < this.gridSize) {
          gameState.isAlive = false;
        }
      });
    });
  }
}
