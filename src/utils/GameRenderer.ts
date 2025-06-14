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
    // Solid purple filled areas
    ctx.fillStyle = '#8B5CF6'; // Solid purple color
    
    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    });

    // Add subtle border to filled areas for better definition
    ctx.strokeStyle = '#6D28D9';
    ctx.lineWidth = 0.5;
    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.strokeRect(x * this.gridSize + 0.5, y * this.gridSize + 0.5, this.gridSize - 1, this.gridSize - 1);
    });
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>, player: {x: number, y: number}, filledCells: Set<string>) {
    if (trail.length === 0) return;

    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);

    // Draw chalky trail effect for each trail cell
    trail.forEach(pos => {
      const gridX = Math.floor(pos.x / this.gridSize);
      const gridY = Math.floor(pos.y / this.gridSize);
      
      this.drawChalkCell(ctx, gridX * this.gridSize, gridY * this.gridSize);
    });

    // Highlight current player position if on trail
    const playerGridX = Math.floor(player.x / this.gridSize);
    const playerGridY = Math.floor(player.y / this.gridSize);
    const isPlayerOnBorder = playerGridX === 0 || playerGridX === gridWidth - 1 || 
                           playerGridY === 0 || playerGridY === gridHeight - 1;
    const isPlayerOnFilled = filledCells.has(`${playerGridX},${playerGridY}`);
    
    if (!isPlayerOnBorder && !isPlayerOnFilled) {
      this.drawChalkCell(ctx, player.x, player.y);
    }
  }

  private drawChalkCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Create chalky texture effect
    ctx.fillStyle = '#EC4899'; // Base pink color
    ctx.fillRect(x, y, this.gridSize, this.gridSize);
    
    // Add chalky texture with multiple random dots/specks
    ctx.fillStyle = '#F8BBD9'; // Lighter pink for highlights
    const numSpecks = 8 + Math.floor(Math.random() * 4); // 8-12 specks per cell
    
    for (let i = 0; i < numSpecks; i++) {
      const speckX = x + Math.random() * this.gridSize;
      const speckY = y + Math.random() * this.gridSize;
      const speckSize = 0.5 + Math.random() * 1.5; // Random size between 0.5-2px
      
      ctx.beginPath();
      ctx.arc(speckX, speckY, speckSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some darker specks for depth
    ctx.fillStyle = '#BE185D'; // Darker pink
    const numDarkSpecks = 3 + Math.floor(Math.random() * 3); // 3-6 dark specks
    
    for (let i = 0; i < numDarkSpecks; i++) {
      const speckX = x + Math.random() * this.gridSize;
      const speckY = y + Math.random() * this.gridSize;
      const speckSize = 0.3 + Math.random() * 0.8; // Smaller dark specks
      
      ctx.beginPath();
      ctx.arc(speckX, speckY, speckSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add subtle border
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, this.gridSize - 1, this.gridSize - 1);
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
