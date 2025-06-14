import { GameState } from '../types/game';

export class GameRenderer {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private time: number = 0;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  render(ctx: CanvasRenderingContext2D, gameState: GameState) {
    this.time += 0.02;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas with smooth gradient background
    this.drawBackground(ctx);

    // Draw grid
    this.drawGrid(ctx);

    // Draw filled areas (including border)
    this.drawFilledAreas(ctx, gameState.filledCells);

    // Draw trail
    this.drawTrail(ctx, gameState.trail, gameState.player);

    // Draw enemies
    this.drawEnemies(ctx, gameState.enemies);

    // Draw player
    this.drawPlayer(ctx, gameState.player);

    // Draw canvas boundary (just a thin outline)
    this.drawCanvasBoundary(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    // Enhanced gradient background with more depth
    const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.3, '#16213e');
    gradient.addColorStop(0.7, '#0f3460');
    gradient.addColorStop(1, '#0e2a4f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.08)'; // More subtle grid
    ctx.lineWidth = 0.5; // Thinner lines for higher resolution

    // Vertical lines
    for (let x = 0; x <= this.canvasWidth; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0); // Add 0.5 for crisp lines
      ctx.lineTo(x + 0.5, this.canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.canvasHeight; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5); // Add 0.5 for crisp lines
      ctx.lineTo(this.canvasWidth, y + 0.5);
      ctx.stroke();
    }
  }

