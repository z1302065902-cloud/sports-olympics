// ============================================================
// game.js — 奥运50关 · 运动大冒险 主引擎
// 场景：菜单 → 选关(50格) → 游戏(3种玩法模板) → 结算
// 进度存 localStorage，BGM 随关换调，卡通背景 8 主题
// ============================================================
const SAVE_KEY = 'sports50_progress';

function loadProg() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } }
function saveProg(p) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch (e) {} }

// ---------- 菜单 ----------
class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); }
  create() {
    this.prog = loadProg();
    new BgWorld(this, 'stadium', 0);
    const W = this.scale.width, H = this.scale.height;
    this.add.text(W / 2, H * 0.24, '🏅 奥运 50 关', { fontSize: 56, fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#7a4a9a', 8).setShadow(0, 4, '#00000055', 6);
    this.add.text(W / 2, H * 0.34, '运动大冒险', { fontSize: 30, color: '#ffe66d' }).setOrigin(0.5)
      .setStroke('#7a4a9a', 6);
    this.add.text(W / 2, H * 0.43, '50 个体育项目 · 每关不同玩法', { fontSize: 18, color: '#ffffff' }).setOrigin(0.5);
    const done = Object.values(this.prog).filter(v => v >= 2).length;
    const stars = Object.values(this.prog).reduce((a, v) => a + (v === 3 ? 1 : 0), 0);
    this.add.text(W / 2, H * 0.5, `已完成 ${done}/50 · ⭐${stars}`, { fontSize: 20, color: '#aee3ff' }).setOrigin(0.5);
    const btn = this.add.graphics().fillStyle(0xff6b35, 1).fillRoundedRect(W / 2 - 100, H * 0.6, 200, 60, 16);
    this.add.text(W / 2, H * 0.63, '开始挑战', { fontSize: 26, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    const zone = this.add.zone(W / 2, H * 0.63, 200, 60).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { SFX.play('click'); SFX.unlock(); SFX.startBgm(0); this.scene.start('map'); });
    this.add.text(W / 2, H * 0.75, '🖱️ 鼠标 / 📱 触控 均可玩', { fontSize: 16, color: '#ffffff' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.8, '提示：蓄力类按住按钮，连击类疯狂点击，时机类看准再点', { fontSize: 14, color: '#c5e8ff' }).setOrigin(0.5);
  }
}

// ---------- 选关 ----------
class MapScene extends Phaser.Scene {
  constructor() { super('map'); }
  create() {
    this.prog = loadProg();
    new BgWorld(this, 'stadium', 0);
    const W = this.scale.width, H = this.scale.height;
    this.add.text(W / 2, 40, '选择关卡', { fontSize: 32, fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#7a4a9a', 6);
    this.add.text(W / 2, 70, '🏅 = 金牌 · 🥈 = 银牌 · 🥉 = 铜牌', { fontSize: 14, color: '#ffe66d' }).setOrigin(0.5);
    const cols = 10, rows = 5, cw = W / cols, chh = (H - 110) / rows;
    let unlocked = 1;
    for (let i = 0; i < LEVELS.length; i++) {
      const lv = LEVELS[i], num = i + 1;
      const star = this.prog['lv' + num] || 0;
      const x = cw * (i % cols) + cw / 2, y = 100 + chh * Math.floor(i / cols) + chh / 2;
      const r = Math.min(cw, chh) * 0.28;
      const color = star >= 3 ? 0xffd166 : star >= 2 ? 0xc0c0c0 : star >= 1 ? 0xcd7f32 : 0x3a3a5a;
      const isUnlocked = num <= unlocked || star > 0;
      if (isUnlocked) unlocked = Math.max(unlocked, num);
      const g = this.add.graphics();
      g.fillStyle(color, 1).fillCircle(x, y, r);
      if (!isUnlocked) g.lineStyle(2, 0xffffff, 0.3).strokeCircle(x, y, r);
      this.add.text(x, y, (star >= 3 ? '🏅' : star >= 2 ? '🥈' : star >= 1 ? '🥉' : ''), { fontSize: r * 0.7 })
        .setOrigin(0.5).setY(y - r * 0.8);
      this.add.text(x, y + r * 0.15, String(num), { fontSize: r * 0.8, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      if (isUnlocked) {
        const zone = this.add.zone(x, y, r * 2, r * 2).setInteractive({ useHandCursor: true });
        const idx = i;
        zone.on('pointerdown', () => { SFX.play('click'); this.startLevel(idx); });
      }
    }
    const back = this.add.text(40, 32, '◀ 菜单', { fontSize: 18, color: '#ffffff' }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.play('click'); this.scene.start('menu'); });
  }
  startLevel(idx) { this.scene.start('game', { level: LEVELS[idx], index: idx }); }
}

// ---------- 游戏 ----------
class GameScene extends Phaser.Scene {
  constructor() { super('game'); }
  init(data) { this.level = data.level; this.index = data.index; }
  create() {
    this.prog = loadProg();
    const lv = this.level;
    this.score = 0; this.over = false;
    new BgWorld(this, lv.bg, 0);
    SFX.unlock(); SFX.startBgm(this.index % 6);
    const W = this.scale.width, H = this.scale.height;
    this.add.text(W / 2, 30, `${lv.emoji} 第${this.index + 1}关 · ${lv.name}`, { fontSize: 26, fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#7a4a9a', 5);
    this.add.text(W / 2, 58, lv.desc, { fontSize: 15, color: '#ffe66d' }).setOrigin(0.5);
    if (lv.mode === 'timing') this.initTiming(W, H);
    else if (lv.mode === 'power') this.initPower(W, H);
    else if (lv.mode === 'combo') this.initCombo(W, H);
    else if (lv.mode === 'timing-power') this.initTimingPower(W, H);
    else if (lv.mode === 'power-angle') this.initPowerAngle(W, H);
    else if (lv.mode === 'combo-timing') this.initComboTiming(W, H);
    const back = this.add.text(34, 28, '◀ 关卡', { fontSize: 16, color: '#ffffff' }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.play('click'); SFX.stopBgm(); this.scene.start('map'); });
  }

  // 时机玩法
  initTiming(W, H) {
    const lv = this.level;
    this.attempts = 3; this.total = 0;
    const barW = W * 0.7, barH = 26, bx = (W - barW) / 2, by = H * 0.4;
    const targetCenter = W * 0.5 + Phaser.Math.Between(-barW * 0.2, barW * 0.2);
    this.green = this.add.rectangle(targetCenter, by, barW * 0.16, barH + 6, 0x4ade80, 0.85);
    this.add.rectangle(W / 2, by, barW, barH + 6, 0x222244, 0.9);
    this.pointer = this.add.rectangle(bx, by, 6, barH + 12, 0xffffff).setDepth(2);
    this.dir = 1; this.speed = 6 + lv.time * 0.6;
    this.zone = this.add.zone(W / 2, H * 0.72, W, 160).setInteractive();
    this.zone.on('pointerdown', () => this.timingTap());
    this.attemptsText = this.add.text(W / 2, H * 0.62, '', { fontSize: 16, color: '#ffffff' }).setOrigin(0.5);
    this.scoreText = this.add.text(W / 2, H * 0.7, '点击停指针！', { fontSize: 18, color: '#ffe66d' }).setOrigin(0.5);
    this.updateAttempts(); this.anim();
  }
  updateAttempts() { this.attemptsText.setText(`剩余 ${this.attempts} 次机会 · 得分 ${this.total}`); }
  timingTap() {
    if (this.over) return;
    const barW = this.scale.width * 0.7, bx = (this.scale.width - barW) / 2;
    const px = this.pointer.x, gc = this.green.x;
    const dist = Math.abs(px - gc) / (barW * 0.16);
    let pts = dist <= 0.5 ? 100 : dist <= 1.5 ? Math.max(30, 100 - dist * 35) : Math.max(5, 100 - dist * 20);
    if (dist <= 0.5) SFX.play('big'); else if (dist <= 1.5) SFX.play('score'); else SFX.play('tap');
    this.total += pts; this.attempts--;
    this.scoreText.setText(`+${Math.round(pts)} 分`);
    const floater = this.add.text(this.pointer.x, this.pointer.y - 20, `+${Math.round(pts)}`, { fontSize: 18, color: '#4ade80' }).setOrigin(0.5).setDepth(5).setScale(0);
    this.tweens.add({ targets: floater, y: floater.y - 25, scale: 1, alpha: 0, duration: 500 });
    this.updateAttempts();
    if (this.attempts <= 0) {
      if (this.level.mode === 'timing-power') { this.total *= 0.5; this.initPowerStage2(); }
      else this.finish(this.total / 3);
    } else this.anim();
  }
  anim() {
    const barW = this.scale.width * 0.7, bx = (this.scale.width - barW) / 2;
    this.tweens.add({ targets: this.pointer, x: this.dir > 0 ? bx + barW : bx, duration: (this.speed + this.total * 0.3), onComplete: () => { this.dir *= -1; this.anim(); } });
  }

  // timing+power 复合（跳远）
  initTimingPower(W, H) { this.phase = 'timing'; this.total = 0; this.attempts = 3; this.initTiming(W, H); }
  initPowerStage2() {
    this.phase = 'power'; this.powerVal = 0; this.powerDir = 1;
    const W = this.scale.width, H = this.scale.height;
    const barW = W * 0.6, barH = 30, bx = (W - barW) / 2, by = H * 0.3;
    const targetCenter = W * 0.5 + Phaser.Math.Between(-barW * 0.2, barW * 0.2);
    this.green2 = this.add.rectangle(targetCenter, by, barW * 0.18, barH + 4, 0x4ade80, 0.85);
    this.add.rectangle(W / 2, by, barW, barH + 4, 0x222244, 0.9);
    this.fill2 = this.add.rectangle(bx + 2, by, 0, barH, 0xffd166).setOrigin(0, 0.5);
    this.btn2 = this.add.circle(W / 2, H * 0.48, 48, 0x00b894).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.48, '起跳', { fontSize: 18, color: '#ffffff' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.22, '起跳蓄力！', { fontSize: 20, color: '#ffe66d' }).setOrigin(0.5);
    this.btn2.on('pointerdown', () => { this.phase2 = 'charging'; });
    this.btn2.on('pointerup', () => this.powerRelease2());
    this.btn2.on('pointerout', () => this.powerRelease2());
  }
  powerRelease2() {
    if (this.over || this.phase2 !== 'charging') return;
    this.phase2 = null;
    const barW = this.scale.width * 0.6, gc = this.green2.x, bx = (this.scale.width - barW) / 2;
    const targetPct = (gc - bx) / barW * 100;
    const dist = Math.abs(this.powerVal - targetPct) / 10;
    let pts = dist <= 0.5 ? 100 : dist <= 1.5 ? Math.max(30, 100 - dist * 35) : Math.max(5, 100 - dist * 20);
    if (dist <= 0.5) SFX.play('big'); else if (dist <= 1.5) SFX.play('score'); else SFX.play('tap');
    this.total += pts * 0.5; this.finish(this.total);
  }

  // power+angle 复合（铅球/标枪/铁饼）
  initPowerAngle(W, H) {
    this.total = 0; this.attempts = 3; this.angle = 0;
    const barW = W * 0.6, barH = 30, bx = (W - barW) / 2, by = H * 0.35;
    const targetCenter = W * 0.5 + Phaser.Math.Between(-barW * 0.2, barW * 0.2);
    this.green = this.add.rectangle(targetCenter, by, barW * 0.16, barH + 4, 0x4ade80, 0.85);
    this.add.rectangle(W / 2, by, barW, barH + 4, 0x222244, 0.9);
    this.fill = this.add.rectangle(bx + 2, by, 0, barH, 0xffd166).setOrigin(0, 0.5);
    this.angleCircle = this.add.circle(W * 0.2, H * 0.65, 60, 0x222244).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
    this.angleNeedle = this.add.line(W * 0.2, H * 0.65, 0, 0, 50, 0, 0xff6b35, 2);
    this.angleCircle.on('pointerdown', (p) => {
      this.angle = Math.atan2(p.y - H * 0.65, p.x - W * 0.2) * 180 / Math.PI;
      this.angleNeedle.clear().lineStyle(3, 0xff6b35).lineTo(50 * Math.cos(this.angle * Math.PI / 180), 50 * Math.sin(this.angle * Math.PI / 180)).translate(W * 0.2, H * 0.65);
    });
    this.btn = this.add.circle(W * 0.75, H * 0.65, 42, 0xff6b35).setInteractive({ useHandCursor: true });
    this.add.text(W * 0.75, H * 0.65, '蓄力', { fontSize: 16, color: '#ffffff' }).setOrigin(0.5);
    this.btn.on('pointerdown', () => { if (!this.over) { this.phase = 'charging'; SFX.play('tap'); } });
    this.btn.on('pointerup', () => this.powerAngleRelease());
    this.attemptsText = this.add.text(W / 2, H * 0.78, '', { fontSize: 16, color: '#ffffff' }).setOrigin(0.5);
    this.updatePowerAngleUI();
  }
  updatePowerAngleUI() {
    const barW = this.scale.width * 0.6;
    this.fill.width = (this.powerVal / 100) * barW;
    this.attemptsText.setText(`剩余 ${this.attempts} 次 · 得分 ${Math.round(this.total)} · 角度 ${Math.round(this.angle)}°`);
  }
  powerAngleRelease() {
    if (this.over || this.phase !== 'charging') return;
    this.phase = null;
    const barW = this.scale.width * 0.6, gc = this.green.x, bx = (this.scale.width - barW) / 2;
    const targetPct = (gc - bx) / barW * 100;
    const dist = Math.abs(this.powerVal - targetPct) / 10;
    let pts = dist <= 0.5 ? 100 : dist <= 1.5 ? Math.max(30, 100 - dist * 35) : Math.max(5, 100 - dist * 20);
    if (dist <= 0.5) SFX.play('big'); else if (dist <= 1.5) SFX.play('score'); else SFX.play('tap');
    const angleErr = Math.abs(this.angle - 45);
    pts = pts * (1 - angleErr / 90);
    this.total += pts; this.attempts--;
    const floater = this.add.text(this.btn.x, this.btn.y - 40, `+${Math.round(pts)}`, { fontSize: 20, color: '#4ade80' }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: floater, y: floater.y - 30, alpha: 0, duration: 500 });
    this.updatePowerAngleUI();
    if (this.attempts <= 0) this.finish(this.total / 3);
  }

  // combo+timing 复合（游泳）
  initComboTiming(W, H) {
    this.total = 0; this.count = 0; this.timeLeft = this.level.time; this.phase = null;
    this.scoreText = this.add.text(W / 2, H * 0.4, '点击屏幕划水！', { fontSize: 24, color: '#ffe66d' }).setOrigin(0.5);
    this.timeText = this.add.text(W / 2, H * 0.48, `倒计时 ${this.timeLeft}s`, { fontSize: 18, color: '#ffffff' }).setOrigin(0.5);
    this.zone = this.add.zone(W / 2, H * 0.65, W, 180).setInteractive();
    this.zone.on('pointerdown', () => {
      if (this.over) return;
      if (!this.phase) { this.phase = 'go'; SFX.play('go');
        this.countdownTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
          this.timeLeft--; this.timeText.setText(`倒计时 ${this.timeLeft}s`); SFX.play('count');
          if (this.timeLeft <= 0) this.finishComboTiming();
        }});
      }
      this.count++; SFX.play('tap');
      this.scoreText.setText(`🏊 ${this.count} 次划水`);
      const floater = this.add.text(W / 2 + Phaser.Math.Between(-40, 40), H * 0.32, '💦', { fontSize: 22 }).setOrigin(0.5).setDepth(4);
      this.tweens.add({ targets: floater, y: floater.y - 40, alpha: 0, duration: 400 });
    });
  }
  finishComboTiming() {
    this.over = true;
    const target = this.level.target * 3;
    this.finish(Math.min(100, (this.count / target) * 100));
  }

  // 蓄力玩法
  initPower(W, H) {
    this.powerVal = 0; this.powerDir = 1; this.phase = 'idle'; this.attempts = 3; this.total = 0;
    const barW = W * 0.6, barH = 30, bx = (W - barW) / 2, by = H * 0.42;
    const targetCenter = W * 0.5 + Phaser.Math.Between(-barW * 0.2, barW * 0.2);
    this.green = this.add.rectangle(targetCenter, by, barW * 0.14, barH + 4, 0x4ade80, 0.85);
    this.add.rectangle(W / 2, by, barW, barH + 4, 0x222244, 0.9);
    this.fill = this.add.rectangle(bx + 2, by, 0, barH, 0xffd166).setOrigin(0, 0.5).setDepth(1);
    this.btn = this.add.circle(W / 2, H * 0.7, 42, 0xff6b35).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.7, '按住\n蓄力', { fontSize: 16, color: '#ffffff', align: 'center' }).setOrigin(0.5);
    this.btn.on('pointerdown', () => { if (!this.over) { this.phase = 'charging'; SFX.play('tap'); } });
    this.btn.on('pointerup', () => this.powerRelease());
    this.btn.on('pointerout', () => this.powerRelease());
    this.attemptsText = this.add.text(W / 2, H * 0.62, '', { fontSize: 16, color: '#ffffff' }).setOrigin(0.5);
    this.powerText = this.add.text(W / 2, H * 0.52, '', { fontSize: 20, color: '#ffe66d' }).setOrigin(0.5);
    this.updatePowerUI();
  }
  updatePowerUI() {
    const barW = this.scale.width * 0.6;
    this.fill.width = (this.powerVal / 100) * barW;
    this.powerText.setText(`${Math.round(this.powerVal)}%`);
    this.attemptsText.setText(`剩余 ${this.attempts} 次 · 得分 ${Math.round(this.total)}`);
  }
  powerRelease() {
    if (this.over || this.phase !== 'charging') return;
    this.phase = 'idle';
    const gc = this.green.x, barW = this.scale.width * 0.6;
    const dist = Math.abs(this.powerVal - (100 * (gc - (this.scale.width - barW) / 2) / barW)) / 10;
    let pts = dist <= 0.5 ? 100 : dist <= 1.5 ? Math.max(30, 100 - dist * 35) : Math.max(5, 100 - dist * 20);
    if (dist <= 0.5) SFX.play('big'); else if (dist <= 1.5) SFX.play('score'); else SFX.play('tap');
    this.total += pts; this.attempts--;
    const floater = this.add.text(this.btn.x, this.btn.y - 40, `+${Math.round(pts)}`, { fontSize: 20, color: '#4ade80' }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: floater, y: floater.y - 30, alpha: 0, duration: 500 });
    this.updatePowerUI();
    if (this.attempts <= 0) this.finish(this.total / 3);
  }

  // 连击玩法
  initCombo(W, H) {
    const lv = this.level;
    this.count = 0; this.timeLeft = lv.time; this.phase = 'ready';
    this.scoreText = this.add.text(W / 2, H * 0.55, '点击屏幕连击！', { fontSize: 24, color: '#ffe66d' }).setOrigin(0.5);
    this.timeText = this.add.text(W / 2, H * 0.62, `倒计时 ${this.timeLeft}s`, { fontSize: 18, color: '#ffffff' }).setOrigin(0.5);
    this.zone = this.add.zone(W / 2, H * 0.7, W, 200).setInteractive();
    this.zone.on('pointerdown', () => {
      if (this.over) return;
      if (this.phase === 'ready') { this.phase = 'go'; SFX.play('go');
        this.countdownTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
          this.timeLeft--; this.timeText.setText(`倒计时 ${this.timeLeft}s`); SFX.play('count');
          if (this.timeLeft <= 0) this.finish(this.count);
        }}); return;
      }
      this.count++; SFX.play('tap');
      this.scoreText.setText(`⚡ ${this.count}`);
      const floater = this.add.text(W / 2 + Phaser.Math.Between(-40, 40), H * 0.45, '⚡', { fontSize: 22 }).setOrigin(0.5).setDepth(4);
      this.tweens.add({ targets: floater, y: floater.y - 40, alpha: 0, duration: 400 });
    });
  }

  // 通用更新
  update(time, delta) {
    if (this.phase === 'charging' && !this.over) {
      this.powerVal += delta * 0.12 * this.powerDir;
      if (this.powerVal >= 100) { this.powerVal = 100; this.powerDir = -1; }
      if (this.powerVal <= 0) { this.powerVal = 0; this.powerDir = 1; }
      this.updatePowerUI();
    }
    if (this.phase2 === 'charging' && !this.over) {
      this.powerVal += delta * 0.12 * this.powerDir;
      if (this.powerVal >= 100) { this.powerVal = 100; this.powerDir = -1; }
      if (this.powerVal <= 0) { this.powerVal = 0; this.powerDir = 1; }
      this.updatePowerAngleUI && this.updatePowerAngleUI();
    }
  }

  // 结算
  finish(avg) {
    if (this.over) return;
    this.over = true; SFX.stopBgm();
    const lv = this.level, final = Math.round(avg);
    const stars = final >= lv.target ? 3 : final >= lv.target * 0.7 ? 2 : final >= lv.target * 0.5 ? 1 : 0;
    const key = 'lv' + (this.index + 1);
    this.prog[key] = Math.max(this.prog[key] || 0, stars);
    saveProg(this.prog);
    if (stars >= 2) SFX.play('win'); else SFX.play(stars >= 1 ? 'score' : 'lose');
    this.time.delayedCall(600, () => this.scene.start('result', { level: lv, index: this.index, score: final, stars, target: lv.target }));
  }
}

