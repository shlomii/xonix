import { GameState } from '../../types/game';

export class PlayerPhysics {
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

  updatePlayerMovement(gameState: GameState) {
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
}
