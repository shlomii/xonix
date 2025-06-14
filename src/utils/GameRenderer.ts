
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
    this.time += 0.1;
    
    // Clear canvas with animated background
    this.drawPsychedelicBackground(ctx);

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

  private drawPsychedelicBackground(ctx: CanvasRenderingContext2D) {
    // Create animated gradient background
    const gradient = ctx.createRadialGradient(
      this.canvasWidth / 2, this.canvasHeight / 2, 0,
      this.canvasWidth / 2, this.canvasHeight / 2, Math.max(this.canvasWidth, this.canvasHeight)
    );
    
    const hue1 = (this.time * 20) % 360;
    const hue2 = (this.time * 30 + 120) % 360;
    const hue3 = (this.time * 40 + 240) % 360;
    
    gradient.addColorStop(0, `hsl(${hue1}, 20%, 8%)`);
    gradient.addColorStop(0.5, `hsl(${hue2}, 25%, 12%)`);
    gradient.addColorStop(1, `hsl(${hue3}, 30%, 6%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    const hue = (this.time * 50) % 360;
    ctx.strokeStyle = `hsl(${hue}, 40%, 25%)`;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4 + Math.sin(this.time) * 0.1;

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
    const hue = (this.time * 80 + 120) % 360;
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.globalAlpha = 0.6 + Math.sin(this.time * 2) * 0.2;

    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    });

    ctx.globalAlpha = 1;
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>, player: {x: number, y: number}) {
    if (trail.length === 0) return;

    const hue = (this.time * 100 + 60) % 360;
    ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.lineWidth = 6 + Math.sin(this.time * 3) * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    
    // Start from the first trail position
    if (trail.length > 0) {
      const firstPos = trail[0];
      const centerX = firstPos.x + this.gridSize / 2;
      const centerY = firstPos.y + this.gridSize / 2;
      
      // Check if first position is on border and extend line to border
      const gridX = Math.floor(firstPos.x / this.gridSize);
      const gridY = Math.floor(firstPos.y / this.gridSize);
      const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
      const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
      
      let startX = centerX;
      let startY = centerY;
      
      // Extend to border if on border
      if (gridX === 0) startX = 0;
      if (gridX === gridWidth - 1) startX = this.canvasWidth;
      if (gridY === 0) startY = 0;
      if (gridY === gridHeight - 1) startY = this.canvasHeight;
      
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
      
      // Check if player is on border and extend line to border
      const playerGridX = Math.floor(player.x / this.gridSize);
      const playerGridY = Math.floor(player.y / this.gridSize);
      
      let endX = playerCenterX;
      let endY = playerCenterY;
      
      if (playerGridX === 0) endX = 0;
      if (playerGridX === gridWidth - 1) endX = this.canvasWidth;
      if (playerGridY === 0) endY = 0;
      if (playerGridY === gridHeight - 1) endY = this.canvasHeight;
      
      if (endX !== playerCenterX || endY !== playerCenterY) {
        ctx.lineTo(endX, endY);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw pulsing trail dots
    const dotHue = (this.time * 120 + 180) % 360;
    ctx.fillStyle = `hsl(${dotHue}, 90%, 70%)`;
    trail.forEach((pos, index) => {
      const centerX = pos.x + this.gridSize / 2;
      const centerY = pos.y + this.gridSize / 2;
      const pulse = Math.sin(this.time * 4 + index * 0.5) * 2 + 4;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, enemies: Array<{x: number, y: number}>) {
    enemies.forEach((enemy, index) => {
      const centerX = enemy.x + this.gridSize / 2;
      const centerY = enemy.y + this.gridSize / 2;
      const pulse = Math.sin(this.time * 3 + index) * 0.3 + 1;
      
      // Draw enemy glow with rainbow effect
      const hue = (this.time * 150 + index * 60) % 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.globalAlpha = 0.4;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw enemy core
      ctx.fillStyle = `hsl(${(hue + 180) % 360}, 80%, 40%)`;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.4 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw enemy highlight
      ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.15 * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: {x: number, y: number}) {
    const centerX = player.x + this.gridSize / 2;
    const centerY = player.y + this.gridSize / 2;
    const pulse = Math.sin(this.time * 4) * 0.2 + 1;
    
    // Draw player glow
    const hue = (this.time * 200) % 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw player body
    ctx.fillStyle = `hsl(${(hue + 60) % 360}, 70%, 50%)`;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player highlight
    ctx.fillStyle = `hsl(${hue}, 90%, 80%)`;
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.15 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBorder(ctx: CanvasRenderingContext2D) {
    const hue = (this.time * 100) % 360;
    ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.lineWidth = 6 + Math.sin(this.time * 2) * 2;
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = this.time * 10;
    ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.rect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  }
}
