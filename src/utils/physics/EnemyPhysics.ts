
import { GameState } from '../../types/game';

export class EnemyPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  updateEnemies(gameState: GameState) {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);

    gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Bounce off walls (canvas boundaries)
      if (enemy.x <= 0 || enemy.x >= this.canvasWidth - this.gridSize) {
        enemy.vx = -enemy.vx;
        enemy.x = Math.max(0, Math.min(this.canvasWidth - this.gridSize, enemy.x));
      }
      if (enemy.y <= 0 || enemy.y >= this.canvasHeight - this.gridSize) {
        enemy.vy = -enemy.vy;
        enemy.y = Math.max(0, Math.min(this.canvasHeight - this.gridSize, enemy.y));
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
      }
    });
  }
}
