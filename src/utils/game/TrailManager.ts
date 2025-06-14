
import { GameState } from '../../types/game';
import { FloodFill } from '../algorithms/FloodFill';

export class TrailManager {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private floodFill: FloodFill;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.floodFill = new FloodFill();
  }

  updateTrail(gameState: GameState) {
    const { player } = gameState;
    const gridX = Math.floor(player.x / this.gridSize);
    const gridY = Math.floor(player.y / this.gridSize);
    
    // Check if player is on the border or filled area
    const isOnBorder = gridX === 0 || gridY === 0 || 
                      gridX === Math.floor(this.canvasWidth / this.gridSize) - 1 || 
                      gridY === Math.floor(this.canvasHeight / this.gridSize) - 1;
    
    const isOnFilled = gameState.filledCells.has(`${gridX},${gridY}`);

    if (isOnBorder || isOnFilled) {
      // Complete the area if we have a trail
      if (gameState.trail.length > 0) {
        this.completeArea(gameState);
      }
      gameState.trail = [];
    } else {
      // Add to trail if not already there
      const currentPos = `${gridX},${gridY}`;
      if (!gameState.trail.some(pos => `${Math.floor(pos.x / this.gridSize)},${Math.floor(pos.y / this.gridSize)}` === currentPos)) {
        gameState.trail.push({ x: player.x, y: player.y });
      }
    }
  }

  private completeArea(gameState: GameState) {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    
    // Create a map of trail positions
    const trailSet = new Set<string>();
    gameState.trail.forEach(pos => {
      const gridX = Math.floor(pos.x / this.gridSize);
      const gridY = Math.floor(pos.y / this.gridSize);
      trailSet.add(`${gridX},${gridY}`);
    });

    // Use flood fill to find areas to fill
    const visited = new Set<string>();
    const areasToFill: Set<string>[] = [];

    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const key = `${x},${y}`;
        if (!visited.has(key) && !gameState.filledCells.has(key) && !trailSet.has(key)) {
          const area = this.floodFill.floodFill(x, y, gridWidth, gridHeight, gameState.filledCells, trailSet, visited);
          if (area.size > 0) {
            areasToFill.push(area);
          }
        }
      }
    }

    // Fill the smaller areas (areas that don't contain enemies)
    areasToFill.forEach(area => {
      const hasEnemy = gameState.enemies.some(enemy => {
        const enemyGridX = Math.floor(enemy.x / this.gridSize);
        const enemyGridY = Math.floor(enemy.y / this.gridSize);
        return area.has(`${enemyGridX},${enemyGridY}`);
      });

      if (!hasEnemy) {
        area.forEach(cell => gameState.filledCells.add(cell));
        gameState.score += area.size * 10;
      }
    });

    // Add trail to filled cells
    trailSet.forEach(cell => gameState.filledCells.add(cell));

    // Update area filled percentage
    const totalCells = gridWidth * gridHeight;
    gameState.areaFilled = (gameState.filledCells.size / totalCells) * 100;
  }
}
