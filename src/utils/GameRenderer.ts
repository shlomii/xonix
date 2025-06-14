
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
    
    // Clear canvas with smooth gradient background
    this.drawBackground(ctx);

    // Draw grid
    this.drawGrid(ctx);

    // Draw filled areas
    this.drawFilledAreas(ctx, gameState.filledCells);

    // Draw trail
    this.drawTrail(ctx, gameState.trail, gameState.player);

    // Draw enemies
    this.drawEnemies(ctx, gameState.enemies);

    // Draw player
    this.drawPlayer(ctx, gameState.player);

    // Draw border
    this.drawBorder(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    // Smooth gradient background with subtle animation
    const gradient = ctx.createRadialGradient(
      this.canvasWidth / 2, this.canvasHeight / 2, 0,
      this.canvasWidth / 2, this.canvasHeight / 2, Math.max(this.canvasWidth, this.canvasHeight)
    );
    
    const brightness = 8 + Math.sin(this.time) * 2;
    gradient.addColorStop(0, `hsl(220, 15%, ${brightness}%)`);
    gradient.addColorStop(0.5, `hsl(200, 20%, ${brightness + 2}%)`);
    gradient.addColorStop(1, `hsl(240, 25%, ${brightness - 2}%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.canvasWidth; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.canvasHeight; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }
  }

  private drawFilledAreas(ctx: CanvasRenderingContext2D, filledCells: Set<string>) {
    // Pleasant purple filled areas
    const alpha = 0.7 + Math.sin(this.time * 2) * 0.1;
    ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`;

    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    });
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>, player: {x: number, y: number}) {
    if (trail.length === 0) return;

    // Smooth pink trail line
    ctx.strokeStyle = 'rgb(236, 72, 153)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    
    if (trail.length > 0) {
      const firstPos = trail[0];
      const gridX = Math.floor(firstPos.x / this.gridSize);
      const gridY = Math.floor(firstPos.y / this.gridSize);
      const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
      const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
      
      let startX = firstPos.x + this.gridSize / 2;
      let startY = firstPos.y + this.gridSize / 2;
      
      // Connect to actual border edges
      if (gridX === 0) startX = 0;
      else if (gridX === gridWidth - 1) startX = this.canvasWidth;
      
      if (gridY === 0) startY = 0;
      else if (gridY === gridHeight - 1) startY = this.canvasHeight;
      
      ctx.moveTo(startX, startY);
      
      // Draw through all trail positions
      trail.forEach(pos => {
        const centerX = pos.x + this.gridSize / 2;
        const centerY = pos.y + this.gridSize / 2;
        ctx.lineTo(centerX, centerY);
      });
      
      // Connect to current player position
      const playerCenterX = player.x + this.gridSize / 2;
      const playerCenterY = player.y + this.gridSize / 2;
      ctx.lineTo(playerCenterX, playerCenterY);
      
      // Connect player to border if on edge
      const playerGridX = Math.floor(player.x / this.gridSize);
      const playerGridY = Math.floor(player.y / this.gridSize);
      
      let endX = playerCenterX;
      let endY = playerCenterY;
      
      if (playerGridX === 0) endX = 0;
      else if (playerGridX === gridWidth - 1) endX = this.canvasWidth;
      
      if (playerGridY === 0) endY = 0;
      else if (playerGridY === gridHeight - 1) endY = this.canvasHeight;
      
      if (endX !== playerCenterX || endY !== playerCenterY) {
        ctx.lineTo(endX, endY);
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
      const pulse = Math.sin(this.time * 4 + index) * 0.15 + 1;
      
      // Enemy glow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.7 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Enemy core
      ctx.fillStyle = 'rgb(220, 38, 38)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.35 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.12 * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: {x: number, y: number}) {
    const centerX = player.x + this.gridSize / 2;
    const centerY = player.y + this.gridSize / 2;
    const pulse = Math.sin(this.time * 6) * 0.1 + 1;
    
    // Player glow
    ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.shadowColor = 'rgba(34, 197, 94, 0.7)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Player body
    ctx.fillStyle = 'rgb(22, 163, 74)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.35 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Player highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.12 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBorder(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgb(34, 197, 94)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.rect(2, 2, this.canvasWidth - 4, this.canvasHeight - 4);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  }
}
