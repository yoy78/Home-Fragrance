import Phaser from 'phaser';
import { DEFAULT_CONFIG, COLORS } from './config';
import { GameState, EnemyData, EnemyType, PowerupType } from './types';

export class VerticalShooterScene extends Phaser.Scene {
  private config = { ...DEFAULT_CONFIG };
  private state!: GameState;

  private player!: Phaser.GameObjects.Rectangle;
  private playerBullets!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private powerups!: Phaser.GameObjects.Group;
  private stars!: Phaser.GameObjects.Group;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;

  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private powerupText!: Phaser.GameObjects.Text;
  private gameOverContainer!: Phaser.GameObjects.Container;

  private lastEnemySpawn = 0;
  private lastPowerupSpawn = 0;

  constructor() {
    super({ key: 'VerticalShooterScene' });
  }

  create(): void {
    this.state = {
      score: 0,
      level: 1,
      health: this.config.playerHealth,
      enemiesDestroyed: 0,
      activePowerup: null,
      powerupExpiry: 0,
      lastFireTime: 0,
      fireRate: this.config.playerFireRate,
      isGameOver: false,
    };

    this.createBackground();
    this.createPlayer();
    this.createGroups();
    this.createInput();
    this.createUI();
  }

  private createBackground(): void {
    this.add.rectangle(
      this.config.width / 2,
      this.config.height / 2,
      this.config.width,
      this.config.height,
      COLORS.background
    );

    this.stars = this.add.group();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, this.config.width);
      const y = Phaser.Math.Between(0, this.config.height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0);
      const star = this.add.rectangle(x, y, size, size, COLORS.star, alpha);
      this.stars.add(star);
    }
  }

  private createPlayer(): void {
    this.player = this.add.rectangle(
      this.config.width / 2,
      this.config.height - 80,
      32, 40,
      COLORS.player
    );

    // Nose triangle
    this.add.triangle(
      this.config.width / 2, this.config.height - 80 - 20,
      0, 20, 16, -20, -16, -20,
      COLORS.player
    );
  }

  private createGroups(): void {
    this.playerBullets = this.add.group();
    this.enemies = this.add.group();
    this.enemyBullets = this.add.group();
    this.powerups = this.add.group();
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private createUI(): void {
    const style = { fontSize: '16px', color: '#ffffff', fontFamily: 'monospace' };

    this.scoreText = this.add.text(10, 10, 'Score: 0', style);
    this.levelText = this.add.text(10, 32, 'Level: 1', style);
    this.healthText = this.add.text(10, 54, 'Vie: ❤️❤️❤️', style);
    this.powerupText = this.add.text(10, 76, '', { ...style, color: '#ffff00' });

    this.gameOverContainer = this.add.container(this.config.width / 2, this.config.height / 2);
    this.gameOverContainer.setVisible(false);

    const bg = this.add.rectangle(0, 0, 320, 200, 0x000000, 0.8);
    const titleText = this.add.text(0, -60, 'GAME OVER', {
      fontSize: '32px', color: '#ff0000', fontFamily: 'monospace'
    }).setOrigin(0.5);

    const finalScore = this.add.text(0, -10, 'Score: 0', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5).setName('finalScore');

    const restartBtn = this.add.text(0, 50, '[ RECOMMENCER ]', {
      fontSize: '18px', color: '#00ff00', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => this.scene.restart());
    restartBtn.on('pointerover', () => restartBtn.setColor('#ffff00'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#00ff00'));

    this.gameOverContainer.add([bg, titleText, finalScore, restartBtn]);
  }

  update(time: number, delta: number): void {
    if (this.state.isGameOver) return;

    this.scrollStars(delta);
    this.handleInput(time);
    this.spawnEnemies(time);
    this.updateEnemies(time, delta);
    this.updateBullets();
    this.checkCollisions();
    this.checkPowerupExpiry(time);
    this.updateUI();
  }

  private scrollStars(delta: number): void {
    this.stars.getChildren().forEach((star) => {
      const s = star as Phaser.GameObjects.Rectangle;
      s.y += (delta / 1000) * 30 * (s.width);
      if (s.y > this.config.height) s.y = 0;
    });
  }

  private handleInput(time: number): void {
    const speed = this.config.playerSpeed;

    if (this.cursors.left.isDown) {
      this.player.x = Math.max(this.player.width / 2, this.player.x - speed * (1 / 60));
    } else if (this.cursors.right.isDown) {
      this.player.x = Math.min(this.config.width - this.player.width / 2, this.player.x + speed * (1 / 60));
    }

    if (this.cursors.up.isDown) {
      this.player.y = Math.max(this.player.height / 2, this.player.y - speed * (1 / 60));
    } else if (this.cursors.down.isDown) {
      this.player.y = Math.min(this.config.height - this.player.height / 2, this.player.y + speed * (1 / 60));
    }

    if (this.fireKey.isDown && time - this.state.lastFireTime > this.state.fireRate) {
      this.firePlayerBullet(time);
    }
  }

  private firePlayerBullet(time: number): void {
    this.state.lastFireTime = time;

    if (this.state.activePowerup === 'spreadShot') {
      [-20, 0, 20].forEach((angle) => {
        this.createBullet(this.player.x, this.player.y - 20, true, angle);
      });
    } else {
      this.createBullet(this.player.x, this.player.y - 20, true, 0);
    }
  }

  private createBullet(x: number, y: number, isPlayer: boolean, angleOffset: number = 0): void {
    const color = isPlayer ? COLORS.playerBullet : COLORS.enemyBullet;
    const bullet = this.add.rectangle(x, y, 4, 14, color);
    const speed = isPlayer ? -500 : 300;
    const vx = angleOffset !== 0 ? Math.sin(Phaser.Math.DegToRad(angleOffset)) * Math.abs(speed) : 0;
    const vy = speed;
    bullet.setData('vx', vx);
    bullet.setData('vy', vy);
    bullet.setData('isPlayer', isPlayer);
    (isPlayer ? this.playerBullets : this.enemyBullets).add(bullet);
  }

  private spawnEnemies(time: number): void {
    const interval = this.config.enemySpawnInterval / Math.pow(this.config.difficultyScale, this.state.level - 1);
    if (time - this.lastEnemySpawn < interval) return;
    this.lastEnemySpawn = time;

    const roll = Math.random();
    let type: EnemyType;
    if (roll < 0.5) type = 'basic';
    else if (roll < 0.8) type = 'zigzag';
    else type = 'shooter';

    this.spawnEnemy(type, time);

    if (Math.random() < this.config.powerupSpawnChance && time - this.lastPowerupSpawn > 5000) {
      this.spawnPowerup();
      this.lastPowerupSpawn = time;
    }
  }

  private spawnEnemy(type: EnemyType, time: number): void {
    const x = Phaser.Math.Between(20, this.config.width - 20);
    const speed = this.config.enemySpeed * Math.pow(this.config.difficultyScale, this.state.level - 1);

    const colorMap = {
      basic: COLORS.enemyBasic,
      zigzag: COLORS.enemyZigzag,
      shooter: COLORS.enemyShooter,
    };

    const pointMap = { basic: 10, zigzag: 20, shooter: 30 };

    const enemy = this.add.rectangle(x, -20, 36, 28, colorMap[type]);
    const data: EnemyData = {
      type,
      health: type === 'shooter' ? 2 : 1,
      points: pointMap[type],
      speed,
      zigzagAmplitude: 60,
      zigzagFrequency: 2,
      shootInterval: 2000,
      lastShootTime: time,
    };
    enemy.setData('enemyData', data);
    enemy.setData('spawnX', x);
    enemy.setData('spawnTime', time);
    this.enemies.add(enemy);
  }

  private spawnPowerup(): void {
    const x = Phaser.Math.Between(20, this.config.width - 20);
    const types: PowerupType[] = ['shield', 'rapidFire', 'spreadShot'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colorMap = {
      shield: COLORS.powerupShield,
      rapidFire: COLORS.powerupRapidFire,
      spreadShot: COLORS.powerupSpreadShot,
    };
    const powerup = this.add.rectangle(x, -20, 20, 20, colorMap[type]);
    powerup.setData('type', type);
    this.powerups.add(powerup);
  }

  private updateEnemies(time: number, _delta: number): void {
    const toRemove: Phaser.GameObjects.GameObject[] = [];

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.GameObjects.Rectangle;
      const data: EnemyData = enemy.getData('enemyData');
      const spawnTime: number = enemy.getData('spawnTime');
      const elapsed = (time - spawnTime) / 1000;

      enemy.y += data.speed / 60;

      if (data.type === 'zigzag') {
        const spawnX: number = enemy.getData('spawnX');
        enemy.x = spawnX + Math.sin(elapsed * (data.zigzagFrequency ?? 2)) * (data.zigzagAmplitude ?? 60);
      }

      if (data.type === 'shooter' && time - (data.lastShootTime ?? 0) > (data.shootInterval ?? 2000)) {
        this.createBullet(enemy.x, enemy.y + 14, false, 0);
        data.lastShootTime = time;
      }

      if (enemy.y > this.config.height + 30) toRemove.push(enemy);
    });

    toRemove.forEach((e) => { (e as Phaser.GameObjects.Rectangle).destroy(); this.enemies.remove(e); });
  }

  private updateBullets(): void {
    const removePlayer: Phaser.GameObjects.GameObject[] = [];
    const removeEnemy: Phaser.GameObjects.GameObject[] = [];

    this.playerBullets.getChildren().forEach((obj) => {
      const b = obj as Phaser.GameObjects.Rectangle;
      b.x += b.getData('vx') / 60;
      b.y += b.getData('vy') / 60;
      if (b.y < -20 || b.x < -20 || b.x > this.config.width + 20) removePlayer.push(b);
    });

    this.enemyBullets.getChildren().forEach((obj) => {
      const b = obj as Phaser.GameObjects.Rectangle;
      b.y += b.getData('vy') / 60;
      if (b.y > this.config.height + 20) removeEnemy.push(b);
    });

    this.powerups.getChildren().forEach((obj) => {
      const p = obj as Phaser.GameObjects.Rectangle;
      p.y += 80 / 60;
    });

    removePlayer.forEach((b) => { (b as Phaser.GameObjects.Rectangle).destroy(); this.playerBullets.remove(b); });
    removeEnemy.forEach((b) => { (b as Phaser.GameObjects.Rectangle).destroy(); this.enemyBullets.remove(b); });
  }

  private checkCollisions(): void {
    if (this.state.activePowerup !== 'shield') {
      this.checkEnemyBulletsVsPlayer();
      this.checkEnemiesVsPlayer();
    }
    this.checkPlayerBulletsVsEnemies();
    this.checkPowerupsVsPlayer();
  }

  private overlaps(
    a: Phaser.GameObjects.Rectangle,
    b: Phaser.GameObjects.Rectangle
  ): boolean {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
  }

  private checkEnemyBulletsVsPlayer(): void {
    const toRemove: Phaser.GameObjects.GameObject[] = [];
    this.enemyBullets.getChildren().forEach((obj) => {
      const b = obj as Phaser.GameObjects.Rectangle;
      if (this.overlaps(b, this.player)) {
        this.damagePlayer(1);
        toRemove.push(b);
      }
    });
    toRemove.forEach((b) => { (b as Phaser.GameObjects.Rectangle).destroy(); this.enemyBullets.remove(b); });
  }

  private checkEnemiesVsPlayer(): void {
    const toRemove: Phaser.GameObjects.GameObject[] = [];
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.GameObjects.Rectangle;
      if (this.overlaps(e, this.player)) {
        this.damagePlayer(1);
        toRemove.push(e);
      }
    });
    toRemove.forEach((e) => { (e as Phaser.GameObjects.Rectangle).destroy(); this.enemies.remove(e); });
  }

  private checkPlayerBulletsVsEnemies(): void {
    const bulletsToRemove: Phaser.GameObjects.GameObject[] = [];
    const enemiesToRemove: Phaser.GameObjects.GameObject[] = [];

    this.playerBullets.getChildren().forEach((bObj) => {
      const bullet = bObj as Phaser.GameObjects.Rectangle;
      this.enemies.getChildren().forEach((eObj) => {
        const enemy = eObj as Phaser.GameObjects.Rectangle;
        if (bulletsToRemove.includes(bullet) || enemiesToRemove.includes(enemy)) return;
        if (this.overlaps(bullet, enemy)) {
          bulletsToRemove.push(bullet);
          const data: EnemyData = enemy.getData('enemyData');
          data.health -= 1;
          if (data.health <= 0) {
            enemiesToRemove.push(enemy);
            this.addScore(data.points);
            this.state.enemiesDestroyed++;
            this.checkLevelUp();
          }
        }
      });
    });

    bulletsToRemove.forEach((b) => { (b as Phaser.GameObjects.Rectangle).destroy(); this.playerBullets.remove(b); });
    enemiesToRemove.forEach((e) => { (e as Phaser.GameObjects.Rectangle).destroy(); this.enemies.remove(e); });
  }

  private checkPowerupsVsPlayer(): void {
    const toRemove: Phaser.GameObjects.GameObject[] = [];
    this.powerups.getChildren().forEach((obj) => {
      const p = obj as Phaser.GameObjects.Rectangle;
      if (this.overlaps(p, this.player)) {
        this.activatePowerup(p.getData('type'), this.time.now);
        toRemove.push(p);
      }
      if (p.y > this.config.height + 30) toRemove.push(p);
    });
    toRemove.forEach((p) => { (p as Phaser.GameObjects.Rectangle).destroy(); this.powerups.remove(p); });
  }

  private activatePowerup(type: PowerupType, time: number): void {
    this.state.activePowerup = type;
    this.state.powerupExpiry = time + this.config.powerupDuration;

    if (type === 'rapidFire') {
      this.state.fireRate = this.config.playerFireRate / 3;
    } else {
      this.state.fireRate = this.config.playerFireRate;
    }

    if (type === 'shield') {
      this.player.setFillStyle(COLORS.powerupShield);
    }
  }

  private checkPowerupExpiry(time: number): void {
    if (this.state.activePowerup && time > this.state.powerupExpiry) {
      if (this.state.activePowerup === 'shield') {
        this.player.setFillStyle(COLORS.player);
      }
      this.state.activePowerup = null;
      this.state.fireRate = this.config.playerFireRate;
    }
  }

  private damagePlayer(amount: number): void {
    this.state.health -= amount;
    this.cameras.main.shake(200, 0.01);

    if (this.state.health <= 0) {
      this.triggerGameOver();
    }
  }

  private addScore(points: number): void {
    let multiplier = 1;
    if (this.state.activePowerup) multiplier += 0.5;
    multiplier += (this.state.level - 1) * 0.1;
    this.state.score += Math.floor(points * multiplier);
  }

  private checkLevelUp(): void {
    if (this.state.enemiesDestroyed >= this.config.enemiesPerLevel * this.state.level) {
      this.state.level++;
      this.cameras.main.flash(500, 255, 255, 0);
    }
  }

  private triggerGameOver(): void {
    this.state.isGameOver = true;
    this.player.destroy();

    const finalScore = this.gameOverContainer.getByName('finalScore') as Phaser.GameObjects.Text;
    finalScore.setText(`Score: ${this.state.score}  |  Niveau: ${this.state.level}`);
    this.gameOverContainer.setVisible(true);
  }

  private updateUI(): void {
    this.scoreText.setText(`Score: ${this.state.score}`);
    this.levelText.setText(`Niveau: ${this.state.level}`);
    this.healthText.setText('Vie: ' + '❤️'.repeat(Math.max(0, this.state.health)));

    if (this.state.activePowerup) {
      const remaining = Math.ceil((this.state.powerupExpiry - this.time.now) / 1000);
      const names = { shield: 'Bouclier', rapidFire: 'Tir rapide', spreadShot: 'Tir dispersé' };
      this.powerupText.setText(`✨ ${names[this.state.activePowerup]} (${remaining}s)`);
    } else {
      this.powerupText.setText('');
    }
  }
}
