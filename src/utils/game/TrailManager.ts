
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

  // Initialize the border as filled cells
  initializeBorder(gameState: GameState) {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    
    // Fill the entire border
    for (let x = 0; x < gridWidth; x++) {
      gameState.filledCells.add(`${x},0`); // Top border
      gameState.filledCells.add(`${x},${gridHeight - 1}`); // Bottom border
    }
    for (let y = 0; y < gridHeight; y++) {
      gameState.filledCells.add(`0,${y}`); // Left border
      gameState.filledCells.add(`${gridWidth - 1},${y}`); // Right border
    }
    
    console.log('Border initialized with', gameState.filledCells.size, 'cells');
  }

  updateTrail(gameState: GameState) {
    const { player } = gameState;
    const gridX = Math.floor(player.x / this.gridSize);
    const gridY = Math.floor(player.y / this.gridSize);
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    
    // Check if player is on the border or filled area
    const isOnBorder = gridX === 0 || gridY === 0 || 
                      gridX === gridWidth - 1 || 
                      gridY === gridHeight - 1;
    
    const isOnFilled = gameState.filledCells.has(`${gridX},${gridY}`);

    if (isOnBorder || isOnFilled) {
      // Complete the area if we have a trail
      if (gameState.trail.length > 0) {
        console.log('=== COMPLETING AREA ===');
        console.log('Trail length:', gameState.trail.length);
        console.log('Player position:', { x: gridX, y: gridY });
        console.log('Is on border:', isOnBorder);
        console.log('Is on filled:', isOnFilled);
        this.completeArea(gameState);
      }
      gameState.trail = [];
    } else {
      // Add to trail if not already there
      const currentPos = `${gridX},${gridY}`;
      if (!gameState.trail.some(pos => `${Math.floor(pos.x / this.gridSize)},${Math.floor(pos.y / this.gridSize)}` === currentPos)) {
        gameState.trail.push({ x: gridX * this.gridSize, y: gridY * this.gridSize });
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

    // Add current player position to trail set for completion
    const playerGridX = Math.floor(gameState.player.x / this.gridSize);
    const playerGridY = Math.floor(gameState.player.y / this.gridSize);
    trailSet.add(`${playerGridX},${playerGridY}`);

    console.log('Trail set:', Array.from(trailSet));

    // Create boundary set that includes existing filled cells and the new trail
    const boundarySet = new Set<string>();
    
    // Add existing filled cells to boundary (this includes the border)
    gameState.filledCells.forEach(cell => boundarySet.add(cell));
    
    // Add trail to boundary (this creates the new enclosed boundary)
    trailSet.forEach(cell => boundarySet.add(cell));

    console.log('Boundary set size:', boundarySet.size);
    console.log('Filled cells before:', gameState.filledCells.size);

    // Find all empty areas using flood fill
    const visited = new Set<string>();
    const areas: Set<string>[] = [];

    // Check ALL cells in the grid to find empty areas
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const key = `${x},${y}`;
        if (!visited.has(key) && !boundarySet.has(key)) {
          const area = this.floodFill.floodFill(x, y, gridWidth, gridHeight, boundarySet, new Set(), visited);
          if (area.size > 0) {
            areas.push(area);
            console.log(`Found area at (${x},${y}) with size:`, area.size);
          }
        }
      }
    }

    console.log('Total areas found:', areas.length);

    // Determine which areas to fill based on enemy positions
    let totalNewlyFilledCells = 0;
    
    // Check each area to see if it contains enemies
    areas.forEach((area, index) => {
      const hasEnemy = gameState.enemies.some(enemy => {
        const enemyGridX = Math.floor(enemy.x / this.gridSize);
        const enemyGridY = Math.floor(enemy.y / this.gridSize);
        return area.has(`${enemyGridX},${enemyGridY}`);
      });

      console.log(`Area ${index} has enemy:`, hasEnemy, 'size:', area.size);

      // Fill areas that don't contain enemies
      if (!hasEnemy) {
        area.forEach(cell => {
          if (!gameState.filledCells.has(cell)) {
            gameState.filledCells.add(cell);
            totalNewlyFilledCells++;
          }
        });
      }
    });

    // Add trail cells to filled cells
    trailSet.forEach(cell => {
      if (!gameState.filledCells.has(cell)) {
        gameState.filledCells.add(cell);
        totalNewlyFilledCells++;
      }
    });

    console.log('Newly filled cells:', totalNewlyFilledCells);
    console.log('Total filled cells after:', gameState.filledCells.size);

    // Add score for newly filled cells
    gameState.score += totalNewlyFilledCells * 10;

    // Update area filled percentage
    const totalCells = gridWidth * gridHeight;
    gameState.areaFilled = (gameState.filledCells.size / totalCells) * 100;
  }
}