  private drawFilledAreas(ctx: CanvasRenderingContext2D, filledCells: Set<string>) {
    // Enhanced purple filled areas with better visual feedback
    const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.85)');
    gradient.addColorStop(1, 'rgba(126, 34, 206, 0.85)');
    ctx.fillStyle = gradient;

    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    });

    // Enhanced pattern with subtle border highlights
    ctx.fillStyle = 'rgba(167, 71, 254, 0.4)';
    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      const centerX = x * this.gridSize + this.gridSize / 2;
      const centerY = y * this.gridSize + this.gridSize / 2;
      
      // Small dot pattern to indicate safety
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle inner border for better definition
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x * this.gridSize + 0.5, y * this.gridSize + 0.5, this.gridSize - 1, this.gridSize - 1);
    });
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>, player: {x: number, y: number}) {
    if (trail.length === 0) return;

    // Get grid dimensions
    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    const playerGridX = Math.floor(player.x / this.gridSize);
    const playerGridY = Math.floor(player.y / this.gridSize);

    // Smooth pink trail line
    ctx.strokeStyle = 'rgb(236, 72, 153)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    
    if (trail.length > 0) {
      // Get the first trail position
      const firstPos = trail[0];
      const firstGridX = Math.floor(firstPos.x / this.gridSize);
      const firstGridY = Math.floor(firstPos.y / this.gridSize);
      
      // Determine where to start the line based on the first trail position
      let startX, startY;
      
      // Check if first trail position is adjacent to a border
      const isAdjacentToLeftBorder = firstGridX === 1;
      const isAdjacentToRightBorder = firstGridX === gridWidth - 2;
      const isAdjacentToTopBorder = firstGridY === 1;
      const isAdjacentToBottomBorder = firstGridY === gridHeight - 2;
      
      // Start from the appropriate border edge if the trail begins adjacent to border
      if (isAdjacentToLeftBorder && !isAdjacentToTopBorder && !isAdjacentToBottomBorder) {
        startX = 0;
        startY = firstPos.y + this.gridSize / 2;
      } else if (isAdjacentToRightBorder && !isAdjacentToTopBorder && !isAdjacentToBottomBorder) {
        startX = this.canvasWidth;
        startY = firstPos.y + this.gridSize / 2;
      } else if (isAdjacentToTopBorder && !isAdjacentToLeftBorder && !isAdjacentToRightBorder) {
        startX = firstPos.x + this.gridSize / 2;
        startY = 0;
      } else if (isAdjacentToBottomBorder && !isAdjacentToLeftBorder && !isAdjacentToRightBorder) {
        startX = firstPos.x + this.gridSize / 2;
        startY = this.canvasHeight;
      } else if (isAdjacentToLeftBorder && isAdjacentToTopBorder) {
        startX = 0;
        startY = 0;
      } else if (isAdjacentToRightBorder && isAdjacentToTopBorder) {
        startX = this.canvasWidth;
        startY = 0;
      } else if (isAdjacentToLeftBorder && isAdjacentToBottomBorder) {
        startX = 0;
        startY = this.canvasHeight;
      } else if (isAdjacentToRightBorder && isAdjacentToBottomBorder) {
        startX = this.canvasWidth;
        startY = this.canvasHeight;
      } else {
        // Default to center of first trail position
        startX = firstPos.x + this.gridSize / 2;
        startY = firstPos.y + this.gridSize / 2;
      }
      
      ctx.moveTo(startX, startY);
      
      // Draw through all trail positions
      for (let i = 0; i < trail.length; i++) {
        const pos = trail[i];
        const centerX = pos.x + this.gridSize / 2;
        const centerY = pos.y + this.gridSize / 2;
        
        ctx.lineTo(centerX, centerY);
      }
      
      // Connect to current player position
      const playerCenterX = player.x + this.gridSize / 2;
      const playerCenterY = player.y + this.gridSize / 2;
      ctx.lineTo(playerCenterX, playerCenterY);
      
      // Check if player is on any border and extend line to that border
      const isOnLeftBorder = playerGridX === 0;
      const isOnRightBorder = playerGridX === gridWidth - 1;
      const isOnTopBorder = playerGridY === 0;
      const isOnBottomBorder = playerGridY === gridHeight - 1;
      
      if (isOnLeftBorder) {
        ctx.lineTo(0, playerCenterY);
      }
      if (isOnRightBorder) {
        ctx.lineTo(this.canvasWidth, playerCenterY);
      }
      if (isOnTopBorder) {
        ctx.lineTo(playerCenterX, 0);
      }
      if (isOnBottomBorder) {
        ctx.lineTo(playerCenterX, this.canvasHeight);
      }
      
      // Handle corners - extend to actual corner point
      if (isOnLeftBorder && isOnTopBorder) {
        ctx.lineTo(0, 0);
      } else if (isOnRightBorder && isOnTopBorder) {
        ctx.lineTo(this.canvasWidth, 0);
      } else if (isOnLeftBorder && isOnBottomBorder) {
        ctx.lineTo(0, this.canvasHeight);
      } else if (isOnRightBorder && isOnBottomBorder) {
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Small trail dots
    ctx.fillStyle = 'rgb(219, 39, 119)';
    trail.forEach(pos => {
      const centerX = pos.x + this.gridSize / 2;
      const centerY = pos.y + this.gridSize / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, enemies: Array<{x: number, y: number}>) {
    enemies.forEach((enemy, index) => {
      const centerX = enemy.x + this.gridSize / 2;
      const centerY = enemy.y + this.gridSize / 2;
      const pulse = Math.sin(this.time * 4 + index) * 0.1 + 1;
      
      // Enhanced enemy glow with better quality
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 0.8 * pulse);
      glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      glowGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
      glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemy core with better definition
      const coreGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, this.gridSize * 0.3 * pulse);
      coreGradient.addColorStop(0, 'rgb(248, 113, 113)');
      coreGradient.addColorStop(1, 'rgb(220, 38, 38)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.3 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Enhanced highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.08 * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: {x: number, y: number}) {
    const centerX = player.x + this.gridSize / 2;
    const centerY = player.y + this.gridSize / 2;
    const pulse = Math.sin(this.time * 5) * 0.08 + 1;
    
    // Enhanced player glow
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 0.8 * pulse);
    glowGradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
    glowGradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.3)');
    glowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Player body with gradient
    const bodyGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, this.gridSize * 0.3 * pulse);
    bodyGradient.addColorStop(0, 'rgb(74, 222, 128)');
    bodyGradient.addColorStop(1, 'rgb(22, 163, 74)');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Enhanced highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.08 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCanvasBoundary(ctx: CanvasRenderingContext2D) {
    // Crisp boundary with pixel-perfect alignment
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.rect(1.5, 1.5, this.canvasWidth - 3, this.canvasHeight - 3); // Adjusted for crisp lines
    ctx.stroke();
  }
}
