export interface GameConfig {
  width: number;
  height: number;
  playerSpeed: number;
  playerFireRate: number;
  playerHealth: number;
  enemySpawnInterval: number;
  enemySpeed: number;
  enemiesPerLevel: number;
  powerupSpawnChance: number;
  powerupDuration: number;
  difficultyScale: number;
}

export interface GameState {
  score: number;
  level: number;
  health: number;
  enemiesDestroyed: number;
  activePowerup: PowerupType | null;
  powerupExpiry: number;
  lastFireTime: number;
  fireRate: number;
  isGameOver: boolean;
}

export type PowerupType = 'shield' | 'rapidFire' | 'spreadShot';

export type EnemyType = 'basic' | 'zigzag' | 'shooter';

export interface EnemyData {
  type: EnemyType;
  health: number;
  points: number;
  speed: number;
  zigzagAmplitude?: number;
  zigzagFrequency?: number;
  shootInterval?: number;
  lastShootTime?: number;
}
