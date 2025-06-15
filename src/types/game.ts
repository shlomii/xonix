
export interface Position {
  x: number;
  y: number;
}

export interface Sprite extends Position {
  vx: number;
  vy: number;
}

export interface Enemy extends Sprite {}

export interface Surprise extends Position {
  id: string;
  type: 'timeBomb';
  state: 'inactive' | 'activated' | 'magnetic' | 'exploded';
  timer: number;
  maxTimer: number;
}

export interface GameState {
  player: Sprite;
  enemies: Enemy[];
  trail: Position[];
  filledCells: Set<string>;
  score: number;
  areaFilled: number;
  isAlive: boolean;
  keys: Set<string>;
  level: number;
  enemyCount: number;
  isLevelTransition: boolean;
  surprises: Surprise[];
}

export interface GameConfig {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  playerSpeed: number;
  enemySpeed: number;
  winThreshold: number;
}
