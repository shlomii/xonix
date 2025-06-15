
import { GameState } from '../../types/game';

export class CollisionDetector {
  private gridSize: number;

  constructor(gridSize: number) {
    this.gridSize = gridSize;
  }

  checkCollisions(gameState: GameState) {
    // Check if player is in a filled area (safe zone)
    const playerGridX = Math.floor(gameState.player.x / this.gridSize);
    const playerGridY = Math.floor(gameState.player.y / this.gridSize);
    const playerInFilledArea = gameState.filledCells.has(`${playerGridX},${playerGridY}`);
    
    // If player is in a filled area, they are safe from enemies
    if (playerInFilledArea) {
      console.log('Player is safe in filled area');
      return;
    }

    // Check enemy-player collisions only if player is not in filled area
    gameState.enemies.forEach((enemy, index) => {
      const dx = enemy.x - gameState.player.x;
      const dy = enemy.y - gameState.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Collision threshold - when enemy and player overlap significantly
      const collisionThreshold = this.gridSize * 0.6;
      
      if (distance < collisionThreshold) {
        console.log(`Enemy ${index} caught player! Distance: ${distance.toFixed(2)}`);
        gameState.isAlive = false;
      }
    });

    // Check enemy-trail collisions
    if (gameState.trail.length > 0) {
      gameState.enemies.forEach((enemy, index) => {
        gameState.trail.forEach((trailPos, trailIndex) => {
          const dx = enemy.x + this.gridSize/2 - trailPos.x;
          const dy = enemy.y + this.gridSize/2 - trailPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.gridSize * 0.7) {
            console.log(`Enemy ${index} hit trail at position ${trailIndex}!`);
            gameState.isAlive = false;
          }
        });
      });
    }
  }
}
