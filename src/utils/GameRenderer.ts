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
    
    // Clear canvas with enhanced gradient background
    this.drawBackground(ctx);

    // Draw subtle grid
    this.drawGrid(ctx);

    // Draw filled areas with enhanced visuals
    this.drawFilledAreas(ctx, gameState.filledCells);

    // Draw trail with improved chalk effect - FIXED: Now uses actual player position
    this.drawTrail(ctx, gameState.trail, gameState.player, gameState.filledCells);

    // Draw surprises (bombs) with enhanced effects
    this.drawSurprises(ctx, gameState.surprises);

    // Draw enemies with improved glow effects
    this.drawEnemies(ctx, gameState.enemies);

    // Draw player with enhanced visuals
    this.drawPlayer(ctx, gameState.player);

    // Draw canvas boundary
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
      
      // Enhanced glow effect
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 0.8 * pulse);
      glowGradient.addColorStop(0, 'rgba(251, 146, 60, 0.6)');
      glowGradient.addColorStop(0.5, 'rgba(251, 146, 60, 0.3)');
      glowGradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb body with gradient
      const bodyGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, this.gridSize * 0.3);
      bodyGradient.addColorStop(0, '#4b5563');
      bodyGradient.addColorStop(1, '#1f2937');
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX - 3, centerY - 3, this.gridSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
      
      // Enhanced fuse
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX + this.gridSize * 0.25, centerY - this.gridSize * 0.25);
      ctx.lineTo(centerX + this.gridSize * 0.4, centerY - this.gridSize * 0.4);
      ctx.stroke();
      
      // Fuse spark
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(centerX + this.gridSize * 0.4, centerY - this.gridSize * 0.4, 2, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (bomb.state === 'activated') {
      // Just activated - brighter glow, preparing for magnetic phase
      const pulse = Math.sin(this.time * 6) * 0.3 + 1;
      
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 1.0 * pulse);
      glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      glowGradient.addColorStop(0.4, 'rgba(239, 68, 68, 0.4)');
      glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 1.0 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb body (now red with gradient)
      const bodyGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, this.gridSize * 0.35);
      bodyGradient.addColorStop(0, '#f87171');
      bodyGradient.addColorStop(1, '#dc2626');
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (bomb.state === 'magnetic') {
      // Magnetic bomb - intense effects
      const pulse = Math.sin(this.time * 8) * 0.4 + 1;
      const timerProgress = bomb.timer / bomb.maxTimer;
      
      // Intense magnetic field glow with multiple layers
      const magneticGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 1.5 * pulse);
      magneticGlow.addColorStop(0, 'rgba(220, 38, 38, 0.9)');
      magneticGlow.addColorStop(0.2, 'rgba(220, 38, 38, 0.6)');
      magneticGlow.addColorStop(0.5, 'rgba(148, 163, 184, 0.4)');
      magneticGlow.addColorStop(0.8, 'rgba(59, 130, 246, 0.2)');
      magneticGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = magneticGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 1.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw enhanced magnetic field lines
      this.drawMagneticField(ctx, centerX, centerY, this.gridSize * 1.0 * pulse);
      
      // Bomb core - more intense with multiple layers
      const coreSize = this.gridSize * (0.4 + timerProgress * 0.2);
      
      // Outer core glow
      ctx.fillStyle = 'rgba(254, 226, 226, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize * 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner core
      const coreGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, coreSize);
      coreGradient.addColorStop(0, '#fecaca');
      coreGradient.addColorStop(0.7, '#dc2626');
      coreGradient.addColorStop(1, '#991b1b');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Danger indicator - enhanced timer progress
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.6, -Math.PI / 2, -Math.PI / 2 + (timerProgress * Math.PI * 2));
      ctx.stroke();
      
      // Warning pulses
      if (timerProgress > 0.7) {
        const warningPulse = Math.sin(this.time * 15) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${warningPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.gridSize * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawMagneticField(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    const numLines = 12;
    const time = this.time * 2;
    
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2 + time * 0.5;
      const innerRadius = radius * 0.5;
      const outerRadius = radius * (0.9 + Math.sin(time + i) * 0.1);
      
      const startX = centerX + Math.cos(angle) * innerRadius;
      const startY = centerY + Math.sin(angle) * innerRadius;
      const endX = centerX + Math.cos(angle) * outerRadius;
      const endY = centerY + Math.sin(angle) * outerRadius;
      
      const opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
      ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Add arrowhead for direction
      const arrowSize = 4;
      const arrowAngle = Math.atan2(endY - startY, endX - startX);
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.stroke();
    }
  }

  // Enhanced enemy rendering
  drawEnemies(ctx: CanvasRenderingContext2D, enemies: Array<{x: number, y: number}>) {
    enemies.forEach((enemy, index) => {
      const centerX = enemy.x + this.gridSize / 2;
      const centerY = enemy.y + this.gridSize / 2;
      const pulse = Math.sin(this.time * 5 + index * 0.5) * 0.15 + 1;
      
      // Enhanced enemy glow with multiple layers
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 1.2 * pulse);
      outerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      outerGlow.addColorStop(0.3, 'rgba(239, 68, 68, 0.4)');
      outerGlow.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
      outerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 1.2 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemy core with enhanced gradient
      const coreGradient = ctx.createRadialGradient(centerX - 3, centerY - 3, 0, centerX, centerY, this.gridSize * 0.35 * pulse);
      coreGradient.addColorStop(0, '#fca5a5');
      coreGradient.addColorStop(0.4, '#f87171');
      coreGradient.addColorStop(0.8, '#dc2626');
      coreGradient.addColorStop(1, '#991b1b');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.35 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Enhanced highlight with animation
      const highlightPulse = Math.sin(this.time * 8 + index) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${highlightPulse})`;
      ctx.beginPath();
      ctx.arc(centerX - 3, centerY - 3, this.gridSize * 0.1 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle energy rings
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.gridSize * 0.5 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    // Enhanced gradient background with animated elements
    const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.2, '#1e293b');
    gradient.addColorStop(0.5, '#334155');
    gradient.addColorStop(0.8, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Add subtle animated stars
    const starCount = 20;
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.5) % this.canvasWidth; // Golden ratio distribution
      const y = (i * 73.2) % this.canvasHeight;
      const twinkle = Math.sin(this.time * 2 + i) * 0.5 + 0.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + twinkle * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.06)';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= this.canvasWidth; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.canvasHeight; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.canvasWidth, y + 0.5);
      ctx.stroke();
    }
  }

  private drawFilledAreas(ctx: CanvasRenderingContext2D, filledCells: Set<string>) {
    // Enhanced filled areas with gradient and texture
    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      const cellX = x * this.gridSize;
      const cellY = y * this.gridSize;
      
      // Base gradient
      const gradient = ctx.createLinearGradient(cellX, cellY, cellX + this.gridSize, cellY + this.gridSize);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#7c3aed');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(cellX, cellY, this.gridSize, this.gridSize);
      
      // Add subtle texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 3; i++) {
        const dotX = cellX + Math.random() * this.gridSize;
        const dotY = cellY + Math.random() * this.gridSize;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Enhanced border for filled areas
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 1;
    filledCells.forEach(cell => {
      const [x, y] = cell.split(',').map(Number);
      ctx.strokeRect(x * this.gridSize + 0.5, y * this.gridSize + 0.5, this.gridSize - 1, this.gridSize - 1);
    });
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: Array<{x: number, y: number}>, player: {x: number, y: number}, filledCells: Set<string>) {
    if (trail.length === 0) return;

    const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
    const gridHeight = Math.floor(this.canvasHeight / this.gridSize);

    // FIXED: Draw trail using actual positions, not grid-aligned positions
    trail.forEach((pos, index) => {
      const age = (trail.length - index) / trail.length; // Newer trail segments are brighter
      
      // Use the actual position stored in the trail
      this.drawEnhancedChalkCell(ctx, pos.x, pos.y, age);
    });

    // Highlight current player position if on trail
    const playerGridX = Math.floor(player.x / this.gridSize);
    const playerGridY = Math.floor(player.y / this.gridSize);
    const isPlayerOnBorder = playerGridX === 0 || playerGridX === gridWidth - 1 || 
                           playerGridY === 0 || playerGridY === gridHeight - 1;
    const isPlayerOnFilled = filledCells.has(`${playerGridX},${playerGridY}`);
    
    if (!isPlayerOnBorder && !isPlayerOnFilled) {
      // FIXED: Draw player trail at actual player position
      this.drawEnhancedChalkCell(ctx, player.x, player.y, 1.0);
    }
  }

  private drawEnhancedChalkCell(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number = 1.0) {
    // FIXED: Draw chalk effect at the exact position, not grid-aligned
    // The chalk effect should be centered on the player's actual position
    const chalkSize = this.gridSize * 0.8; // Slightly smaller than grid for better visual
    const chalkX = x + (this.gridSize - chalkSize) / 2;
    const chalkY = y + (this.gridSize - chalkSize) / 2;
    
    // Enhanced chalk effect with better texture and glow
    const baseAlpha = 0.8 + intensity * 0.2;
    
    // Base chalk color with gradient
    const gradient = ctx.createLinearGradient(chalkX, chalkY, chalkX + chalkSize, chalkY + chalkSize);
    gradient.addColorStop(0, `rgba(236, 72, 153, ${baseAlpha})`);
    gradient.addColorStop(0.5, `rgba(219, 39, 119, ${baseAlpha * 0.9})`);
    gradient.addColorStop(1, `rgba(190, 24, 93, ${baseAlpha * 0.8})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(chalkX, chalkY, chalkSize, chalkSize);
    
    // Add chalk dust texture with better distribution
    ctx.fillStyle = `rgba(243, 232, 255, ${0.6 * intensity})`;
    const numDustParticles = Math.floor(8 + Math.random() * 6);
    
    for (let i = 0; i < numDustParticles; i++) {
      const dustX = chalkX + Math.random() * chalkSize;
      const dustY = chalkY + Math.random() * chalkSize;
      const dustSize = 0.5 + Math.random() * 1.0;
      const opacity = 0.4 + Math.random() * 0.4;
      
      ctx.globalAlpha = opacity * intensity;
      ctx.beginPath();
      ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
    
    // Add subtle glow effect
    if (intensity > 0.7) {
      const glowGradient = ctx.createRadialGradient(
        x + this.gridSize / 2, y + this.gridSize / 2, 0,
        x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize * 0.8
      );
      glowGradient.addColorStop(0, `rgba(236, 72, 153, ${0.3 * intensity})`);
      glowGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - this.gridSize * 0.2, y - this.gridSize * 0.2, this.gridSize * 1.4, this.gridSize * 1.4);
    }
    
    // Enhanced border - draw around the actual position
    ctx.strokeStyle = `rgba(236, 72, 153, ${0.5 * intensity})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(chalkX + 0.5, chalkY + 0.5, chalkSize - 1, chalkSize - 1);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: {x: number, y: number}) {
    const centerX = player.x + this.gridSize / 2;
    const centerY = player.y + this.gridSize / 2;
    const pulse = Math.sin(this.time * 6) * 0.1 + 1;
    
    // Enhanced player glow with multiple layers
    const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize * 1.2 * pulse);
    outerGlow.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
    outerGlow.addColorStop(0.3, 'rgba(34, 197, 94, 0.4)');
    outerGlow.addColorStop(0.7, 'rgba(34, 197, 94, 0.2)');
    outerGlow.addColorStop(1, 'rgba(34, 197, 94, 0)');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 1.2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Player body with enhanced gradient
    const bodyGradient = ctx.createRadialGradient(centerX - 3, centerY - 3, 0, centerX, centerY, this.gridSize * 0.35 * pulse);
    bodyGradient.addColorStop(0, '#bbf7d0');
    bodyGradient.addColorStop(0.3, '#86efac');
    bodyGradient.addColorStop(0.7, '#22c55e');
    bodyGradient.addColorStop(1, '#16a34a');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.35 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Enhanced highlight with animation
    const highlightPulse = Math.sin(this.time * 10) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${highlightPulse})`;
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, this.gridSize * 0.12 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Add energy ring
    ctx.strokeStyle = `rgba(34, 197, 94, ${0.6 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize * 0.5 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawCanvasBoundary(ctx: CanvasRenderingContext2D) {
    // Enhanced boundary with gradient
    const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.9)');
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0.9)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.rect(1.5, 1.5, this.canvasWidth - 3, this.canvasHeight - 3);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
}