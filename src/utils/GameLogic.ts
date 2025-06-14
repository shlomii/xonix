import { GameState, Position, Enemy } from '../types/game';

export class GameLogic {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private playerSpeed = 4;
  private friction = 0.85;
  private acceleration = 0.8;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  updateGame(gameState: GameState): GameState {
    const newState = { ...gameState };

    // Update player movement with physics
    this.updatePlayerMovement(newState);
    
    // Update enemies
    this.updateEnemies(newState);
    
    // Check collisions
    this.checkCollisions(newState);
    
    // Update trail and check for area completion
    this.updateTrail(newState);
    
    return newState;
  }

  private updatePlayerMovement(gameState: GameState) {
    const { player, keys } = gameState;
    
    // Apply input acceleration
    if (keys.has('arrowleft') || keys.has('a')) {
      player.vx = Math.max(player.vx - this.acceleration, -this.playerSpeed);
    }
    if (keys.has('arrowright') || keys.has('d')) {
      player.vx = Math.min(player.vx + this.acceleration, this.playerSpeed);
    }
    if (keys.has('arrowup') || keys.has('w')) {
      player.vy = Math.max(player.vy - this.acceleration, -this.playerSpeed);
    }
    if (keys.has('arrowdown') || keys.has('s')) {
      player.vy = Math.min(player.vy + this.acceleration, this.playerSpeed);
    }

    // Apply friction when no input
    if (!keys.has('arrowleft') && !keys.has('a') && !keys.has('arrowright') && !keys.has('d')) {
      player.vx *= this.friction;
    }
    if (!keys.has('arrowup') && !keys.has('w') && !keys.has('arrowdown') && !keys.has('s')) {
      player.vy *= this.friction;
    }

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Keep player in bounds
    player.x = Math.max(0, Math.min(this.canvasWidth - this.gridSize, player.x));
    player.y = Math.max(0, Math.min(this.canvasHeight - this.gridSize, player.y));

    // Stop small movements
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    if (Math.abs(player.vy) < 0.1) player.vy = 0;
  }

  private updateEnemies(gameState: GameState) {
    gameState.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Bounce off walls
      if (enemy.x <= 0 || enemy.x >= this.canvasWidth - this.gridSize) {
        enemy.vx = -enemy.vx;
        enemy.x = Math.max(0, Math.min(this.canvasWidth - this.gridSize, enemy.x));
      }
      if (enemy.y <= 0 || enemy.y >= this.canvasHeight - this.gridSize) {
        enemy.vy = -enemy.vy;
        enemy.y = Math.max(0, Math.min(this.canvasHeight - this.gridSize, enemy.y));
      }

      // Bounce off filled areas
      const gridX = Math.floor(enemy.x / this.gridSize);
      const gridY = Math.floor(enemy.y / this.gridSize);
      if (gameState.filledCells.has(`${gridX},${gridY}`)) {
        enemy.vx = -enemy.vx;
        enemy.vy = -enemy.vy;
      }
    });
  }

  private updateTrail(gameState: GameState) {
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
          const area = this.floodFill(x, y, gridWidth, gridHeight, gameState.filledCells, trailSet, visited);
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

  private floodFill(
    startX: number, 
    startY: number, 
    gridWidth: number, 
    gridHeight: number,
    filledCells: Set<string>,
    trailSet: Set<string>,
    visited: Set<string>
  ): Set<string> {
    const area = new Set<string>();
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
      if (visited.has(key)) continue;
      if (filledCells.has(key) || trailSet.has(key)) continue;

      visited.add(key);
      area.add(key);

      // Add neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return area;
  }

  private checkCollisions(gameState: GameState) {
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
