
import { GameState } from '../../types/game';

export class PlayerPhysics {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private playerSpeed = 5;
  private friction = 0.7;
  private acceleration = 1.2;
  private directionChangeBoost = 2;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  updatePlayerMovement(gameState: GameState) {
    const { player, keys } = gameState;
    
    // Track current movement direction
    const wasMovingLeft = player.vx < -0.5;
    const wasMovingRight = player.vx > 0.5;
    const wasMovingUp = player.vy < -0.5;
    const wasMovingDown = player.vy > 0.5;
    
    // Apply input acceleration with direction change boost
    if (keys.has('arrowleft') || keys.has('a')) {
      const boost = wasMovingRight ? this.directionChangeBoost : 1;
      player.vx = Math.max(player.vx - this.acceleration * boost, -this.playerSpeed);
    }
    if (keys.has('arrowright') || keys.has('d')) {
      const boost = wasMovingLeft ? this.directionChangeBoost : 1;
      player.vx = Math.min(player.vx + this.acceleration * boost, this.playerSpeed);
    }
    if (keys.has('arrowup') || keys.has('w')) {
      const boost = wasMovingDown ? this.directionChangeBoost : 1;
      player.vy = Math.max(player.vy - this.acceleration * boost, -this.playerSpeed);
    }
    if (keys.has('arrowdown') || keys.has('s')) {
      const boost = wasMovingUp ? this.directionChangeBoost : 1;
      player.vy = Math.min(player.vy + this.acceleration * boost, this.playerSpeed);
    }

    // Apply stronger friction when no input for snappier stops
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

    // Stop very small movements for cleaner control
    if (Math.abs(player.vx) < 0.2) player.vx = 0;
    if (Math.abs(player.vy) < 0.2) player.vy = 0;
  }
}
