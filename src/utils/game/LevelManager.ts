import { GameState } from '../../types/game';

export class LevelManager {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private readonly LEVEL_UP_THRESHOLD = 80; // 80% area filled to advance

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  checkLevelCompletion(gameState: GameState): boolean {
    return gameState.areaFilled >= this.LEVEL_UP_THRESHOLD;
  }

  advanceLevel(gameState: GameState) {
    console.log(`=== LEVEL ${gameState.level} COMPLETED ===`);
    console.log(`Area filled: ${gameState.areaFilled.toFixed(1)}%`);
    
    // Level completion bonus
    const levelBonus = gameState.level * 1000;
    const speedBonus = gameState.areaFilled > 85 ? 500 : 0; // Bonus for filling more than 85%
    gameState.score += levelBonus + speedBonus;
    
    console.log(`Level bonus: ${levelBonus}, Speed bonus: ${speedBonus}`);
    
    // Advance to next level
    gameState.level += 1;
    gameState.enemyCount = gameState.level; // One enemy per level
    gameState.isLevelTransition = true;
    
    // Reset area for new level but keep score
    this.resetLevelArea(gameState);
    
    // Create new enemies for the level
    this.createEnemiesForLevel(gameState);
    
    console.log(`Advanced to level ${gameState.level} with ${gameState.enemyCount} enemies`);
  }

  private resetLevelArea(gameState: GameState) {
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    
    // Clear everything except border
    gameState.filledCells.clear();
    gameState.trail = [];
    
    // Reinitialize border
    for (let x = 0; x < gridWidth; x++) {
      gameState.filledCells.add(`${x},0`); // Top border
      gameState.filledCells.add(`${x},${gridHeight - 1}`); // Bottom border
    }
    for (let y = 0; y < gridHeight; y++) {
      gameState.filledCells.add(`0,${y}`); // Left border
      gameState.filledCells.add(`${gridWidth - 1},${y}`); // Right border
    }
    
    // Reset area percentage
    const totalCells = gridWidth * gridHeight;
    gameState.areaFilled = (gameState.filledCells.size / totalCells) * 100;
    
    // Reset player to starting position
    gameState.player.x = 0;
    gameState.player.y = 0;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
  }

  private createEnemiesForLevel(gameState: GameState) {
    const centerX = Math.floor(this.canvasWidth / 2);
    const centerY = Math.floor(this.canvasHeight / 2);
    
    gameState.enemies = [];
    
    // Create enemies in a pattern that spreads them out
    for (let i = 0; i < gameState.enemyCount; i++) {
      const angle = (i / gameState.enemyCount) * Math.PI * 2;
      const radius = 150 + (i * 50); // Spread enemies in expanding circles
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Ensure enemies are within bounds
      const clampedX = Math.max(this.gridSize * 2, Math.min(this.canvasWidth - this.gridSize * 2, x));
      const clampedY = Math.max(this.gridSize * 2, Math.min(this.canvasHeight - this.gridSize * 2, y));
      
      // Random initial velocity
      const vx = (Math.random() - 0.5) * 1.2;
      const vy = (Math.random() - 0.5) * 1.2;
      
      gameState.enemies.push({
        x: clampedX,
        y: clampedY,
        vx,
        vy
      });
    }
    
    console.log(`Created ${gameState.enemies.length} enemies for level ${gameState.level}`);
  }

  completeLevelTransition(gameState: GameState) {
    gameState.isLevelTransition = false;
    console.log(`Level transition completed for level ${gameState.level}`);
  }
}
