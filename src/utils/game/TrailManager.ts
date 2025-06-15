
import { GameState } from '../../types/game';
import { FloodFill } from '../algorithms/FloodFill';

export class TrailManager {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private floodFill: FloodFill;
  private lastPlayerPosition: { x: number; y: number } | null = null;

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
    
    // Check if player position changed
    const currentPos = { x: gridX, y: gridY };
    if (this.lastPlayerPosition) {
      if (this.lastPlayerPosition.x === currentPos.x && this.lastPlayerPosition.y === currentPos.y) {
        return; // No movement, no score update
      }
    }
    this.lastPlayerPosition = currentPos;
    
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
      // Player is in uncharted territory - add slow score increase
      gameState.score += 1; // Small score for exploring
      
      // Add to trail if not already there
      const currentPosStr = `${gridX},${gridY}`;
      if (!gameState.trail.some(pos => `${Math.floor(pos.x / this.gridSize)},${Math.floor(pos.y / this.gridSize)}` === currentPosStr)) {
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

    // Add current player position to trail set for proper boundary closure
    const playerGridX = Math.floor(gameState.player.x / this.gridSize);
    const playerGridY = Math.floor(gameState.player.y / this.gridSize);
    trailSet.add(`${playerGridX},${playerGridY}`);

    console.log('Trail set before boundary formation:', Array.from(trailSet));
    console.log('Filled cells before trail completion:', gameState.filledCells.size);

    // CRITICAL FIX: Add trail cells to filled cells BEFORE flood fill
    // This ensures the trail forms a proper boundary
    const originalFilledSize = gameState.filledCells.size;
    trailSet.forEach(cell => {
      gameState.filledCells.add(cell);
    });

    console.log(`Added ${gameState.filledCells.size - originalFilledSize} trail cells to boundary`);

    // Create a comprehensive boundary set for flood fill
    // This includes ALL filled cells (border + previously filled areas + new trail)
    const boundarySet = new Set<string>();
    gameState.filledCells.forEach(cell => boundarySet.add(cell));

    console.log('Final boundary set size:', boundarySet.size);

    // Enhanced flood fill: Check ALL empty cells to find disconnected areas
    const visited = new Set<string>();
    const areas: Set<string>[] = [];

    // Systematically scan the entire grid for empty areas
    for (let y = 1; y < gridHeight - 1; y++) { // Skip border cells
      for (let x = 1; x < gridWidth - 1; x++) {
        const key = `${x},${y}`;
        
        // Skip if already visited or part of boundary
        if (visited.has(key) || boundarySet.has(key)) {
          continue;
        }

        // Found an unvisited empty cell - start flood fill
        const area = this.floodFill.floodFill(x, y, gridWidth, gridHeight, boundarySet, new Set(), visited);
        
        if (area.size > 0) {
          areas.push(area);
          console.log(`Found disconnected area starting at (${x},${y}) with ${area.size} cells`);
          
          // Debug: Log a few cells from this area
          const areaCells = Array.from(area).slice(0, 5);
          console.log('Area sample cells:', areaCells);
        }
      }
    }

    console.log(`Total disconnected areas found: ${areas.length}`);

    // Fill areas that don't contain enemies
    let totalNewlyFilledCells = 0;
    let largestFilledArea = 0;
    
    areas.forEach((area, index) => {
      // Check if this area contains any enemies
      const hasEnemy = gameState.enemies.some(enemy => {
        const enemyGridX = Math.floor(enemy.x / this.gridSize);
        const enemyGridY = Math.floor(enemy.y / this.gridSize);
        const enemyKey = `${enemyGridX},${enemyGridY}`;
        return area.has(enemyKey);
      });

      console.log(`Area ${index}: size=${area.size}, hasEnemy=${hasEnemy}`);

      // Fill enemy-free areas
      if (!hasEnemy) {
        let newCellsInThisArea = 0;
        largestFilledArea = Math.max(largestFilledArea, area.size);
        
        area.forEach(cell => {
          if (!gameState.filledCells.has(cell)) {
            gameState.filledCells.add(cell);
            newCellsInThisArea++;
            totalNewlyFilledCells++;
          }
        });
        
        console.log(`Filled area ${index} with ${newCellsInThisArea} new cells`);
      }
    });

    console.log(`=== COMPLETION SUMMARY ===`);
    console.log(`Trail cells added: ${trailSet.size}`);
    console.log(`New area cells filled: ${totalNewlyFilledCells}`);
    console.log(`Largest filled area: ${largestFilledArea}`);
    console.log(`Total filled cells: ${gameState.filledCells.size}`);

    // Scoring system with exponential rewards
    if (totalNewlyFilledCells > 0) {
      const baseScore = 10;
      const exponentialBonus = Math.pow(totalNewlyFilledCells, 1.5) * 5;
      const largeSizeBonus = totalNewlyFilledCells >= 50 ? totalNewlyFilledCells * 20 : 0;
      const totalScore = Math.floor(baseScore * totalNewlyFilledCells + exponentialBonus + largeSizeBonus);
      
      console.log(`Score calculation: ${totalNewlyFilledCells} cells = ${baseScore * totalNewlyFilledCells} base + ${Math.floor(exponentialBonus)} exponential + ${largeSizeBonus} large bonus = ${totalScore} total`);
      
      gameState.score += totalScore;
    }

    // Update completion percentage
    const totalCells = gridWidth * gridHeight;
    gameState.areaFilled = (gameState.filledCells.size / totalCells) * 100;
    
    console.log(`Area filled: ${gameState.areaFilled.toFixed(1)}%`);
  }
}
