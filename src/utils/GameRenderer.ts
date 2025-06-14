
import { GameState } from '../types/game';

export class GameRenderer {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  render(ctx: CanvasRenderingContext2D, gameState: GameState) {
    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw grid
    this.drawGrid(ctx);

    // Draw filled areas
    this.drawFilledAreas(ctx, gameState.filledCells);

    // Draw trail
    this.drawTrail(ctx, gameState.trail);

    // Draw enemies
    this.drawEnemies(ctx, gameState.enemies);

    // Draw player
    this.drawPlayer(ctx, gameState.player);

    // Draw border
    this.drawBorder(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

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

    ctx.globalAlpha = 1;
  }

  private drawFilledAreas(ctx: CanvasRenderingContext2D, filledCells: Set<string>) {
    ctx.fillStyle = '#22c55e';
    ctx.globalAlpha = 0.8;

    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    });

    ctx.globalAlpha = 1;
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>) {
    if (trail.length === 0) return;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    trail.forEach((pos, index) => {
      const centerX = pos.x + this.gridSize / 2;
      const centerY = pos.y + this.gridSize / 2;
      
      if (index === 0) {
        ctx.moveTo(centerX, centerY);
      } else {
        ctx.lineTo(centerX, centerY);
      }
    });
    ctx.stroke();

    // Draw trail dots
    ctx.fillStyle = '#34d399';
    trail.forEach(pos => {
      const centerX = pos.x + this.gridSize / 2;
      const centerY = pos.y + this.gridSize / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, enemies: Array<{x: number, y: number}>) {
    enemies.forEach(enemy => {
      const centerX = enemy.x + this.gridSize / 2;
      const centerY = enemy.y + this.gridSize / 2;
      
      // Draw enemy glow
      ctx.fillStyle = '#ef4444';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw enemy core
      ctx.fillStyle = '#dc2626';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw enemy highlight
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: {x: number, y: number}) {
    const centerX = player.x + this.gridSize / 2;
    const centerY = player.y + this.gridSize / 2;
    
    // Draw player glow
    ctx.fillStyle = '#22c55e';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player body
    ctx.fillStyle = '#16a34a';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player highlight
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBorder(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.rect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.stroke();
  }
}
