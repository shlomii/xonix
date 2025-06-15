
export interface HighScore {
  name: string;
  score: number;
  date: string;
}

export class HighScoreManager {
  private static readonly STORAGE_KEY = 'xonix-high-scores';
  private static readonly MAX_SCORES = 10;

  static getHighScores(): HighScore[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static addHighScore(name: string, score: number): boolean {
    const scores = this.getHighScores();
    const newScore: HighScore = {
      name: name.toUpperCase().substring(0, 3).padEnd(3, ' '),
      score,
      date: new Date().toISOString()
    };

    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score);
    scores.splice(this.MAX_SCORES);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    
    // Return true if it made it to the high score list
    return scores.includes(newScore);
  }

  static isHighScore(score: number): boolean {
    const scores = this.getHighScores();
    return scores.length < this.MAX_SCORES || score > scores[scores.length - 1]?.score;
  }

  static clearHighScores(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
