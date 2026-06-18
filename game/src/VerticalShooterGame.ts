import Phaser from 'phaser';
import { DEFAULT_CONFIG } from './config';
import { VerticalShooterScene } from './VerticalShooterScene';

export class VerticalShooterGame {
  private game: Phaser.Game;

  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: DEFAULT_CONFIG.width,
      height: DEFAULT_CONFIG.height,
      backgroundColor: '#0a0a2e',
      scene: [VerticalShooterScene],
      parent: document.body,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
    };

    this.game = new Phaser.Game(config);
  }

  destroy(): void {
    this.game.destroy(true);
  }
}
