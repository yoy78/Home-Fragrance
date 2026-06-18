import { GameConfig } from './types';

export const DEFAULT_CONFIG: GameConfig = {
  width: 480,
  height: 720,
  playerSpeed: 300,
  playerFireRate: 300,
  playerHealth: 3,
  enemySpawnInterval: 1500,
  enemySpeed: 120,
  enemiesPerLevel: 20,
  powerupSpawnChance: 0.15,
  powerupDuration: 5000,
  difficultyScale: 1.2,
};

export const COLORS = {
  background: 0x0a0a2e,
  star: 0xffffff,
  player: 0x00aaff,
  playerBullet: 0xffff00,
  enemyBasic: 0xff4444,
  enemyZigzag: 0xff8800,
  enemyShooter: 0xff00ff,
  enemyBullet: 0xff0000,
  powerupShield: 0x00ffff,
  powerupRapidFire: 0xffaa00,
  powerupSpreadShot: 0xaa00ff,
  ui: 0xffffff,
  healthBar: 0x00ff00,
};
