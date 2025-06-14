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

  // Update dimensions when canvas size changes
  updateDimensions(canvasWidth: number, canvasHeight: number) {
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
    this.drawTrail(ctx, gameState.trail, gameState.player, gameState.filledCells);

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

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>, player: {x: number, y: number}, filledCells: Set<string>) {
    if (trail.length === 0) return;

    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
    const playerGridX = Math.floor(player.x / this.gridSize);
    const playerGridY = Math.floor(player.y / this.gridSize);

    // Find the starting point by looking for the connection to filled area or border
    let startPoint = this.findTrailStartPoint(trail, filledCells, gridWidth, gridHeight);

    // Smooth pink trail line
    ctx.strokeStyle = 'rgb(236, 72, 153)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    
    if (startPoint) {
      ctx.moveTo(startPoint.x, startPoint.y);
      
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
      
      // Connect to end point (border or filled area)
      const endPoint = this.findTrailEndPoint(player, filledCells, gridWidth, gridHeight);
      if (endPoint) {
        ctx.lineTo(endPoint.x, endPoint.y);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Small trail dots for better visibility
    ctx.fillStyle = 'rgb(219, 39, 119)';
    trail.forEach(pos => {
      const centerX = pos.x + this.gridSize / 2;
      const centerY = pos.y + this.gridSize / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Highlight player position when on trail
    ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.fillRect(player.x, player.y, this.gridSize, this.gridSize);
  }

  private findTrailStartPoint(trail: Array<{x: number, y: number}>, filledCells: Set<string>, gridWidth: number, gridHeight: number): {x: number, y: number} | null {
    if (trail.length === 0) return null;

    const firstPos = trail[0];
    const firstGridX = Math.floor(firstPos.x / this.gridSize);
    const firstGridY = Math.floor(firstPos.y / this.gridSize);

    // Check all 4 directions from the first trail position to find connection to filled area or border
    const directions = [
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 }   // down
    ];

    for (const dir of directions) {
      const checkX = firstGridX + dir.dx;
      const checkY = firstGridY + dir.dy;
      
      // Check if this direction leads to border
      if (checkX < 0 || checkX >= gridWidth || checkY < 0 || checkY >= gridHeight) {
        // Return border edge point
        if (checkX < 0) return { x: 0, y: firstPos.y + this.gridSize / 2 };
        if (checkX >= gridWidth) return { x: this.canvasWidth, y: firstPos.y + this.gridSize / 2 };
        if (checkY < 0) return { x: firstPos.x + this.gridSize / 2, y: 0 };
        if (checkY >= gridHeight) return { x: firstPos.x + this.gridSize / 2, y: this.canvasHeight };
      }
      
      // Check if this direction leads to filled area
      if (filledCells.has(`${checkX},${checkY}`)) {
        return { x: firstPos.x + this.gridSize / 2, y: firstPos.y + this.gridSize / 2 };
      }
    }

    return { x: firstPos.x + this.gridSize / 2, y: firstPos.y + this.gridSize / 2 };
  }

  private findTrailEndPoint(player: {x: number, y: number}, filledCells: Set<string>, gridWidth: number, gridHeight: number): {x: number, y: number} | null {
    const playerGridX = Math.floor(player.x / this.gridSize);
    const playerGridY = Math.floor(player.y / this.gridSize);
    const playerCenterX = player.x + this.gridSize / 2;
    const playerCenterY = player.y + this.gridSize / 2;

    // Check if player is on border
    if (playerGridX === 0) return { x: 0, y: playerCenterY };
    if (playerGridX === gridWidth - 1) return { x: this.canvasWidth, y: playerCenterY };
    if (playerGridY === 0) return { x: playerCenterX, y: 0 };
    if (playerGridY === gridHeight - 1) return { x: playerCenterX, y: this.canvasHeight };

    // Check if player is on filled area - just return player center
    if (filledCells.has(`${playerGridX},${playerGridY}`)) {
      return { x: playerCenterX, y: playerCenterY };
    }

    return null;
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
