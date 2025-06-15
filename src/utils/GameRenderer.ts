import { GameState, Surprise } from '../types/game';

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

    // Draw surprises (bombs)
    this.drawSurprises(ctx, gameState.surprises);

    // Draw enemies
    this.drawEnemies(ctx, gameState.enemies);

    // Draw player
    this.drawPlayer(ctx, gameState.player);

    // Draw canvas boundary (just a thin outline)
    this.drawCanvasBoundary(ctx);
  }

  // Draw all surprises
  private drawSurprises(ctx: CanvasRenderingContext2D, surprises: Surprise[]) {
    surprises.forEach(surprise => {
      if (surprise.type === 'timeBomb') {
        this.drawTimeBomb(ctx, surprise);
      }
    });
  }

  private drawTimeBomb(ctx: CanvasRenderingContext2D, bomb: Surprise) {
    const centerX = bomb.x + this.gridSize / 2;
    const centerY = bomb.y + this.gridSize / 2;
    
    if (bomb.state === 'inactive') {
      // Inactive bomb - gentle orange glow with bomb icon
      const pulse = Math.sin(this.time * 2) * 0.1 + 1;
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 0.6 * pulse);
      glowGradient.addColorStop(0, 'rgba(251, 146, 60, 0.4)');
      glowGradient.addColorStop(0.7, 'rgba(251, 146, 60, 0.2)');
      glowGradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb body
      ctx.fillStyle = '#1f2937'; // Dark gray
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb highlight
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, this.gridSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      // Fuse
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + this.gridSize * 0.2, centerY - this.gridSize * 0.2);
      ctx.lineTo(centerX + this.gridSize * 0.35, centerY - this.gridSize * 0.35);
      ctx.stroke();
      
    } else if (bomb.state === 'activated') {
      // Just activated - brighter glow, preparing for magnetic phase
      const pulse = Math.sin(this.time * 4) * 0.2 + 1;
      
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 0.8 * pulse);
      glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      glowGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
      glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb body (now red)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (bomb.state === 'magnetic') {
      // Magnetic bomb - intense effects
      const pulse = Math.sin(this.time * 6) * 0.3 + 1;
      const timerProgress = bomb.timer / bomb.maxTimer;
      
      // Intense magnetic field glow
      const magneticGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 1.2 * pulse);
      magneticGlow.addColorStop(0, 'rgba(220, 38, 38, 0.8)');
      magneticGlow.addColorStop(0.3, 'rgba(220, 38, 38, 0.4)');
      magneticGlow.addColorStop(0.7, 'rgba(148, 163, 184, 0.2)'); // Magnetic field color
      magneticGlow.addColorStop(1, 'rgba(148, 163, 184, 0)');
      
      ctx.fillStyle = magneticGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 1.2 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw magnetic field lines
      this.drawMagneticField(ctx, centerX, centerY, this.gridSize * 0.8 * pulse);
      
      // Bomb core - more intense
      const coreSize = this.gridSize * (0.35 + timerProgress * 0.15); // Grows as timer progresses
      ctx.fillStyle = '#fee2e2';
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // Danger indicator - timer progress
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.5, -Math.PI / 2, -Math.PI / 2 + (timerProgress * Math.PI * 2));
      ctx.stroke();
    }
  }

  private drawMagneticField(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    const numLines = 8;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const startX = centerX + Math.cos(angle) * radius * 0.6;
      const startY = centerY + Math.sin(angle) * radius * 0.6;
      const endX = centerX + Math.cos(angle) * radius;
      const endY = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  // Make drawEnemies public for game over screen
  drawEnemies(ctx: CanvasRenderingContext2D, enemies: Array<{x: number, y: number}>) {
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
    // Create matte chalk base
    ctx.fillStyle = '#EC4899'; // Base pink color
    ctx.fillRect(x, y, this.gridSize, this.gridSize);
    
    // Add chalk dust texture with small, subtle specks
    ctx.fillStyle = '#F3E8FF'; // Very light lavender for chalk dust
    const numDustParticles = 12 + Math.floor(Math.random() * 8); // More particles but smaller
    
    for (let i = 0; i < numDustParticles; i++) {
      const dustX = x + Math.random() * this.gridSize;
      const dustY = y + Math.random() * this.gridSize;
      const dustSize = 0.3 + Math.random() * 0.7; // Small dust particles
      const opacity = 0.3 + Math.random() * 0.4; // Subtle opacity variation
      
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Add some slightly darker chalk streaks for texture (not sparkly)
    ctx.fillStyle = '#D946EF'; // Slightly darker pink
    const numStreaks = 3 + Math.floor(Math.random() * 3); // 3-6 streaks
    
    for (let i = 0; i < numStreaks; i++) {
      const streakX = x + Math.random() * this.gridSize;
      const streakY = y + Math.random() * this.gridSize;
      const streakSize = 0.4 + Math.random() * 0.6; // Small streaks
      
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(streakX, streakY, streakSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Add very subtle matte border
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, this.gridSize - 1, this.gridSize - 1);
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