// ---------- 结算 ----------
class ResultScene extends Phaser.Scene {
  constructor() { super('result'); }
  init(d) { this.d = d; }
  create() {
    const { level: lv, index, score, stars, target } = this.d;
    new BgWorld(this, lv.bg, 0);
    const W = this.scale.width, H = this.scale.height;
    this.add.text(W / 2, H * 0.18, `${lv.emoji} ${lv.name}`, { fontSize: 34, fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#7a4a9a', 6);
    const medals = ['❌', '🥉', '🥈', '🏅'];
    this.medal = this.add.text(W / 2, H * 0.33, medals[stars], { fontSize: 90 }).setOrigin(0.5);
    this.tweens.add({ targets: this.medal, y: this.medal.y - 20, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.text(W / 2, H * 0.5, `得分 ${score}`, { fontSize: 30, color: '#ffe66d' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.57, `目标 ${target} · ${stars >= 3 ? '金牌🏅' : stars >= 2 ? '银牌🥈' : stars >= 1 ? '铜牌🥉' : '继续加油'}`,
      { fontSize: 18, color: '#ffffff' }).setOrigin(0.5);
    const mkBtn = (y, txt, cb) => {
      this.add.graphics().fillStyle(0xff6b35, 1).fillRoundedRect(W / 2 - 90, y, 180, 48, 14);
      this.add.text(W / 2, y + 24, txt, { fontSize: 20, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y + 24, 180, 48).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { SFX.play('click'); cb(); });
    };
    mkBtn(H * 0.68, index < 49 ? '下一关 ▶' : '完成啦🎉', () => {
      if (index < 49) { SFX.unlock(); SFX.startBgm((index + 1) % 6); this.scene.start('game', { level: LEVELS[index + 1], index: index + 1 }); }
      else this.scene.start('menu');
    });
    mkBtn(H * 0.78, '重玩本关', () => { SFX.unlock(); SFX.startBgm(index % 6); this.scene.start('game', { level: lv, index }); });
    mkBtn(H * 0.88, '返回选关', () => { SFX.unlock(); SFX.startBgm(0); this.scene.start('map'); });
  }
}

// ---------- 启动 ----------
const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 600 },
  scene: [MenuScene, MapScene, GameScene, ResultScene],
};
new Phaser.Game(config);
