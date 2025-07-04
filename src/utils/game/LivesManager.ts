import { GameState } from '../../types/game';
import { audioManager } from '../AudioManager';

export class LivesManager {
  private readonly STARTING_LIVES = 2;
  private readonly MAX_LIVES = 9; // Reasonable cap to prevent UI overflow
  private readonly LIFE_SCORE_INTERVAL = 150000; // 150,000 points per extra life

  // Initialize lives for a new game
  initializeLives(gameState: GameState) {
    gameState.lives = this.STARTING_LIVES;
    gameState.maxLives = this.MAX_LIVES;
    gameState.lastLifeScore = 0;
    console.log(`🎮 Lives initialized: ${gameState.lives} lives`);
  }

  // Check if player should receive an extra life based on score
  checkForExtraLife(gameState: GameState) {
    const scoreThreshold = Math.floor(gameState.score / this.LIFE_SCORE_INTERVAL);
    const lastThreshold = Math.floor(gameState.lastLifeScore / this.LIFE_SCORE_INTERVAL);
    
    if (scoreThreshold > lastThreshold && gameState.lives < gameState.maxLives) {
      this.awardExtraLife(gameState);
    }
  }

  // Award an extra life with visual and audio feedback
  private awardExtraLife(gameState: GameState) {
    gameState.lives++;
    gameState.lastLifeScore = gameState.score;
    
    // Play satisfying extra life sound
    audioManager.playExtraLife();
    
    console.log(`🌟 EXTRA LIFE! Score: ${gameState.score.toLocaleString()}, Lives: ${gameState.lives}`);
    
    // Could trigger a visual effect here in the future
    return true;
  }

  // Handle player death - lose a life or end game
  handlePlayerDeath(gameState: GameState): boolean {
    if (gameState.lives > 1) {
      gameState.lives--;
      gameState.isAlive = true; // Revive player
      
      // Reset player position to safe starting position
      gameState.player.x = 0;
      gameState.player.y = 0;
      gameState.player.vx = 0;
      gameState.player.vy = 0;
      
      // Clear any dangerous trail
      gameState.trail = [];
      
      console.log(`💀 Life lost! Remaining lives: ${gameState.lives}`);
      audioManager.playLifeLost();
      
      return true; // Player continues
    } else {
      // Game over - no lives left
      gameState.lives = 0;
      gameState.isAlive = false;
      
      console.log('💀 GAME OVER - No lives remaining');
      audioManager.playGameOver();
      
      return false; // Game ends
    }
  }

  // Get the next score threshold for extra life
  getNextLifeThreshold(gameState: GameState): number {
    const currentThreshold = Math.floor(gameState.score / this.LIFE_SCORE_INTERVAL);
    return (currentThreshold + 1) * this.LIFE_SCORE_INTERVAL;
  }

  // Get progress towards next extra life (0-1)
  getExtraLifeProgress(gameState: GameState): number {
    const nextThreshold = this.getNextLifeThreshold(gameState);
    const lastThreshold = Math.floor(gameState.score / this.LIFE_SCORE_INTERVAL) * this.LIFE_SCORE_INTERVAL;
    const progress = (gameState.score - lastThreshold) / (nextThreshold - lastThreshold);
    return Math.min(1, Math.max(0, progress));
  }

  // Reset lives when starting a new game
  resetLives(gameState: GameState) {
    this.initializeLives(gameState);
  }
}